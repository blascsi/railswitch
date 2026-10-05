import { FormLayout } from "@astryxdesign/core/FormLayout";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { z } from "zod";

import { useAppForm } from "../../forms/formHook";
import {
  noSubmissionErrors,
  unexpectedSubmissionError,
  type SubmissionErrors,
} from "../../utils/apiErrorMessage";

const environmentApiKeySchema = z.object({
  name: z.string().trim().min(1, { error: "API key must have a name" }),
});

type EnvironmentApiKeyFormInput = z.input<typeof environmentApiKeySchema>;

export type EnvironmentApiKeyFormValues = z.output<
  typeof environmentApiKeySchema
>;

type EnvironmentApiKeyFormProps = {
  submitLabel: string;
  isPending: boolean;
  initialValues?: EnvironmentApiKeyFormInput;
  onSubmit: (
    values: EnvironmentApiKeyFormValues,
  ) => Promise<SubmissionErrors | undefined>;
};

export function EnvironmentApiKeyForm({
  submitLabel,
  isPending,
  initialValues = { name: "" },
  onSubmit,
}: EnvironmentApiKeyFormProps) {
  const form = useAppForm({
    defaultValues: initialValues,
    validators: { onSubmit: environmentApiKeySchema },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: noSubmissionErrors });

      try {
        const failure = await onSubmit(environmentApiKeySchema.parse(value));

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
      <VStack gap={4}>
        <FormLayout defaultOptionality="required">
          <form.AppField name="name">
            {(field) => (
              <field.TextInput label="Name" placeholder="Api key name..." />
            )}
          </form.AppField>
        </FormLayout>
        <form.AppForm>
          <HStack hAlign="end" vAlign="center" gap={3} wrap="wrap">
            <form.FormError />
            <form.SubmitButton
              label={submitLabel}
              isPending={isPending}
              requiresChanges
            />
          </HStack>
        </form.AppForm>
      </VStack>
    </form>
  );
}
