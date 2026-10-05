import {
  ArrowCounterClockwiseIcon,
  BuildingsIcon,
  CaretDownIcon,
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
  | "arrowCounterClockwise"
  | "buildings"
  | "caretDown"
  | "caretUp"
  | "compass"
  | "flag"
  | "folder"
  | "house"
  | "plus"
  | "signOut"
  | "terminal"
  | "trashSimple";

export const railswitchIconRegistry: Record<
  RailswitchIconName,
  React.ReactNode
> = {
  arrowCounterClockwise: <ArrowCounterClockwiseIcon {...iconProps} />,
  buildings: <BuildingsIcon {...iconProps} />,
  caretDown: <CaretDownIcon {...iconProps} />,
  caretUp: <CaretUpIcon {...iconProps} />,
  compass: <CompassIcon {...iconProps} />,
  flag: <FlagIcon {...iconProps} />,
  folder: <FolderIcon {...iconProps} />,
  house: <HouseIcon {...iconProps} />,
  plus: <PlusIcon {...iconProps} />,
  signOut: <SignOutIcon {...iconProps} />,
  terminal: <TerminalIcon {...iconProps} />,
  trashSimple: <TrashSimpleIcon {...iconProps} />,
};
