import { useRouter } from "@tanstack/react-router";
import { useMutation } from "urql";

import { graphql, readFragment, type FragmentOf } from "../../graphql/graphql";
import { getSubmissionErrors } from "../../utils/apiErrorMessage";
import {
  OrganizationForm,
  type OrganizationFormValues,
} from "./OrganizationForm";

export const updateOrganizationForm_organization = graphql(`
  fragment updateOrganizationForm_organization on Organization {
    id
    name
  }
`);

const UpdateOrganizationMutation = graphql(`
  mutation UpdateOrganization($id: ID!, $input: UpdateOrganizationInput!) {
    updateOrganization(id: $id, input: $input) {
      result {
        id
      }
      errors {
        message
        fields
      }
    }
  }
`);

type UpdateOrganizationFormProps = {
  organization: FragmentOf<typeof updateOrganizationForm_organization>;
};

export function UpdateOrganizationForm({
  organization,
}: UpdateOrganizationFormProps) {
  const router = useRouter();
  const organizationData = readFragment(
    updateOrganizationForm_organization,
    organization,
  );
  const [{ fetching }, updateOrganization] = useMutation(
    UpdateOrganizationMutation,
  );

  const handleOrganizationUpdateSubmit = async (
    values: OrganizationFormValues,
  ) => {
    const { data, error } = await updateOrganization({
      id: organizationData.id,
      input: { name: values.name },
    });

    if (data?.updateOrganization.result != null) {
      await router.invalidate({
        filter: (match) => match.routeId == "/_authenticated",
      });
      await router.navigate({ to: "/organizations" });
      return;
    }

    return getSubmissionErrors(error, data?.updateOrganization.errors);
  };

  return (
    <>
      <OrganizationForm
        submitLabel="Update"
        initialValues={organizationData}
        isPending={fetching}
        onSubmit={handleOrganizationUpdateSubmit}
      />
    </>
  );
}
