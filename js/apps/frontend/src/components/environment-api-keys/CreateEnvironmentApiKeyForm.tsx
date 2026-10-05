import { Banner } from "@astryxdesign/core/Banner";
import { CodeBlock } from "@astryxdesign/core/CodeBlock";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { useState, type ReactNode } from "react";
import { useMutation } from "urql";

import { graphql } from "../../graphql/graphql";
import { getSubmissionErrors } from "../../utils/apiErrorMessage";
import {
  EnvironmentApiKeyForm,
  type EnvironmentApiKeyFormValues,
} from "./EnvironmentApiKeyForm";

const CreateEnvironmentApiKeyMutation = graphql(`
  mutation CreateEnvironmentApiKeyMutation(
    $input: CreateEnvironmentApiKeyInput!
  ) {
    createEnvironmentApiKey(input: $input) {
      result {
        id
      }
      metadata {
        plaintextApiKey
      }
      errors {
        message
        fields
      }
    }
  }
`);

type CreateEnvironmentApiKeyFormProps = {
  environmentId: string;
  actions?: ReactNode;
};

export function CreateEnvironmentApiKeyForm({
  environmentId,
  actions,
}: CreateEnvironmentApiKeyFormProps) {
  const [{ fetching }, createEnvironmentApiKey] = useMutation(
    CreateEnvironmentApiKeyMutation,
  );
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);

  const handleSubmit = async (values: EnvironmentApiKeyFormValues) => {
    const { data, error } = await createEnvironmentApiKey({
      input: { environmentId, name: values.name },
    });
    const plaintextApiKey =
      data?.createEnvironmentApiKey.metadata?.plaintextApiKey;

    if (plaintextApiKey != null) {
      setCreatedApiKey(plaintextApiKey);
      return;
    }

    return getSubmissionErrors(error, data?.createEnvironmentApiKey.errors);
  };

  if (createdApiKey != null) {
    return (
      <VStack gap={4}>
        <Banner
          status="warning"
          title="Copy this API key now"
          description="You won't be able to see it again."
        />
        <CodeBlock
          title="API key"
          code={createdApiKey}
          width="100%"
          hasCopyButton
        />
        {actions != null && <HStack hAlign="end">{actions}</HStack>}
      </VStack>
    );
  }

  return (
    <EnvironmentApiKeyForm
      submitLabel="Create"
      isPending={fetching}
      onSubmit={handleSubmit}
    />
  );
}
