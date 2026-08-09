import { Center } from "@mantine/core";
import { PageLoader } from "./PageLoader";

type FullPageLoaderProps = {
  label?: string;
};

export function FullPageLoader({ label }: FullPageLoaderProps) {
  return (
    <Center mih="100dvh">
      <PageLoader label={label} />
    </Center>
  );
}
