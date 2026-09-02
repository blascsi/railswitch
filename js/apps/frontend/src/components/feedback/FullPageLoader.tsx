import { CenteredContent } from "../layout/CenteredContent";
import { PageLoader } from "./PageLoader";

type FullPageLoaderProps = {
  label?: string;
};

export function FullPageLoader({ label }: FullPageLoaderProps) {
  return (
    <CenteredContent minHeight="100dvh">
      <PageLoader label={label} />
    </CenteredContent>
  );
}
