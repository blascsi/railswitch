import { Text } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "urql";
import { onAuthenticationSuccess } from "../../auth/authenticationSuccess";
import {
  AuthenticationForm,
  type AuthenticationFormValues,
} from "../../components/forms/AuthenticationForm";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { LinkAnchor } from "../../components/routing/link-components/LinkAnchor";
import { graphql } from "../../graphql/graphql";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

const SignInMutation = graphql(`
  mutation SignIn($email: String!, $password: String!, $rememberMe: Boolean) {
    signIn(email: $email, password: $password, rememberMe: $rememberMe) {
      id
      email
    }
  }
`);

export const Route = createFileRoute("/_anonymous/login")({
  component: LoginPage,
});

function LoginPage() {
  const [{ fetching }, signIn] = useMutation(SignInMutation);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (values: AuthenticationFormValues) => {
    setErrorMessage(null);

    const result = await signIn({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe,
    });

    const user = result.data?.signIn;
    if (user != null) {
      onAuthenticationSuccess(user);
      return;
    }

    setErrorMessage(
      result.error
        ? getApiErrorMessage(result.error)
        : "Invalid email or password.",
    );
  };

  return (
    <AuthLayout title="Log in">
      <AuthenticationForm
        submitLabel="Log in"
        errorTitle="Authentication failed"
        errorMessage={errorMessage}
        isPending={fetching}
        onSubmit={handleSubmit}
      >
        <Text size="sm" c="dimmed">
          Don't have an account? <LinkAnchor to="/signup">Sign up</LinkAnchor>
        </Text>
      </AuthenticationForm>
    </AuthLayout>
  );
}
