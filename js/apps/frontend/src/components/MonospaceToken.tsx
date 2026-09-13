import { Token, type TokenProps } from "@astryxdesign/core/Token";
import { typographyVars } from "@astryxdesign/core/theme/tokens.stylex";
import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  monospace: {
    fontFamily: typographyVars["--font-family-code"],
  },
});

export function MonospaceToken(props: TokenProps) {
  return <Token {...props} xstyle={[styles.monospace, props.xstyle]} />;
}
