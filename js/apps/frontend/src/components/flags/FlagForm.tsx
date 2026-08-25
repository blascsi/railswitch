import { Alert, Button, Group, Stack, TextInput } from "@mantine/core";
import { type UseFormReturnType, useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import z from "zod";
import type { FragmentOf } from "../../graphql/graphql";
import { lowercaseLettersAndUnderscoresSchema } from "../../schemas/lowercaseLettersAndUnderscoresSchema";
import {
  ProjectSelector,
  type projectSelector_projects,
} from "../projects/ProjectSelector";

const flagSchema = z.object({
  name: lowercaseLettersAndUnderscoresSchema,
  project_id: z.uuid(),
});

type FlagFormInput = z.input<typeof flagSchema>;

export type FlagFormValues = z.output<typeof flagSchema>;

export type FlagFormInstance = UseFormReturnType<FlagFormInput>;

type FlagFormProps = {
  isDataLoading: boolean;
  projects: readonly FragmentOf<typeof projectSelector_projects>[];
  submitLabel: string;
  errorTitle: string;
  errorMessage: string | null;
  isPending: boolean;
  initialValues?: FlagFormInput;
  onSubmit: (values: FlagFormValues, form: FlagFormInstance) => Promise<void>;
};

export function FlagForm({
  isDataLoading,
  projects,
  submitLabel,
  errorTitle,
  errorMessage,
  isPending,
  initialValues = { name: "", project_id: "" },
  onSubmit,
}: FlagFormProps) {
  const form = useForm<FlagFormInput>({
    mode: "uncontrolled",
    initialValues,
    validate: zod4Resolver(flagSchema),
    validateInputOnChange: true,
  });

  const handleSubmit = form.onSubmit((values) => {
    onSubmit(flagSchema.parse(values), form);
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
