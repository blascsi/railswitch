import { Heading } from "@astryxdesign/core/Heading";
import { VStack } from "@astryxdesign/core/VStack";
import { createFileRoute } from "@tanstack/react-router";

import { CreateOrganizationForm } from "../../../components/organizations/CreateOrganizationForm";
import { pageTitle } from "../../../utils/pageTitle";

export const Route = createFileRoute("/_authenticated/organizations/create")({
  head: () => ({ meta: [{ title: pageTitle("Create organization") }] }),
  component: OrganizationCreatePage,
});

function OrganizationCreatePage() {
  return (
    <VStack>
      <Heading level={1}>Create organization</Heading>
      <CreateOrganizationForm />
    </VStack>
  );
}
