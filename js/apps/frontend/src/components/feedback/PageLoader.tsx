import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";

type PageLoaderProps = {
  label?: string;
};

export function PageLoader({ label }: PageLoaderProps) {
  return (
    <Center width="100%">
      <Spinner size="lg" label={label} />
    </Center>
  );
}
