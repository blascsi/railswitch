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
  FlagForm,
  type FlagFormInstance,
  type FlagFormValues,
} from "./FlagForm";

const CreateFlagMutation = graphql(`
  mutation CreateFlagMutation($input: CreateFlagInput!) {
    createFlag(input: $input) {
      result {
        id
        name
        project {
          id
          name
        }
      }
      errors {
        message
        fields
      }
    }
  }
`);

type CreateFlagFormProps = {
  projects: readonly FragmentOf<typeof projectSelector_projects>[];
  isDataLoading: boolean;
};

export function CreateFlagForm({
  projects,
  isDataLoading,
}: CreateFlagFormProps) {
  const navigate = useNavigate();
  const [{ fetching }, createFlag] = useMutation(CreateFlagMutation);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (
    values: FlagFormValues,
    form: FlagFormInstance,
  ) => {
    const { data, error } = await createFlag({
      input: {
        name: values.name,
        projectId: values.project_id,
      },
    });

    if (data?.createFlag.result != null) {
      navigate({
        to: "/project/$projectName/flag/$flagName",
        params: {
          projectName: data.createFlag.result.project.name,
          flagName: data.createFlag.result.name,
        },
      });
      return;
    }

    const errors = data?.createFlag.errors;
    form.setErrors(getMutationFieldErrors(errors));
    setErrorMessage(getMutationErrorMessage(error, errors));
  };

  return (
    <FlagForm
      submitLabel="Create flag"
      errorTitle="Couldn't create flag"
      errorMessage={errorMessage}
      isPending={fetching}
      isDataLoading={isDataLoading}
      onSubmit={handleSubmit}
      projects={projects}
    />
  );
}
