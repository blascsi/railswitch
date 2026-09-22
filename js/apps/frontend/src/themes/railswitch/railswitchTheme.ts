/**
 * Railswitch Theme
 *
 * A warm sage palette around a moss accent. The neutrals are olive-tinted
 * rather than grey, so the greens sit in the same family as them.
 *
 * Light ladder:
 *   Surfaces  base #F8F9F4 · recessed #EFF1E7 · panels #FFFFFF
 *   Borders   hairline #E0E3D6 · control #D0D5C2
 *   Ink       #1F2318 · #575C4C · #868B77 · #A6AA95 · #BEC3AE
 *
 * Dark ladder — the same olive ink extended into a full tonal set:
 *   Surfaces  base #14170F · panels #1B1F14 · lifted #232719
 *   Borders   hairline #2C3222 · control #414737
 *   Ink       #F3F5EA · #969B85 · #666B57
 *
 * Accent    moss #42591A (light) / lime #A6C74A (dark); accent text and
 *           links one step out at #33470F / #BCD86A.
 * Status    success is the accent, the palette's single positive colour.
 *           Error is a terracotta from outside the sage family; warning
 *           and info sit between, on olive-amber and slate.
 *
 * Type      Bricolage Grotesque (headings, semibold at -0.015em) ·
 *           Instrument Sans (body and UI, 14px base, ratio 1.2) ·
 *           JetBrains Mono (code)
 * Radius    2px on every scalable step.
 *
 * Astryx only sets the font-family tokens; the app loads the families.
 */

import { defineSyntaxTheme, defineTheme } from "@astryxdesign/core/theme";

import { neutralTheme } from "../neutral/neutralTheme";
import { railswitchIconRegistry } from "./icons";

/**
 * Syntax palette — the theme's ink ladder, with literals on the accent and
 * strings on the slate: the one cool hue here, so quoted values separate
 * from everything around them.
 */
const railswitchSyntax = defineSyntaxTheme({
  name: "xds-railswitch",
  tokens: {
    keyword: ["#42591A", "#A6C74A"], // accent moss / lime
    string: ["#46687A", "#8FB0C4"], // slate blue
    comment: ["#868B77", "#7A8069"], // tertiary ink
    number: ["#8A5843", "#D3A98F"], // terracotta
    function: ["#33470F", "#BCD86A"], // accent text stop
    type: ["#46687A", "#8FB0C4"], // slate blue
    variable: ["#1F2318", "#F3F5EA"], // primary ink
    operator: ["#A6AA95", "#7A8069"],
    constant: ["#8A5843", "#D3A98F"], // terracotta
    tag: ["#A24A2C", "#E0A48C"], // error terracotta
    attribute: ["#575C4C", "#C9CDBB"], // secondary ink
    property: ["#575C4C", "#C9CDBB"], // secondary ink
    punctuation: ["#868B77", "#8B917A"], // tertiary ink
    background: ["#FBFCF6", "#1F2318"],
  },
});

