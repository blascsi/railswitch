import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useMutation } from "urql";
import z from "zod";

import { useAppForm } from "../../forms/formHook";
import { graphql } from "../../graphql/graphql";
import {
  getApiErrorMessage,
  noSubmissionErrors,
  unexpectedSubmissionError,
} from "../../utils/apiErrorMessage";

const MemberInviteMutation = graphql(`
  mutation MemberInvite($input: InviteMemberInput!) {
    inviteMember(input: $input)
  }
`);

const inviteMemberFormSchema = z.object({
  email: z.email().trim(),
});

export function OrganizationMemberInviteInput() {
  const [{ fetching }, inviteMember] = useMutation(MemberInviteMutation);
  const form = useAppForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: inviteMemberFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: noSubmissionErrors });

      try {
        const parsedInput = inviteMemberFormSchema.parse(value);
        const { error } = await inviteMember({
          input: { email: parsedInput.email },
        });

        if (error != null) {
          formApi.setErrorMap({
            onSubmit: { form: getApiErrorMessage(error), fields: {} },
          });
          return;
        }

        formApi.reset();
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
      <FormLayout>
        <form.AppField name="email">
          {(field) => (
            <field.TextInput
              type="email"
              label="Email"
              placeholder="Invite users via email..."
              isLabelHidden
              isLoading={fetching}
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.FormError />
        </form.AppForm>
      </FormLayout>
    </form>
  );
}
