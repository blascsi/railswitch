import { Alert, Button, Group, Stack, TextInput } from "@mantine/core";
import { type UseFormReturnType, useForm } from "@mantine/form";
import type { FragmentOf } from "gql.tada";
import { zod4Resolver } from "mantine-form-zod-resolver";
import z from "zod";
import { lowercaseLettersAndUnderscoresSchema } from "../../schemas/lowercaseLettersAndUnderscoresSchema";
import {
  ProjectSelector,
  type projectSelector_projects,
} from "../projects/ProjectSelector";

const environmentSchema = z.object({
  name: lowercaseLettersAndUnderscoresSchema,
  project_id: z.uuid(),
});

type EnvironmentFormInput = z.input<typeof environmentSchema>;

export type EnvironmentFormValues = z.output<typeof environmentSchema>;

export type EnvironmentFormInstance = UseFormReturnType<EnvironmentFormInput>;

type EnvironmentFormProps = {
  isDataLoading: boolean;
  projects: readonly FragmentOf<typeof projectSelector_projects>[];
  submitLabel: string;
  errorTitle: string;
  errorMessage: string | null;
  isPending: boolean;
  initialValues?: EnvironmentFormInput;
  onSubmit: (
    values: EnvironmentFormValues,
    form: EnvironmentFormInstance,
  ) => Promise<void>;
};

export function EnvironmentForm({
  isDataLoading,
  projects,
  submitLabel,
  errorTitle,
  errorMessage,
  isPending,
  initialValues = { name: "", project_id: "" },
  onSubmit,
}: EnvironmentFormProps) {
  const form = useForm<EnvironmentFormInput>({
    mode: "uncontrolled",
    initialValues,
    validate: zod4Resolver(environmentSchema),
    validateInputOnChange: true,
  });

  const handleSubmit = form.onSubmit((values) => {
    onSubmit(environmentSchema.parse(values), form);
  });

  const isSubmitEnabled = form.isDirty() && form.isValid();

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        {errorMessage && (
          <Alert color="red" title={errorTitle} role="alert">
            {errorMessage}
          </Alert>
        )}
        <TextInput
          placeholder="Name"
          aria-label="Name"
          key={form.key("name")}
          {...form.getInputProps("name")}
        />
        <ProjectSelector
          placeholder="Parent project"
          aria-label="Parent project"
          projects={projects}
          loading={isDataLoading}
          key={form.key("project_id")}
          {...form.getInputProps("project_id")}
        />
        <Group justify="flex-end">
          <Button type="submit" loading={isPending} disabled={!isSubmitEnabled}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
