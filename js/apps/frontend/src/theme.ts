import { defineTheme } from "@astryxdesign/core/theme";
import { stoneTheme } from "@astryxdesign/theme-stone/built";
import { phosphorIcons } from "./theme/icons";

export const railswitchTheme = defineTheme({
  name: "railswitch",
  extends: stoneTheme,
  radius: { base: 0, multiplier: 0 },
  icons: phosphorIcons,
  components: {
    button: { base: { borderRadius: "var(--radius-none)" } },
    "progress-bar-fill": { base: { borderRadius: "var(--radius-none)" } },
  },
});
