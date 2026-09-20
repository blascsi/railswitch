import { Center } from "@astryxdesign/core/Center";

import { PageLoader } from "./PageLoader";

type FullPageLoaderProps = {
  label?: string;
};

export function FullPageLoader({ label }: FullPageLoaderProps) {
  // Centres in the viewport rather than in a parent's height: this renders
  // before there is a layout around it.
  return (
    <Center width="100%" minHeight="100dvh" padding={4}>
      <PageLoader label={label} />
    </Center>
  );
}
