import type {
  AnyVariables,
  Client,
  DocumentInput,
  OperationContext,
} from "urql";

/**
 * Runs a route loader's query, returning its data and throwing everything else
 * for the route's error component to render.
 */
export async function loaderQuery<Data, Variables extends AnyVariables>(
  client: Client,
  query: DocumentInput<Data, Variables>,
  variables: Variables,
  context?: Partial<OperationContext>,
): Promise<Data> {
  const { data, error } = await client
    .query(query, variables, context)
    .toPromise();

  if (data == null) {
    throw error ?? new Error("The query returned no data");
  }

  return data;
}
