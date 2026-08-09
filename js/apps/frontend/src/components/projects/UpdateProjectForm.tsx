import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "urql";
import { type FragmentOf, graphql, readFragment } from "../../graphql/graphql";
import {
  getMutationErrorMessage,
  getMutationFieldErrors,
} from "../../utils/apiErrorMessage";
import {
  ProjectForm,
  type ProjectFormInstance,
  type ProjectFormValues,
} from "./ProjectForm";

export const updateProjectForm_project = graphql(`
  fragment updateProjectForm_project on Project {
    id
    name
  }
`);

const UpdateProjectMutation = graphql(`
  mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
    updateProject(id: $id, input: $input) {
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

type UpdateProjectFormProps = {
  project: FragmentOf<typeof updateProjectForm_project>;
};

export function UpdateProjectForm({ project }: UpdateProjectFormProps) {
  const navigate = useNavigate();
  const { id, name } = readFragment(updateProjectForm_project, project);
  const [{ fetching }, updateProject] = useMutation(UpdateProjectMutation);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (
    values: ProjectFormValues,
    form: ProjectFormInstance,
  ) => {
    const { data, error } = await updateProject({
      id,
      input: { name: values.name },
    });

    if (data?.updateProject.result != null) {
      navigate({ to: "/projects" });
      return;
    }

    const errors = data?.updateProject.errors;
    form.setErrors(getMutationFieldErrors(errors));
    setErrorMessage(getMutationErrorMessage(error, errors));
  };

  return (
    <ProjectForm
      submitLabel="Save changes"
      errorTitle="Couldn't update project"
      errorMessage={errorMessage}
      isPending={fetching}
      initialValues={{ name }}
      onSubmit={handleSubmit}
    />
  );
}
