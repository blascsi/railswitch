import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "urql";
import { graphql } from "../../graphql/graphql";
import { getSubmissionErrors } from "../../utils/apiErrorMessage";
import { ProjectForm, type ProjectFormValues } from "./ProjectForm";

const CreateProjectMutation = graphql(`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
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

export function CreateProjectForm() {
  const navigate = useNavigate();
  const [{ fetching }, createProject] = useMutation(CreateProjectMutation);

  const handleSubmit = async (values: ProjectFormValues) => {
    const { data, error } = await createProject({
      input: { name: values.name },
    });

    if (data?.createProject.result != null) {
      navigate({
        to: "/project/$projectName",
        params: { projectName: data.createProject.result.name },
      });
      return;
    }

    return getSubmissionErrors(error, data?.createProject.errors);
  };

  return (
    <ProjectForm
      submitLabel="Create project"
      isPending={fetching}
      onSubmit={handleSubmit}
    />
  );
}
