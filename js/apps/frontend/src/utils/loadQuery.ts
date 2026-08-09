import type {
  AnyVariables,
  Client,
  DocumentInput,
  OperationResult,
} from "urql";
import { pipe, take, toPromise } from "wonka";

export async function loadQuery<Data, Variables extends AnyVariables>(
  client: Client,
  query: DocumentInput<Data, Variables>,
  variables: Variables,
): Promise<OperationResult<Data, Variables>> {
  const result = await pipe(client.query(query, variables), take(1), toPromise);

  if (result.error && result.data === undefined) {
    throw result.error;
  }

  return result;
}
