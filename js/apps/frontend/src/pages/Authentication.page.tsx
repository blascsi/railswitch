import {
  Alert,
  Button,
  Center,
  Checkbox,
  Paper,
  PasswordInput,
  SegmentedControl,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { useLocation } from "wouter";
import * as z from "zod";
import type { Errors } from "../generated/client";
import {
  getUsersMeQueryKey,
  postUsersRegisterMutation,
  postUsersSignInMutation,
} from "../generated/client/@tanstack/react-query.gen";
import { lazyWithPreload } from "../utils/lazy-with-preload";

const HomePage = lazyWithPreload(() => import("./Home.page"));

type Mode = "signin" | "register";

const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  passwordConfirmation: z.string().optional(),
  rememberMe: z.boolean(),
});

const registerSchema = signInSchema
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirmation: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });

type FormValues = z.infer<typeof signInSchema>;

function getErrorMessage(error: Errors | null): string {
  const message = (error?.errors ?? [])
    .map((item) => item.detail ?? item.title)
    .filter(Boolean)
    .join(" ");
  return message || "Something went wrong. Please try again.";
}

function AuthenticationPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      password: "",
      passwordConfirmation: "",
      rememberMe: false,
    },
    validate: zod4Resolver(mode === "register" ? registerSchema : signInSchema),
  });

  const signIn = useMutation(postUsersSignInMutation());
  const register = useMutation(postUsersRegisterMutation());

  const activeMutation = mode === "register" ? register : signIn;

  const handleSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: getUsersMeQueryKey() });
    navigate("/home");
  };

  const handleSubmit = (values: FormValues) => {
    const attributes = {
      email: values.email,
      password: values.password,
      remember_me: values.rememberMe,
    };

    if (mode === "register") {
      register.mutate(
        {
          body: {
            data: {
              type: "user",
              attributes: {
                ...attributes,
                password_confirmation: values.passwordConfirmation ?? "",
              },
            },
          },
        },
        { onSuccess: handleSuccess },
      );
    } else {
      signIn.mutate(
        { body: { data: { type: "user", attributes } } },
        { onSuccess: handleSuccess },
      );
    }
  };

  const isRegister = mode === "register";
  const title = isRegister ? "Create an account" : "Log in";
  const submitLabel = isRegister ? "Register" : "Log in";

  const handleModeChange = (value: string) => {
    setMode(value as Mode);
    activeMutation.reset();
    form.clearErrors();
  };

  return (
    <Center mih="100vh">
      <Paper withBorder miw={500} py="lg" px="lg">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Title>{title}</Title>
            <SegmentedControl
              value={mode}
              onChange={handleModeChange}
              data={[
                { label: "Log in", value: "signin" },
                { label: "Register", value: "register" },
              ]}
            />
            {activeMutation.isError && (
              <Alert color="red" title="Authentication failed">
                {getErrorMessage(activeMutation.error)}
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
            {isRegister && (
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
            <Button
              type="submit"
              loading={activeMutation.isPending}
              onMouseEnter={HomePage.preload}
            >
              {submitLabel}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}

export default AuthenticationPage;
