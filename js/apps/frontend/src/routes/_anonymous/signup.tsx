import { Text } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "urql";
import { onAuthenticationSuccess } from "../../auth/authenticationSuccess";
import {
  AuthenticationForm,
  type AuthenticationFormInstance,
  type AuthenticationFormValues,
} from "../../components/forms/AuthenticationForm";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { LinkAnchor } from "../../components/routing/link-components/LinkAnchor";
import { graphql } from "../../graphql/graphql";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

const RegisterMutation = graphql(`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      result {
        id
        email
      }
      errors {
        message
        fields
      }
    }
  }
`);

export const Route = createFileRoute("/_anonymous/signup")({
  component: SignupPage,
});

function SignupPage() {
  const [{ fetching }, register] = useMutation(RegisterMutation);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (
    values: AuthenticationFormValues,
    form: AuthenticationFormInstance,
  ) => {
    setErrorMessage(null);

    const result = await register({
      input: {
        email: values.email,
        password: values.password,
        passwordConfirmation: values.passwordConfirmation ?? "",
        rememberMe: values.rememberMe,
      },
    });

    if (result.error) {
      setErrorMessage(getApiErrorMessage(result.error));
      return;
    }

    const registeredUser = result.data?.register.result;
    if (registeredUser != null) {
      onAuthenticationSuccess(registeredUser);
      return;
    }

    const errors = result.data?.register.errors ?? [];
    const emailError = errors.find((error) => error.fields?.includes("email"));

    if (emailError?.message != null) {
      form.setErrors({ email: emailError.message });
      return;
    }

    setErrorMessage(
      errors.map((error) => error.message).join(" ") ||
        "Something went wrong. Please try again.",
    );
  };

  return (
    <AuthLayout title="Create an account">
      <AuthenticationForm
        submitLabel="Register"
        errorTitle="Registration failed"
        errorMessage={errorMessage}
        isPending={fetching}
        withPasswordConfirmation
        onSubmit={handleSubmit}
      >
        <Text size="sm" c="dimmed">
          Already have an account? <LinkAnchor to="/login">Log in</LinkAnchor>
        </Text>
      </AuthenticationForm>
    </AuthLayout>
  );
}
