import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "urql";
import { type FragmentOf, graphql } from "../../graphql/graphql";
import { getSubmissionErrors } from "../../utils/apiErrorMessage";
import type { projectSelector_projects } from "../projects/projectOptions";
import { FlagForm, type FlagFormValues } from "./FlagForm";

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
};

export function CreateFlagForm({ projects }: CreateFlagFormProps) {
  const navigate = useNavigate({ from: "/o/$organizationId" });
  const [{ fetching }, createFlag] = useMutation(CreateFlagMutation);

  const handleSubmit = async (values: FlagFormValues) => {
    const { data, error } = await createFlag({
      input: {
        name: values.name,
        projectId: values.project_id,
      },
    });

    if (data?.createFlag.result != null) {
      navigate({
        to: "/o/$organizationId/project/$projectName/flag/$flagName",
        params: {
          projectName: data.createFlag.result.project.name,
          flagName: data.createFlag.result.name,
        },
      });
      return;
    }

    return getSubmissionErrors(error, data?.createFlag.errors);
  };

  return (
    <FlagForm
      submitLabel="Create flag"
      isPending={fetching}
      onSubmit={handleSubmit}
      projects={projects}
    />
  );
}
