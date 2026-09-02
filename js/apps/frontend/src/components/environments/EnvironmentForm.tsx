import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Stack } from "@astryxdesign/core/Stack";
import z from "zod";
import { useAppForm } from "../../forms/formHook";
import type { FragmentOf } from "../../graphql/graphql";
import { lowercaseLettersAndUnderscoresSchema } from "../../schemas/lowercaseLettersAndUnderscoresSchema";
import {
  noSubmissionErrors,
  type SubmissionErrors,
} from "../../utils/apiErrorMessage";
import {
  projectOptions,
  type projectSelector_projects,
} from "../projects/projectOptions";

const environmentSchema = z.object({
  name: lowercaseLettersAndUnderscoresSchema,
  project_id: z.uuid("Select a parent project"),
});

type EnvironmentFormInput = z.input<typeof environmentSchema>;

export type EnvironmentFormValues = z.output<typeof environmentSchema>;

type EnvironmentFormProps = {
  projects: readonly FragmentOf<typeof projectSelector_projects>[];
  submitLabel: string;
  isPending: boolean;
  initialValues?: EnvironmentFormInput;
  onSubmit: (
    values: EnvironmentFormValues,
  ) => Promise<SubmissionErrors | undefined>;
};

export function EnvironmentForm({
  projects,
  submitLabel,
  isPending,
  initialValues = { name: "", project_id: "" },
  onSubmit,
}: EnvironmentFormProps) {
  const form = useAppForm({
    defaultValues: initialValues,
    validators: { onSubmit: environmentSchema },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: noSubmissionErrors });

      const failure = await onSubmit(environmentSchema.parse(value));

      if (failure != null) {
        formApi.setErrorMap({ onSubmit: failure });
      }
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <Stack gap={4}>
        <FormLayout defaultOptionality="required">
          <form.AppField name="name">
            {(field) => (
              <field.TextInput label="Name" placeholder="my_environment" />
            )}
          </form.AppField>
          <form.AppField name="project_id">
            {(field) => (
              <field.Selector
                label="Parent project"
                placeholder="Choose a project"
                options={projectOptions(projects)}
              />
            )}
          </form.AppField>
        </FormLayout>
        <form.AppForm>
          <Stack
            direction="horizontal"
            hAlign="end"
            vAlign="center"
            gap={3}
            wrap="wrap"
          >
            <form.FormError />
            <form.SubmitButton
              label={submitLabel}
              isPending={isPending}
              requiresChanges
            />
          </Stack>
        </form.AppForm>
      </Stack>
    </form>
  );
}
