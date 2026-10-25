import { FormLayout } from "@astryxdesign/core/FormLayout";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import z from "zod";

import { useAppForm } from "../../forms/formHook";
import {
  noSubmissionErrors,
  unexpectedSubmissionError,
  type SubmissionErrors,
} from "../../utils/apiErrorMessage";

const organizationSchema = z.object({
  name: z.string().trim().min(1),
});

type OrganizationFormInput = z.input<typeof organizationSchema>;

export type OrganizationFormValues = z.output<typeof organizationSchema>;

type OrganizationFormProps = {
  submitLabel: string;
  isPending: boolean;
  initialValues?: OrganizationFormInput;
  onSubmit: (
    values: OrganizationFormValues,
  ) => Promise<SubmissionErrors | undefined>;
};

export function OrganizationForm({
  submitLabel,
  isPending,
  initialValues = { name: "" },
  onSubmit,
}: OrganizationFormProps) {
  const form = useAppForm({
    defaultValues: initialValues,
    validators: { onSubmit: organizationSchema },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: noSubmissionErrors });

      try {
        const failure = await onSubmit(organizationSchema.parse(value));

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
              <field.TextInput label="Name" placeholder="My organization" />
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
