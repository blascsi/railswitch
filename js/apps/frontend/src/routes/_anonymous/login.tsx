import { Text } from "@astryxdesign/core/Text";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "urql";
import { onAuthenticationSuccess } from "../../auth/authenticationSuccess";
import {
  AuthenticationForm,
  type AuthenticationFormValues,
} from "../../components/auth/AuthenticationForm";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { LinkAnchor } from "../../components/routing/link-components/LinkAnchor";
import { graphql } from "../../graphql/graphql";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";
import { pageTitle } from "../../utils/pageTitle";

const SignInMutation = graphql(`
  mutation SignIn($email: String!, $password: String!, $rememberMe: Boolean) {
    signIn(email: $email, password: $password, rememberMe: $rememberMe) {
      id
      email
    }
  }
`);

export const Route = createFileRoute("/_anonymous/login")({
  head: () => ({ meta: [{ title: pageTitle("Sign in") }] }),
  component: LoginPage,
});

function LoginPage() {
  const [{ fetching }, signIn] = useMutation(SignInMutation);
  const [isEnteringApp, setIsEnteringApp] = useState(false);

  const handleSubmit = async (values: AuthenticationFormValues) => {
    const result = await signIn({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe,
    });

    const user = result.data?.signIn;
    if (user != null) {
      setIsEnteringApp(true);
      await onAuthenticationSuccess(user);
      return;
    }

    return {
      form: result.error
        ? getApiErrorMessage(result.error)
        : "Invalid email or password.",
      fields: {},
    };
  };

  return (
    <AuthLayout title="Log in">
      <AuthenticationForm
        submitLabel="Log in"
        isPending={fetching || isEnteringApp}
        onSubmit={handleSubmit}
      >
        <Text type="supporting">
          Don't have an account? <LinkAnchor to="/signup">Sign up</LinkAnchor>
        </Text>
      </AuthenticationForm>
    </AuthLayout>
  );
}
