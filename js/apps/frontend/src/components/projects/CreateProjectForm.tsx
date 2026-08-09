import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "urql";
import { graphql } from "../../graphql/graphql";
import {
  getMutationErrorMessage,
  getMutationFieldErrors,
} from "../../utils/apiErrorMessage";
import {
  ProjectForm,
  type ProjectFormInstance,
  type ProjectFormValues,
} from "./ProjectForm";

const CreateProjectMutation = graphql(`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
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

export function CreateProjectForm() {
  const navigate = useNavigate();
  const [{ fetching }, createProject] = useMutation(CreateProjectMutation);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (
    values: ProjectFormValues,
    form: ProjectFormInstance,
  ) => {
    const { data, error } = await createProject({
      input: { name: values.name },
    });

    if (data?.createProject.result != null) {
      navigate({ to: "/projects" });
      return;
    }

    const errors = data?.createProject.errors;
    form.setErrors(getMutationFieldErrors(errors));
    setErrorMessage(getMutationErrorMessage(error, errors));
  };

  return (
    <ProjectForm
      submitLabel="Create project"
      errorTitle="Couldn't create project"
      errorMessage={errorMessage}
      isPending={fetching}
      onSubmit={handleSubmit}
    />
  );
}
