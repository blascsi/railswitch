import { Heading } from "@astryxdesign/core/Heading";
import { VStack } from "@astryxdesign/core/VStack";
import { createFileRoute } from "@tanstack/react-router";

import { CreateEnvironmentApiKeyForm } from "../../../../../../../../components/environment-api-keys/CreateEnvironmentApiKeyForm";
import { LinkButton } from "../../../../../../../../components/routing/link-components/LinkButton";
import { graphql } from "../../../../../../../../graphql/graphql";
import { loaderQuery } from "../../../../../../../../graphql/loaderQuery";
import { pageTitle } from "../../../../../../../../utils/pageTitle";

const CreateEnvironmentApiKeyPageQuery = graphql(`
  query CreateEnvironmentApiKeyPageQuery(
    $projectName: String!
    $environmentName: String!
  ) {
    getEnvironmentByName(
      projectName: $projectName
      environmentName: $environmentName
    ) {
      id
    }
  }
`);

export const Route = createFileRoute(
  "/_authenticated/o/$organizationId/project/$projectName/environment/$environmentName/create_api_key",
)({
  loader: ({ context, params }) =>
    loaderQuery(context.client, CreateEnvironmentApiKeyPageQuery, {
      projectName: params.projectName,
      environmentName: params.environmentName,
    }),
  head: () => ({ meta: [{ title: pageTitle("Create API key") }] }),
  component: EnvironmentApiKeyCreatePage,
});

function EnvironmentApiKeyCreatePage() {
  const loaderData = Route.useLoaderData();
  const { getEnvironmentByName } = loaderData;
  const environmentId = getEnvironmentByName?.id;

  return (
    <VStack gap={4}>
      <Heading level={1}>Create API key</Heading>
      {environmentId != null && (
        <CreateEnvironmentApiKeyForm
          environmentId={environmentId}
          actions={
            <LinkButton
              label="Done"
              variant="primary"
              from={Route.fullPath}
              to="/o/$organizationId/project/$projectName/environment/$environmentName"
            />
          }
        />
      )}
    </VStack>
  );
}
