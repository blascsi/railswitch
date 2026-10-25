import { useRouter } from "@tanstack/react-router";
import { useMutation } from "urql";

import { graphql } from "../../graphql/graphql";
import { getSubmissionErrors } from "../../utils/apiErrorMessage";
import {
  OrganizationForm,
  type OrganizationFormValues,
} from "./OrganizationForm";

const CreateOrganizationMutation = graphql(`
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      result {
        id
        name
      }
      errors {
        message
        fields
      }
    }
  }
`);

export function CreateOrganizationForm() {
  const router = useRouter();
  const [{ fetching }, createOrganization] = useMutation(
    CreateOrganizationMutation,
  );

  const handleSubmit = async (values: OrganizationFormValues) => {
    const { data, error } = await createOrganization({
      input: { name: values.name },
    });

    if (data?.createOrganization.result != null) {
      await router.invalidate({
        filter: (match) => match.routeId == "/_authenticated",
      });
      await router.navigate({ to: "/organizations" });
      return;
    }

    return getSubmissionErrors(error, data?.createOrganization.errors);
  };

  return (
    <OrganizationForm
      submitLabel="Create organization"
      isPending={fetching}
      onSubmit={handleSubmit}
    />
  );
}
