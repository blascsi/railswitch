import { Icon, type IconName, type IconProps } from "@astryxdesign/core/Icon";
import type { RailswitchIconName } from "../themes/railswitch/icons";

type AppIconProps = Omit<IconProps, "icon"> & {
  icon: RailswitchIconName | IconProps["icon"];
};

/**
 * A type safe version of Astryx's `<Icon />` hacked so it
 * takes custom icon names, without requiring the `<theme>:<icon>`
 * structure.
 */
export function AppIcon({ icon, ...props }: AppIconProps) {
  return <Icon icon={icon as IconName} {...props} />;
}
