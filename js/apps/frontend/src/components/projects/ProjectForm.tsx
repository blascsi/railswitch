import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Stack } from "@astryxdesign/core/Stack";
import z from "zod";

import { useAppForm } from "../../forms/formHook";
import { lowercaseLettersAndUnderscoresSchema } from "../../schemas/lowercaseLettersAndUnderscoresSchema";
import {
  noSubmissionErrors,
  unexpectedSubmissionError,
  type SubmissionErrors,
} from "../../utils/apiErrorMessage";

const projectSchema = z.object({
  name: lowercaseLettersAndUnderscoresSchema,
});

type ProjectFormInput = z.input<typeof projectSchema>;

export type ProjectFormValues = z.output<typeof projectSchema>;

type ProjectFormProps = {
  submitLabel: string;
  isPending: boolean;
  initialValues?: ProjectFormInput;
  onSubmit: (
    values: ProjectFormValues,
  ) => Promise<SubmissionErrors | undefined>;
};

export function ProjectForm({
  submitLabel,
  isPending,
  initialValues = { name: "" },
  onSubmit,
}: ProjectFormProps) {
  const form = useAppForm({
    defaultValues: initialValues,
    validators: { onSubmit: projectSchema },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: noSubmissionErrors });

      try {
        const failure = await onSubmit(projectSchema.parse(value));

        if (failure != null) {
          formApi.setErrorMap({ onSubmit: failure });
        }
      } catch {
        formApi.setErrorMap({ onSubmit: unexpectedSubmissionError });
      }
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <Stack gap={4}>
        <FormLayout defaultOptionality="required">
          <form.AppField name="name">
            {(field) => (
              <field.TextInput label="Name" placeholder="my_project" />
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
