import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "urql";
import { type FragmentOf, graphql } from "../../graphql/graphql";
import {
  getMutationErrorMessage,
  getMutationFieldErrors,
} from "../../utils/apiErrorMessage";
import type { projectSelector_projects } from "../projects/ProjectSelector";
import {
  EnvironmentForm,
  type EnvironmentFormInstance,
  type EnvironmentFormValues,
} from "./EnvironmentForm";

const CreateEnvironmentMutation = graphql(
  `
  mutation CreateEnvironmentMutation($input: CreateEnvironmentInput!) {
    createEnvironment(input: $input) {
      result {
        id
      }
      errors {
        message
        fields
      }
    }
  }
`,
);

type CreateEnvironmentFormProps = {
  projects: readonly FragmentOf<typeof projectSelector_projects>[];
  isDataLoading: boolean;
};

export function CreateEnvironmentForm({
  projects,
  isDataLoading,
}: CreateEnvironmentFormProps) {
  const navigate = useNavigate();
  const [{ fetching }, createEnvironment] = useMutation(
    CreateEnvironmentMutation,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (
    values: EnvironmentFormValues,
    form: EnvironmentFormInstance,
  ) => {
    const { data, error } = await createEnvironment({
      input: {
        name: values.name,
        projectId: values.project_id,
      },
    });

    if (data?.createEnvironment.result != null) {
      navigate({ to: "/environments" });
      return;
    }

    const errors = data?.createEnvironment.errors;
    form.setErrors(getMutationFieldErrors(errors));
    setErrorMessage(getMutationErrorMessage(error, errors));
  };

  return (
    <EnvironmentForm
      submitLabel="Create environment"
      errorTitle="Couldn't create environment"
      errorMessage={errorMessage}
      isPending={fetching}
      isDataLoading={isDataLoading}
      onSubmit={handleSubmit}
      projects={projects}
    />
  );
}
