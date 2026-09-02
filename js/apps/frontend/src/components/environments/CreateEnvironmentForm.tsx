import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "urql";
import { type FragmentOf, graphql } from "../../graphql/graphql";
import { getSubmissionErrors } from "../../utils/apiErrorMessage";
import type { projectSelector_projects } from "../projects/projectOptions";
import { EnvironmentForm, type EnvironmentFormValues } from "./EnvironmentForm";

const CreateEnvironmentMutation = graphql(
  `
  mutation CreateEnvironmentMutation($input: CreateEnvironmentInput!) {
    createEnvironment(input: $input) {
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
`,
);

type CreateEnvironmentFormProps = {
  projects: readonly FragmentOf<typeof projectSelector_projects>[];
};

export function CreateEnvironmentForm({
  projects,
}: CreateEnvironmentFormProps) {
  const navigate = useNavigate();
  const [{ fetching }, createEnvironment] = useMutation(
    CreateEnvironmentMutation,
  );

  const handleSubmit = async (values: EnvironmentFormValues) => {
    const { data, error } = await createEnvironment({
      input: {
        name: values.name,
        projectId: values.project_id,
      },
    });

    if (data?.createEnvironment.result != null) {
      navigate({
        to: "/project/$projectName/environment/$environmentName",
        params: {
          projectName: data.createEnvironment.result.project.name,
          environmentName: data.createEnvironment.result.name,
        },
      });
      return;
    }

    return getSubmissionErrors(error, data?.createEnvironment.errors);
  };

  return (
    <EnvironmentForm
      submitLabel="Create environment"
      isPending={fetching}
      onSubmit={handleSubmit}
      projects={projects}
    />
  );
}
