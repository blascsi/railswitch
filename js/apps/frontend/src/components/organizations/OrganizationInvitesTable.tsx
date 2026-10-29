import { Button } from "@astryxdesign/core/Button";
import { ButtonGroup } from "@astryxdesign/core/ButtonGroup";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { proportional, Table } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { colorVars } from "@astryxdesign/core/theme/tokens.stylex";
import { VStack } from "@astryxdesign/core/VStack";
import * as stylex from "@stylexjs/stylex";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "urql";

import {
  graphql,
  readFragment,
  type FragmentOf,
  type ResultOf,
} from "../../graphql/graphql";
import { getSubmissionErrors } from "../../utils/apiErrorMessage";
import { AppIcon } from "../AppIcon";
import { OrganizationMemberRole } from "../memberships/OrganizationMemberRole";

const styles = stylex.create({
  errorText: {
    color: colorVars["--color-error"],
  },
});

export const organizationInvitesTable_invites = graphql(`
  fragment organizationInvitesTable_invites on Membership {
    id
    role
    status
    organizationName
  }
`);

const AcceptInviteMutation = graphql(`
  mutation AcceptInvite($id: ID!) {
    acceptInvitation(id: $id) {
      result {
        id
      }
      errors {
        message
      }
    }
  }
`);

const DeclineInviteMutation = graphql(`
  mutation DeclineInvite($id: ID!) {
    declineInvitation(id: $id) {
      result {
        id
      }
      errors {
        message
      }
    }
  }
`);

type InviteRow = {
  id: string;
  role: ResultOf<typeof organizationInvitesTable_invites>["role"];
  status: ResultOf<typeof organizationInvitesTable_invites>["status"];
  organizationName: string;
};

type OrganizationInvitesTableProps = {
  invites: readonly FragmentOf<typeof organizationInvitesTable_invites>[];
};

export function OrganizationInvitesTable({
  invites,
}: OrganizationInvitesTableProps) {
  const router = useRouter();
  const [{ fetching: acceptFetching }, acceptInvitation] =
    useMutation(AcceptInviteMutation);
  const [{ fetching: declineFetching }, declineInvitation] = useMutation(
    DeclineInviteMutation,
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInvitation = async (id: string, action: "ACCEPT" | "DECLINE") => {
    setErrorMessage(null);

    const { data, error } =
      action === "ACCEPT"
        ? await acceptInvitation({ id })
        : await declineInvitation({ id });
    const payload =
      data != null && "acceptInvitation" in data
        ? data.acceptInvitation
        : data?.declineInvitation;

    if (payload?.result == null) {
      setErrorMessage(getSubmissionErrors(error, payload?.errors).form ?? null);
      return;
    }

    await router.invalidate();
  };

  const rows = readFragment(organizationInvitesTable_invites, invites);

  const fetching = acceptFetching || declineFetching;

  return (
    <VStack gap={2}>
      {errorMessage != null && (
        <Stack direction="horizontal" gap={1} vAlign="center" role="alert">
          <AppIcon icon="error" color="error" size="sm" />
          <Text type="supporting" xstyle={styles.errorText}>
            {errorMessage}
          </Text>
        </Stack>
      )}
      <Card>
        <Table<InviteRow>
          data={[...rows]}
          idKey="id"
          columns={[
            {
              key: "organizationName",
              header: "Organization name",
              width: proportional(2),
              renderCell: (invite) => <Text>{invite.organizationName}</Text>,
            },
            {
              key: "role",
              header: "Role",
              width: proportional(1),
              renderCell: (invite) => (
                <OrganizationMemberRole role={invite.role} />
              ),
            },

            {
              key: "status",
              header: "Status",
              align: "center",
              width: proportional(1),
              renderCell: (invite) => (
                <ButtonGroup label="Organization membership invite actions">
                  <Button
                    label="Decline"
                    isDisabled={fetching}
                    clickAction={() => handleInvitation(invite.id, "DECLINE")}
                  />
                  <Button
                    label="Accept"
                    isDisabled={fetching}
                    clickAction={() => handleInvitation(invite.id, "ACCEPT")}
                  />
                </ButtonGroup>
              ),
            },
          ]}
        />
      </Card>
    </VStack>
  );
}
