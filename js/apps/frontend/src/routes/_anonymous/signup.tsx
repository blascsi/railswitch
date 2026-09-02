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
import { getSubmissionErrors } from "../../utils/apiErrorMessage";
import { pageTitle } from "../../utils/pageTitle";

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
  head: () => ({ meta: [{ title: pageTitle("Sign up") }] }),
  component: SignupPage,
});

function SignupPage() {
  const [{ fetching }, register] = useMutation(RegisterMutation);
  const [isEnteringApp, setIsEnteringApp] = useState(false);

  const handleSubmit = async (values: AuthenticationFormValues) => {
    const result = await register({
      input: {
        email: values.email,
        password: values.password,
        passwordConfirmation: values.passwordConfirmation ?? "",
        rememberMe: values.rememberMe,
      },
    });

    const registeredUser = result.data?.register.result;
    if (registeredUser != null) {
      setIsEnteringApp(true);
      await onAuthenticationSuccess(registeredUser);
      return;
    }

    return getSubmissionErrors(result.error, result.data?.register.errors);
  };

  return (
    <AuthLayout title="Create an account">
      <AuthenticationForm
        submitLabel="Register"
        isPending={fetching || isEnteringApp}
        withPasswordConfirmation
        onSubmit={handleSubmit}
      >
        <Text type="supporting">
          Already have an account? <LinkAnchor to="/login">Log in</LinkAnchor>
        </Text>
      </AuthenticationForm>
    </AuthLayout>
  );
}
