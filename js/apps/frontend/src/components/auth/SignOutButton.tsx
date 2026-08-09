import { NavLink } from "@mantine/core";
import { SignOutIcon } from "@phosphor-icons/react";
import { useSetAtom } from "jotai";
import { useMutation } from "urql";
import { currentUserAtom } from "../../atoms/currentUser";
import { graphql } from "../../graphql/graphql";

const SignOutMutation = graphql(`
  mutation SignOut {
    signOut
  }
`);

export function SignOutButton() {
  const [{ fetching }, signOut] = useMutation(SignOutMutation);
  const setCurrentUser = useSetAtom(currentUserAtom);

  const onSignOut = async () => {
    await signOut({});
    setCurrentUser(null);
  };

  return (
    <NavLink
      component="button"
      type="button"
      label="Sign out"
      leftSection={<SignOutIcon />}
      disabled={fetching}
      onClick={onSignOut}
    />
  );
}
