import {
  Alert,
  Button,
  Checkbox,
  PasswordInput,
  Stack,
  TextInput,
} from "@mantine/core";
import { type UseFormReturnType, useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import type { ReactNode } from "react";
import * as z from "zod";

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

export type AuthenticationFormInstance =
  UseFormReturnType<AuthenticationFormInput>;

type AuthenticationFormProps = {
  submitLabel: string;
  errorTitle: string;
  errorMessage: string | null;
  isPending: boolean;
  withPasswordConfirmation?: boolean;
  onSubmit: (
    values: AuthenticationFormValues,
    form: AuthenticationFormInstance,
  ) => Promise<void>;
  children: ReactNode;
};

export function AuthenticationForm({
  submitLabel,
  errorTitle,
  errorMessage,
  isPending,
  withPasswordConfirmation = false,
  onSubmit,
  children,
}: AuthenticationFormProps) {
  const schema = withPasswordConfirmation
    ? passwordConfirmationSchema
    : authenticationSchema;

  const form = useForm<AuthenticationFormInput>({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      password: "",
      passwordConfirmation: "",
      rememberMe: false,
    },
    validate: zod4Resolver(schema),
  });

  const handleSubmit = form.onSubmit((values) =>
    onSubmit(schema.parse(values), form),
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
          label="Email"
          placeholder="you@example.com"
          type="email"
          key={form.key("email")}
          {...form.getInputProps("email")}
        />
        <PasswordInput
          label="Password"
          placeholder="Password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        {withPasswordConfirmation && (
          <PasswordInput
            label="Confirm password"
            placeholder="Confirm password"
            key={form.key("passwordConfirmation")}
            {...form.getInputProps("passwordConfirmation")}
          />
        )}
        <Checkbox
          label="Remember me"
          key={form.key("rememberMe")}
          {...form.getInputProps("rememberMe", { type: "checkbox" })}
        />
        <Button type="submit" loading={isPending}>
          {submitLabel}
        </Button>
        {children}
      </Stack>
    </form>
  );
}
