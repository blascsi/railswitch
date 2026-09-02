import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Stack } from "@astryxdesign/core/Stack";
import type { ReactNode } from "react";
import z from "zod";
import { useAppForm } from "../../forms/formHook";
import type { SubmissionErrors } from "../../utils/apiErrorMessage";

const authenticationSchema = z.object({
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Password is required"),
  passwordConfirmation: z.string().optional(),
  rememberMe: z.boolean(),
});

const passwordConfirmationSchema = authenticationSchema
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirmation: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });

type AuthenticationFormInput = z.input<typeof authenticationSchema>;

export type AuthenticationFormValues = z.output<typeof authenticationSchema>;

type AuthenticationFormProps = {
  submitLabel: string;
  isPending: boolean;
  withPasswordConfirmation?: boolean;
  onSubmit: (
    values: AuthenticationFormValues,
  ) => Promise<SubmissionErrors | undefined>;
  children: ReactNode;
};

const initialValues: AuthenticationFormInput = {
  email: "",
  password: "",
  passwordConfirmation: "",
  rememberMe: false,
};

export function AuthenticationForm({
  submitLabel,
  isPending,
  withPasswordConfirmation = false,
  onSubmit,
  children,
}: AuthenticationFormProps) {
  const schema = withPasswordConfirmation
    ? passwordConfirmationSchema
    : authenticationSchema;

  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: ({ value }) => {
        const result = schema.safeParse(value);

        if (result.success) {
          return undefined;
        }

        return {
          fields: Object.fromEntries(
            result.error.issues.map((issue) => [
              issue.path.join("."),
              issue.message,
            ]),
          ),
        };
      },
    },
    onSubmit: async ({ value, formApi }) => {
      const failure = await onSubmit(schema.parse(value));

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
        <FormLayout>
          <form.AppField name="email">
            {(field) => (
              <field.TextInput
                label="Email"
                type="email"
                placeholder="you@example.com"
              />
            )}
          </form.AppField>
          <form.AppField name="password">
            {(field) => (
              <field.TextInput
                label="Password"
                type="password"
                placeholder="Password"
              />
            )}
          </form.AppField>
          {withPasswordConfirmation && (
            <form.AppField name="passwordConfirmation">
              {(field) => (
                <field.TextInput
                  label="Confirm password"
                  type="password"
                  placeholder="Confirm password"
                />
              )}
            </form.AppField>
          )}
          <form.AppField name="rememberMe">
            {(field) => <field.CheckboxInput label="Remember me" />}
          </form.AppField>
        </FormLayout>
        <form.AppForm>
          <Stack gap={3}>
            <form.FormError />
            <form.SubmitButton label={submitLabel} isPending={isPending} />
          </Stack>
        </form.AppForm>
        {children}
      </Stack>
    </form>
  );
}
