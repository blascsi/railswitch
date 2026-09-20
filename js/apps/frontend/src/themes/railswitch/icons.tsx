import {
  BuildingsIcon,
  CompassIcon,
  FlagIcon,
  FolderIcon,
  HouseIcon,
  PlusIcon,
  SignOutIcon,
  TerminalIcon,
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
  | "notFound";

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
};
