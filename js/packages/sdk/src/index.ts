import { type Context, evaluateRules } from "@railswitch/rule-evaluator";
import type { Rules } from "@railswitch/schemas";
import { Socket } from "phoenix";

export type { Context };

export interface SDKOptions {
	url: string;
	apiKey: string;
	environment: string;
}

interface FlagSnapshot {
	flags: Record<string, Rules>;
}

interface FlagChange {
	flag: string;
	rules: Rules;
}

interface FlagRemoval {
	flag: string;
}

export function setupSdk(options: SDKOptions, globalContext: Context) {
	let connectionEstablished = false;
	let environmentFlags: Record<string, Rules> | null = null;

	const { url, apiKey, environment } = options;
	const socket = new Socket(url, { params: { api_key: apiKey } });

	socket.onError((error) => {
		connectionEstablished = false;
		console.error("Railswitch SDK socket error:", error);
	});
	socket.onClose((event) => {
		connectionEstablished = false;
		console.warn("Railswitch SDK socket closed:", event);
	});

	const environmentChannel = socket.channel(environment);

	const applyFlagChange = (payload: FlagChange) => {
		if (environmentFlags === null) {
			return;
		}
		environmentFlags[payload.flag] = payload.rules;
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
		console.error(`Railswitch SDK environment ${environment} was deleted.`);
		connectionEstablished = false;
		environmentFlags = null;
		environmentChannel.leave();
	});

	environmentChannel
		.join()
		.receive("ok", (reply: FlagSnapshot) => {
			connectionEstablished = true;
			environmentFlags = reply.flags;
		})
		.receive("error", (reason) => {
			connectionEstablished = false;
			console.error(`Railswitch SDK failed to join ${environment}:`, reason);
		})
		.receive("timeout", () => {
			connectionEstablished = false;
			console.error(`Railswitch SDK timed out joining ${environment}.`);
		});

	return {
		teardown() {
			environmentChannel.leave();
			socket.disconnect();
		},
		rsx(flagName: string, localContext: Context, defaultValue: unknown) {
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

			if (environmentFlags[flagName] == null) {
				console.warn(`Invalid flag name during flag evaluation: ${flagName}`);
				return defaultValue;
			}

			return evaluateRules(
				{ ...globalContext, ...localContext },
				environmentFlags[flagName],
				defaultValue,
			);
		},
	};
}