export const railswitchTheme = defineTheme({
  name: "railswitch",
  extends: neutralTheme,

  // Headings are semibold at every level: the display face carries the
  // contrast on its own, and bold only coarsens it.
  typography: {
    scale: { base: 14, ratio: 1.2 },
    body: {
      family: "Instrument Sans",
      fallbacks:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    heading: {
      family: "Bricolage Grotesque",
      fallbacks:
        '"Instrument Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      weight: "semibold",
    },
    code: {
      family: "JetBrains Mono",
      fallbacks:
        'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    },
  },

  syntax: railswitchSyntax,

  icons: railswitchIconRegistry,

  tokens: {
    // =========================================================================
    // Surfaces — an olive-tinted ladder:
    //
    //   body     the base tone everything sits on
    //   surface  lifted, interactive surfaces
    //   card     panels floating above the base
    //   popover  the panel tone, separated by shadow
    //   muted    a recessed tone, one step in from the base
    //
    // Light floats white panels on a tinted base; dark collapses card and
    // muted just above body and lifts surface past both.
    // =========================================================================
    "--color-background-body": ["#F8F9F4", "#14170F"],
    "--color-background-surface": ["#FFFFFF", "#232719"],
    "--color-background-card": ["#FFFFFF", "#1B1F14"],
    "--color-background-popover": ["#FFFFFF", "#232719"],
    "--color-background-muted": ["#EFF1E7", "#1B1F14"],
    "--color-background-inverted": ["#1F2318", "#F3F5EA"],
    "--color-background-error-inverted": ["#A24A2C", "#C8724D"],

    // Accent — moss in light, lime in dark. The muted stop is the accent at
    // 12%; Astryx also uses it as the focus ring's inset fill.
    "--color-accent": ["#42591A", "#A6C74A"],
    "--color-accent-muted": ["#42591A1F", "#A6C74A29"],
    "--color-on-accent": ["#FBFCF6", "#1F2318"],

    // The generic interaction wash — accent-tinted rather than black or
    // white, so it stays in the family on every surface it lands on.
    "--color-neutral": ["#42591A12", "#A6C74A1F"],

    // Overlays — scrims, hover and pressed tints
    "--color-overlay": ["#1F231899", "#0B0D08CC"],
    "--color-overlay-hover": ["#1F23180A", "#FBFCF60A"],
    "--color-overlay-pressed": ["#1F231814", "#FBFCF614"],

    // Text
    "--color-text-primary": ["#1F2318", "#F3F5EA"],
    "--color-text-secondary": ["#575C4C", "#969B85"],
    "--color-text-disabled": ["#A6AA95", "#666B57"],
    // Accent text sits one step past the fills: the fill tone is chosen
    // against white, the text tone against the base surface.
    "--color-text-accent": ["#33470F", "#BCD86A"],
    "--color-on-dark": "#FBFCF6",
    "--color-on-light": "#1F2318",
    "--color-on-success": ["#FBFCF6", "#1F2318"],
    "--color-on-error": ["#FBFCF6", "#1F2318"],
    "--color-on-warning": "#1F2318",

    // Icon
    "--color-icon-accent": ["#42591A", "#A6C74A"],
    "--color-icon-primary": ["#1F2318", "#F3F5EA"],
    "--color-icon-secondary": ["#868B77", "#A6AA95"],
    "--color-icon-disabled": ["#BEC3AE", "#5C6150"],

    // Status — a colored stop for text and icons, a muted stop for the
    // surface under them: light is dark text on a pale tint, dark inverts
    // to pale text on an alpha overlay that composes onto what's behind it.
    //
    // Success is the accent, so an accent fill and a success fill never
    // disagree. Error is terracotta, the only hue outside the sage family —
    // which is what makes it read as an interruption.
    "--color-success": ["#42591A", "#A6C74A"],
    "--color-error": ["#A24A2C", "#F0BCA6"],
    "--color-warning": ["#7A5A18", "#E0BE5B"],
    "--color-success-muted": ["#E1EACD", "#A6C74A29"],
    "--color-error-muted": ["#F8EDE8", "#C8724D3D"],
    "--color-warning-muted": ["#F4E7C6", "#E0BE5B29"],

    // Border — solid hairlines, not alpha washes: an alpha line shifts tone
    // with whatever it sits on, and white panels, the tinted base and the
    // recessed tone all meet each other here.
    "--color-border": ["#E0E3D6", "#2C3222"],
    "--color-border-emphasized": ["#D0D5C2", "#414737"],

    // Effects
    "--color-skeleton": ["#E9EBE0", "#2C3222"],
    "--color-shadow": ["#1F23181F", "#00000066"],
    "--color-track": ["#D0D5C2", "#414737"],
    // Hover tints mix toward the ink, not black, keeping the olive cast.
    "--color-tint-hover": ["#1F2318", "#FBFCF6"],

    // Categorical gray — pulled onto the sage neutrals so a gray chip does
    // not read as a foreign grey.
    "--color-background-gray": ["#E9EBE0", "#FFFFFF14"],
    "--color-border-gray": ["#D6DAC7", "#414737"],
    "--color-icon-gray": ["#575C4C", "#A6AA95"],
    "--color-text-gray": ["#3B3F33", "#E3E7D5"],

    // =========================================================================
    // Radius — 2px on every scalable step: near-square, minus the literal
    // hard corner. --radius-none and --radius-full are fixed at 0 and
    // 9999px and must never be scaled (see defineTheme's radius docs).
    // =========================================================================
    "--radius-none": "0px",
    "--radius-inner": "2px",
    "--radius-element": "2px",
    "--radius-container": "2px",
    "--radius-page": "2px",
    "--radius-chat": "2px",
    "--radius-full": "9999px",

    // =========================================================================
    // Shadows — drops carry the ink hue, not black, so a lifted panel casts
    // into the palette instead of greying it out. Light stays shallow on an
    // already-tinted base; dark deepens to carry the same lift.
    // =========================================================================
    "--shadow-low":
      "0 1px 2px light-dark(rgba(31, 35, 24, 0.06), rgba(0, 0, 0, 0.35)), " +
      "0 2px 6px light-dark(rgba(31, 35, 24, 0.06), rgba(0, 0, 0, 0.45))",
    "--shadow-med":
      "0 2px 4px light-dark(rgba(31, 35, 24, 0.06), rgba(0, 0, 0, 0.4)), " +
      "0 10px 28px light-dark(rgba(31, 35, 24, 0.12), rgba(0, 0, 0, 0.55))",
    "--shadow-high":
      "0 4px 8px light-dark(rgba(31, 35, 24, 0.1), rgba(0, 0, 0, 0.5)), " +
      "0 18px 40px light-dark(rgba(31, 35, 24, 0.16), rgba(0, 0, 0, 0.7))",
    "--shadow-inset-hover": "inset 0px 0px 0px 2px #42591A1F",
    "--shadow-inset-selected": "inset 0px 0px 0px 2px #42591A3D",
    "--shadow-inset-success": "inset 0px 0px 0px 2px #42591A3D",
    "--shadow-inset-warning": "inset 0px 0px 0px 2px #B8891F3D",
    "--shadow-inset-error": "inset 0px 0px 0px 2px #A24A2C3D",

    // A wider offset reads as detached from a 2px corner.
    "--focus-outline-offset": "2px",
  },

  components: {
    // =========================================================================
    // The display face is drawn on a wide default fit; -0.015em brings its
    // colour back in line with the body face.
    // =========================================================================
    heading: {
      base: { letterSpacing: "-0.015em" },
    },

    // =========================================================================
    // Link — underlined at rest, not only on hover: the accent ink is close
    // enough to the body ink that colour alone does not mark a link, and
    // colour alone is never a sufficient cue anyway. The underline rests at
    // 40% so a paragraph of links is not a row of rules.
    // =========================================================================
    link: {
      base: {
        textDecoration: "underline",
        textDecorationThickness: "1px",
        textUnderlineOffset: "0.18em",
        textDecorationColor:
          "color-mix(in srgb, currentColor 40%, transparent)",
        ":hover": { textDecorationColor: "currentColor" },
      },
    },

    // =========================================================================
    // Button — primary takes the accent fill from the tokens; destructive
    // is the terracotta pastel with the colored stop as its label.
    //
    // Secondary's hairline is an inset ring rather than a border because
    // the component sets border-width to 0: a borderColor override alone
    // paints nothing, and restoring width and style would grow the button.
    // =========================================================================
    button: {
      "variant:secondary": {
        backgroundColor: "light-dark(#FFFFFF, #232719)",
        color: "var(--color-text-secondary)",
        boxShadow: "inset 0 0 0 1px var(--color-border-emphasized)",
        ":hover": { backgroundColor: "light-dark(#FAFBF6, #2A2F1E)" },
        // Grouped members drop the ring — see the button group below.
        ":where(.astryx-button-group *)": { boxShadow: "none" },
      },
      "variant:destructive": {
        backgroundColor: "var(--color-error-muted)",
        color: "var(--color-error)",
      },
    },

    // =========================================================================
    // Button group — one outline around the whole control instead of one
    // per member. A grouped button already draws its own divider hairline,
    // so a secondary member's ring would stack against it: ring, divider,
    // ring, three lines where the design wants one.
    //
    // The outline is an outset spread, not inset — an inset shadow paints
    // below the members' backgrounds and would be hidden. `:has()` keeps it
    // off groups of filled buttons, where a hairline reads as a seam.
    // Redefining the border token in scope matches the dividers to it.
    // =========================================================================
    "button-group": {
      base: {
        "--color-border": "var(--color-border-emphasized)",
        ":has(> .astryx-button.secondary)": {
          borderRadius: "var(--radius-element)",
          boxShadow: "0 0 0 1px var(--color-border-emphasized)",
        },
      },
    },

    // =========================================================================
    // Badge — square chips, not pills. The semantic variants are filled
    // with the accent and status stops; the neutral and categorical ones
    // read from the hue tokens and track the palette on their own.
    //
    // Info is the slate: the only stop that reads as neither approval nor
    // alarm, and the one thing keeping it distinct from success.
    // =========================================================================
    badge: {
      base: { borderRadius: "var(--radius-inner)" },
      "variant:info": {
        // 5.4:1 light, 7.2:1 dark — the light stop is too dark to carry
        // pale text, so dark flips to a pale fill with dark text.
        backgroundColor: "light-dark(#46687A, #8FB0C4)",
        color: "light-dark(#FBFCF6, #1F2318)",
      },
      "variant:success": {
        backgroundColor: "light-dark(#42591A, #A6C74A)",
        color: "light-dark(#FBFCF6, #1F2318)",
      },
      "variant:warning": {
        // One hex in both modes; dark text on it clears AA either way.
        backgroundColor: "#B8891F",
        color: "#1F2318",
      },
      "variant:error": {
        // Dark steps one stop brighter and flips to dark text; the light
        // stop under dark text falls below AA.
        backgroundColor: "light-dark(#A24A2C, #D98A63)",
        color: "light-dark(#FBFCF6, #1F2318)",
      },
    },

    // Token chips carry the same square geometry as the badge.
    token: {
      base: { borderRadius: "var(--radius-inner)" },
    },

    // The initials surface is a chip in the palette's neutrals rather than a
    // per-name colour, so a row of avatars stays quiet.
    "avatar-fallback": {
      base: {
        backgroundColor: "light-dark(#E3E7D5, #2C3222)",
        color: "var(--color-text-secondary)",
        fontWeight: "600",
        letterSpacing: "0.02em",
      },
    },

    // =========================================================================
    // Banner — info takes the same slate as the info badge, on a pale
    // surface in light and a tinted overlay in dark. The other three read
    // from the status tokens and follow the palette on their own.
    // =========================================================================
    banner: {
      "status:info": {
        "--color-accent-muted": "light-dark(#DCE7EE, #8FB0C43D)",
        "--color-text-primary": "light-dark(#35505F, #B8D0DE)",
        "--color-text-secondary": "light-dark(#35505F, #B8D0DE)",
        "--color-accent": "light-dark(#35505F, #B8D0DE)",
      },
    },

    // =========================================================================
    // Switch and radio come out a pill and a circle because both are drawn
    // from --radius-full, which is fixed at 9999px by contract — the one
    // place the radius tokens cannot reach. Squared per control instead,
    // track and thumb, box and dot, so each shares one corner.
    // =========================================================================
    switch: {
      base: { borderRadius: "var(--radius-inner)" },
    },
    "switch-thumb": {
      base: { borderRadius: "var(--radius-inner)" },
      "checked+size:md": {
        width: "16px",
        height: "16px",
        transform: "translateX(16px)",
        ':is([dir="rtl"] *)': { transform: "translateX(-16px)" },
      },
      "checked+size:sm": {
        width: "14px",
        height: "14px",
        transform: "translateX(14px)",
        ':is([dir="rtl"] *)': { transform: "translateX(-14px)" },
      },
    },
    "radio-indicator": {
      base: { borderRadius: "var(--radius-inner)" },
    },
    "radio-indicator-dot": {
      base: { borderRadius: "var(--radius-inner)" },
    },

    // =========================================================================
    // Status dots and progress fills take the filled badge stops, so a dot,
    // a bar and a badge read as one language. The colored status tokens are
    // text stops meant for a pale surface, and read muddy as a solid fill.
    // =========================================================================
    statusdot: {
      "variant:accent": { backgroundColor: "light-dark(#42591A, #A6C74A)" },
      "variant:success": { backgroundColor: "light-dark(#42591A, #A6C74A)" },
      "variant:warning": { backgroundColor: "#B8891F" },
      "variant:error": { backgroundColor: "light-dark(#A24A2C, #D98A63)" },
    },

    progressbar: {
      "variant:accent": { "--color-accent": "light-dark(#42591A, #A6C74A)" },
      "variant:success": { "--color-success": "light-dark(#42591A, #A6C74A)" },
      "variant:warning": { "--color-warning": "#B8891F" },
      "variant:error": { "--color-error": "light-dark(#A24A2C, #D98A63)" },
    },

    // =========================================================================
    // App shell — the rail takes the recessed tone, the header the base
    // tone, each with a hairline on the edge it meets the content on. The
    // component draws those dividers only under some variants, but the rail,
    // header and content sit within a few percent of each other here and
    // bleed together without them.
    //
    // Which token a surface reads depends on the AppShell variant (body
    // under wash and elevated, surface under section and surface), so both
    // are redefined in scope; a plain `backgroundColor` would land in
    // @layer astryx-theme and lose to StyleX's own layer. The hairlines are
    // real borders because these panels' contents paint an opaque
    // background that an inset shadow would sit behind.
    // =========================================================================
    "app-shell-sidenav": {
      base: {
        "--color-background-body": "light-dark(#EFF1E7, #1B1F14)",
        "--color-background-surface": "light-dark(#EFF1E7, #1B1F14)",
        borderInlineEndWidth: "var(--border-width)",
        borderInlineEndStyle: "solid",
        borderInlineEndColor: "var(--color-border)",
      },
    },
    "app-shell-header": {
      base: {
        "--color-background-body": "light-dark(#F8F9F4, #14170F)",
        "--color-background-surface": "light-dark(#F8F9F4, #14170F)",
        borderBlockEndWidth: "var(--border-width)",
        borderBlockEndStyle: "solid",
        borderBlockEndColor: "var(--color-border)",
      },
    },

    // =========================================================================
    // Top nav — a fixed height, so the bar does not resize when the layout
    // crosses into mobile and its contents change. No padding of its own
    // either, so a slot can run flush to the edge and to the full height of
    // the bar; the slots carry their own spacing instead, and only the
    // trailing edge keeps a gap. The mobile bar has no such slot and keeps
    // the component's padding. The height is published as a variable so a
    // slot can fill it: nothing between the bar and its slots stretches, so
    // a percentage height there resolves against a content-sized box. The
    // rail's width rides along for a slot that has to line up with it.
    // =========================================================================
    "top-nav": {
      base: {
        "--railswitch-top-nav-height": "60px",
        // Mirrors SideNav's own default width. Nothing enforces the match:
        // if the rail ever stops lining up with the header block that reads
        // this, the component's default moved and this value needs to be updated.
        "--railswitch-side-nav-width": "260px",
        height: "var(--railswitch-top-nav-height)",
        padding: "0",
        paddingInlineEnd: "var(--spacing-5)",
      },
      "mobile-bar": {
        padding: "var(--spacing-2)",
      },
    },

    // =========================================================================
    // Side nav — full-width rows, taller than the default control height:
    // a top-level rail is a pointing target, not a dense list.
    //
    // The scroll region around the rows carries inline padding that would
    // inset each one, so a negative inline margin pulls them back out to
    // both edges and the same amount is added back inside to keep the
    // label's inset. `width: auto` replaces the component's `width: 100%`,
    // which would add to the negative margins and overflow the rail. Rows
    // are square — one spanning the full width has no corner to round, and
    // rounding it would round the rail's own edge with it.
    //
    // Hover and selection are one wash at two strengths, 6% and 7% of the
    // accent, rather than two tints: a neutral hover reads grey against an
    // olive panel, and at this weight the hue is what the eye catches. The
    // accent rail and the step from secondary to primary ink are what
    // separate the two; icons inherit the row's colour and follow.
    // =========================================================================
    "side-nav": {
      base: {
        "--color-overlay-hover": "light-dark(#42591A0F, #A6C74A0F)",
        "--color-overlay-pressed": "light-dark(#42591A18, #A6C74A18)",
      },
    },
    "side-nav-item": {
      base: {
        height: "var(--spacing-10)",
        borderRadius: "var(--radius-none)",
        marginInline: "calc(var(--spacing-2) * -1)",
        paddingInline: "var(--spacing-4)",
        width: "auto",
        gap: "var(--spacing-3)",
        color: "var(--color-text-secondary)",
        ":hover": { color: "var(--color-text-primary)" },
        // Cancels the scroll region's padding above the list. Each row sits
        // in its own wrapper, so the leading row is reached through the
        // wrapper's position — a bare `:first-child` matches every row. If
        // the markup changes the rule drops out and the padding returns.
        ":where(div:first-child > *)": {
          marginBlockStart: "calc(var(--spacing-2) * -1)",
        },
      },
      "selected:selected": {
        color: "var(--color-text-primary)",
        boxShadow: "inset 3px 0 0 0 var(--color-accent)",
      },
    },

    // =========================================================================
    // Table — a header on the recessed tone over rows on the panel surface,
    // divided by a rule one step lighter than the container hairline: at
    // row density the full hairline reads as a grid, not a separator.
    // =========================================================================
    "table-header": {
      base: { backgroundColor: "light-dark(#EFF1E7, #1B1F14)" },
    },
    "table-header-cell": {
      base: {
        fontSize: "11px",
        fontWeight: "500",
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: "light-dark(#868B77, #A6AA95)",
      },
    },
    "table-cell": {
      base: { "--color-border": "light-dark(#E9EBE0, #262C1F)" },
    },
  },
});
