import {
  ArrowCounterClockwiseIcon,
  BuildingsIcon,
  CaretUpIcon,
  CompassIcon,
  FlagIcon,
  FolderIcon,
  HouseIcon,
  PlusIcon,
  SignOutIcon,
  TerminalIcon,
  TrashSimpleIcon,
} from "@phosphor-icons/react";
// The Astryx CLI needs this import present
import React from "react";

import { iconProps } from "../neutral/icons";

export type RailswitchIconName =
  | "project"
  | "environment"
  | "flag"
  | "organization"
  | "add"
  | "home"
  | "signOut"
  | "notFound"
  | "trash"
  | "chevronUp"
  | "arrowCounterClockwise";

export const railswitchIconRegistry: Record<
  RailswitchIconName,
  React.ReactNode
> = {
  project: <FolderIcon {...iconProps} />,
  environment: <TerminalIcon {...iconProps} />,
  flag: <FlagIcon {...iconProps} />,
  organization: <BuildingsIcon {...iconProps} />,
  add: <PlusIcon {...iconProps} />,
  home: <HouseIcon {...iconProps} />,
  signOut: <SignOutIcon {...iconProps} />,
  notFound: <CompassIcon {...iconProps} />,
  trash: <TrashSimpleIcon {...iconProps} />,
  chevronUp: <CaretUpIcon {...iconProps} />,
  arrowCounterClockwise: <ArrowCounterClockwiseIcon {...iconProps} />,
};
