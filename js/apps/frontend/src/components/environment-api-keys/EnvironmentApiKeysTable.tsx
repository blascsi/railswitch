import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { IconButton } from "@astryxdesign/core/IconButton";
import { pixel, proportional, Table } from "@astryxdesign/core/Table";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import { useState } from "react";

import { graphql, readFragment, type FragmentOf } from "../../graphql/graphql";
import { AppIcon } from "../AppIcon";

export const environmentApiKeysTable_apiKeys = graphql(`
  fragment environmentApiKeysTable_apiKeys on EnvironmentApiKey {
    id
    name
    lastUsed
  }
`);

type EnvironmentApiKeyRow = {
  id: string;
  name: string;
  lastUsed: string | null;
};

type EnvironmentApiKeysTableProps = {
  apiKeys: readonly FragmentOf<typeof environmentApiKeysTable_apiKeys>[];
  isDeleting: boolean;
  onDelete: (apiKeyId: string) => Promise<void>;
};

export function EnvironmentApiKeysTable({
  apiKeys,
  isDeleting,
  onDelete,
}: EnvironmentApiKeysTableProps) {
  const [apiKeyIdToDelete, setApiKeyIdToDelete] = useState<string | null>(null);
  const rows = readFragment(environmentApiKeysTable_apiKeys, apiKeys);
  const handleConfirmDelete = async () => {
    if (apiKeyIdToDelete == null) {
      return;
    }

    await onDelete(apiKeyIdToDelete);
    setApiKeyIdToDelete(null);
  };

  return (
    <>
      <Card>
        <Table<EnvironmentApiKeyRow>
          data={[...rows]}
          emptyState={<EmptyState title="No API keys created yet" isCompact />}
          idKey="id"
          columns={[
            {
              key: "name",
              header: "Name",
              width: proportional(1),
              renderCell: (apiKey) => apiKey.name,
            },
            {
              key: "lastUsed",
              header: "Last used",
              width: proportional(1),
              align: "end",
              renderCell: (apiKey) => {
                if (apiKey.lastUsed) {
                  return (
                    <Timestamp
                      value={apiKey.lastUsed}
                      format="date_time"
                      type="inherit"
                      color="inherit"
                      tooltipEntries={[
                        { label: "Your time" },
                        { timezoneID: "UTC", label: "UTC" },
                      ]}
                    />
                  );
                } else {
                  return "Never";
                }
              },
            },
            {
              key: "actionIcons",
              header: "",
              width: pixel(60),
              align: "end",
              renderCell: (apiKey) => (
                <IconButton
                  label="Delete API key"
                  icon={<AppIcon icon="trashSimple" />}
                  variant="destructive"
                  isDisabled={isDeleting}
                  onClick={() => setApiKeyIdToDelete(apiKey.id)}
                />
              ),
            },
          ]}
        />
      </Card>
      <AlertDialog
        isOpen={apiKeyIdToDelete != null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setApiKeyIdToDelete(null);
          }
        }}
        title="Are you sure?"
        description="This will delete the API key, and close any active connections to it."
        actionLabel="Delete"
        isActionLoading={isDeleting}
        onAction={handleConfirmDelete}
      />
    </>
  );
}
