import { Alert, Button, Group, Stack, TextInput } from "@mantine/core";
import { type UseFormReturnType, useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import z from "zod";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

type ProjectFormInput = z.input<typeof projectSchema>;

export type ProjectFormValues = z.output<typeof projectSchema>;

export type ProjectFormInstance = UseFormReturnType<ProjectFormInput>;

type ProjectFormProps = {
  submitLabel: string;
  errorTitle: string;
  errorMessage: string | null;
  isPending: boolean;
  initialValues?: ProjectFormInput;
  onSubmit: (
    values: ProjectFormValues,
    form: ProjectFormInstance,
  ) => Promise<void>;
};

export function ProjectForm({
  submitLabel,
  errorTitle,
  errorMessage,
  isPending,
  initialValues = { name: "" },
  onSubmit,
}: ProjectFormProps) {
  const form = useForm<ProjectFormInput>({
    mode: "uncontrolled",
    initialValues,
    validate: zod4Resolver(projectSchema),
  });

  const handleSubmit = form.onSubmit((values) =>
    onSubmit(projectSchema.parse(values), form),
  );

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
        <Group justify="flex-end">
          <Button type="submit" loading={isPending}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
