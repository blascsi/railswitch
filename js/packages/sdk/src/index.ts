import { type Context, evaluateRules } from "@railswitch/rule-evaluator";
import {
  type Rules,
  type RuleValueResult,
  rulesSchema,
} from "@railswitch/schemas";
import { Socket } from "phoenix";

export type { Context };

export type FlagValue = RuleValueResult["value"];

export interface SDKOptions {
  url: string;
  apiKey: string;
}

interface FlagSnapshot {
  flags: Record<string, unknown>;
}

interface FlagChange {
  flag: string;
  rules: unknown;
}

interface FlagRemoval {
  flag: string;
}

function parseRules(flagName: string, rules: unknown) {
  const result = rulesSchema.safeParse(rules);

  if (!result.success) {
    console.error(
      `Railswitch SDK received invalid rules for flag ${flagName}:`,
      result.error.issues,
    );
    return null;
  }

  return result.data;
}

export function setupSdk(options: SDKOptions, globalContext: Context) {
  let connectionEstablished = false;
  let environmentFlags: Record<string, Rules> | null = null;

  const { url, apiKey } = options;
  const socket = new Socket(url, { params: { api_key: apiKey } });

  socket.onError((error) => {
    connectionEstablished = false;
    console.error("Railswitch SDK socket error:", error);
  });
  socket.onClose((event) => {
    connectionEstablished = false;
    console.warn("Railswitch SDK socket closed:", event);
  });

  socket.connect();

  const environmentChannel = socket.channel("environment");

  const applyFlagChange = (payload: FlagChange) => {
    if (environmentFlags === null) {
      return;
    }

    const rules = parseRules(payload.flag, payload.rules);

    if (rules === null) {
      return;
    }

    environmentFlags[payload.flag] = rules;
  };

  environmentChannel.on("flag_created", applyFlagChange);
  environmentChannel.on("flag_updated", applyFlagChange);
  environmentChannel.on("flag_deleted", (payload: FlagRemoval) => {
    if (environmentFlags === null) {
      return;
    }
    delete environmentFlags[payload.flag];
  });
  environmentChannel.on("environment_deleted", () => {
    console.error("Railswitch SDK environment was deleted.");
    connectionEstablished = false;
    environmentFlags = null;
    environmentChannel.leave();
  });

  environmentChannel
    .join()
    .receive("ok", (reply: FlagSnapshot) => {
      const flags: Record<string, Rules> = {};

      for (const [flagName, rules] of Object.entries(reply.flags)) {
        const parsedRules = parseRules(flagName, rules);

        if (parsedRules !== null) {
          flags[flagName] = parsedRules;
        }
      }

      connectionEstablished = true;
      environmentFlags = flags;
    })
    .receive("error", (reason) => {
      connectionEstablished = false;
      console.error("Railswitch SDK failed to join its environment:", reason);
    })
    .receive("timeout", () => {
      connectionEstablished = false;
      console.error("Railswitch SDK timed out joining its environment.");
    });

  return {
    teardown() {
      environmentChannel.leave();
      socket.disconnect();
    },
    setContextValue(key: string, value: unknown) {
      globalContext[key] = value;
    },
    rsx<T extends FlagValue>(
      flagName: string,
      localContext: Context,
      defaultValue: T,
    ): T {
      if (!connectionEstablished) {
        console.error(
          "Connection with the Railswitch SDK has not been established yet.",
        );
        return defaultValue;
      }

      if (environmentFlags === null) {
        console.error(
          "Flag data from the Railswitch backend hasn't been loaded yet.",
        );
        return defaultValue;
      }

      const rules = environmentFlags[flagName];

      if (rules == null) {
        console.warn(`Invalid flag name during flag evaluation: ${flagName}`);
        return defaultValue;
      }

      if (typeof defaultValue !== rules.resultType) {
        console.warn(
          `Default value for flag ${flagName} does not match its '${rules.resultType}' result type: ${defaultValue}`,
        );
        return defaultValue;
      }

      return evaluateRules(
        { ...globalContext, ...localContext },
        rules,
        defaultValue,
      ) as T;
    },
  };
}
