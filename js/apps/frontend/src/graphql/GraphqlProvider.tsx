import { useAtomValue } from "jotai";
import type { ReactNode } from "react";
import { Provider } from "urql";
import { graphqlClientAtom } from "../atoms/graphqlClient";

type GraphqlProviderProps = {
  children: ReactNode;
};

/**
 * Provides the urql client. See {@link graphqlClientAtom} for when the
 * client (and thereby its cache) is recreated.
 */
export function GraphqlProvider({ children }: GraphqlProviderProps) {
  const client = useAtomValue(graphqlClientAtom);

  return <Provider value={client}>{children}</Provider>;
}
