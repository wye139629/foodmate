Design and implement a responsive, mobile-first social application UI using React and Tailwind CSS.

The app should feel warm, cute, slightly nostalgic, and editorial, with restrained neo-brutalist influences.

The primary visual language should NOT be heavy neo-brutalism.
Instead, combine soft rounded components, warm flat colors, crisp dark outlines, compact editorial layouts, and subtle retro interface references.

The overall feeling should be:
warm, friendly, graphic, structured, slightly nostalgic, compact, approachable, and visually distinctive.

Use the existing CSS theme tokens whenever possible rather than introducing arbitrary new colors or radius values.


DESIGN DIRECTION

Create a warm retro-editorial mobile interface inspired by:
- independent magazines
- paperback books
- vintage catalogues
- printed indexes and directories
- simple retro digital interfaces
- compact editorial mobile layouts

Use neo-brutalist influences only in a restrained way through:
- crisp outlines
- flat color fills
- strong geometric structure
- occasional hard shadows on emphasized elements

Do not make the interface look like a typical bold neo-brutalist website.

Avoid:
- overly chunky layouts
- extremely thick borders
- large hard shadows on every element
- excessively playful sticker-like composition
- overly rounded bubble UI
- overly clean generic SaaS styling

Pixel-art avatars and line-art doodles should act only as supporting visual accents.
Do not turn the overall interface into a pixel-art or retro-game aesthetic.


COLOR SYSTEM

Use the following core palette:

- Background: #FBF9F5
- Text and dark outlines: #1A1A1A
- Card surface: #FFFDF8
- Primary orange: #FFB380
- Secondary sky blue: #99E5FF
- Muted cream / beige: approximately #F3EEE5
- Soft orange accent tint: approximately #FFF0E6

Do NOT use pure white #FFFFFF for large page or card surfaces.

Orange should be the main visual accent.

Sky blue should be used more sparingly as a supporting accent.

Most screens should visually be dominated by:
warm cream + dark ink + orange.

Use accent colors primarily for:
- buttons
- active states
- selected tabs
- small labels
- header areas
- highlighted sections
- selected navigation items

Do not distribute orange, blue, and other accent colors evenly across every section just to make the interface colorful.

Keep the palette restrained and intentional.


TYPOGRAPHY

Use:
- DM Mono for headings, labels, small section titles, tabs, and occasional editorial accents
- Outfit for primary body text, buttons, inputs, and longer readable content

Do not use:
- Inter
- Geist
- Space Grotesk

Typography should feel slightly editorial and mechanical, but still friendly and highly legible.

Do not use a font size smaller than 12px.

Recommended scale:

Display / H1:
- 32px to 36px
- weight 700
- line-height approximately 1.15

H2:
- 22px to 26px
- weight 700
- line-height approximately 1.2

H3:
- 17px to 20px
- weight 600
- line-height approximately 1.3

Body:
- 14px to 16px
- weight 400 to 500
- line-height approximately 1.5

Captions / labels / tags:
- 12px to 13px
- weight 500 to 600
- line-height approximately 1.4

Buttons:
- 14px to 16px
- weight 600

Avoid oversized modern SaaS typography.

Do not use giant display headings purely for decoration.

Keep text hierarchy compact and structured.


LAYOUT

Design mobile-first for approximately 375px to 430px screen widths.

Use:
- 16px horizontal page padding
- approximately 8px spacing for tightly related content
- 12px to 16px spacing between component groups
- 24px to 32px between major sections

The layout should feel compact but never cramped.

Prefer moderate information density over large empty whitespace.

Use a mix of:
- rounded cards
- compact list rows
- horizontal dividers
- outlined rectangular sections
- flat colored header blocks
- tab strips
- grouped rows
- editorial section labels

Do not place every piece of content inside a separate floating card.

Some screens should feel like a structured editorial page rather than a collection of floating cards.

Use divider lines and alignment to create rhythm, instead of relying only on large spacing between elements.

Avoid:
- giant hero sections
- oversized blank areas
- dashboard-like floating card grids
- repeated card-with-shadow patterns


BORDERS

Use crisp dark borders based on #1A1A1A.

Default:
- 1px to 1.5px border for standard controls, list sections, tabs, and secondary surfaces

Emphasized elements:
- up to 2px border for primary buttons, selected states, key cards, or important controls

Do not apply the same border thickness to every component.

Borders should feel precise and graphic, not cartoonishly heavy.


CORNER RADIUS

Maintain the softer rounded feel from the original design direction.

Use approximately:
- Cards: 8px to 12px
- Buttons: 8px to 12px
- Inputs: 6px to 10px
- Small tags: may use slightly more rounding where appropriate

Tailwind rounded-lg is a good default for primary components.

Avoid:
- excessive rounded-xl or rounded-2xl usage
- huge soft cards
- pill-shaped buttons everywhere
- bubble-like component styling

Do not make the entire interface square.
Do not make the entire interface heavily rounded either.

Use radius hierarchy intentionally.


SHADOWS

Do not use hard shadows on every component.

Most secondary surfaces should remain flat and rely on:
- borders
- background contrast
- divider lines
- spacing

Use hard shadows only for selected emphasized elements such as:
- a primary action button
- a featured card
- an important draggable or floating item
- selected interactive content

Preferred emphasized shadow style:

shadow-[3px_3px_0px_0px_#1A1A1A]

Shadows must be:
- flat
- non-blurred
- dark
- graphic

Avoid large 4px to 6px hard shadows across the entire interface.

Do not use soft floating shadows or Material-style elevation.


CARDS & SECTIONS

Cards should have:
- warm cream surfaces
- dark outlines
- moderate 8px to 12px rounding
- compact internal padding
- minimal shadow by default

Do not use identical card styling everywhere.

Use alternative section treatments such as:
- divider-separated rows
- flat colored bands
- outlined content groups
- compact list items
- small tabbed areas

Avoid the common AI-generated pattern where every section becomes a rounded floating white card.


BUTTONS

Buttons should feel solid, graphic, and friendly.

Primary buttons:
- warm orange fill #FFB380
- dark text
- dark border
- medium rounding
- optional small hard shadow

Secondary buttons:
- sky blue or muted cream
- dark border
- usually no shadow

Avoid pill-shaped primary buttons.

Press interaction should feel physical.

Use an interaction similar to:

active:translate-x-[2px]
active:translate-y-[2px]
active:shadow-[1px_1px_0px_0px_#1A1A1A]

Keep button text compact and clear.


INPUTS

Inputs should be:
- warm cream or subtle tinted background
- clearly outlined
- medium rounded corners
- compact but touch-friendly
- approximately 44px minimum interactive height

Use clear labels.

Avoid oversized search bars and overly soft SaaS-style form components.


NAVIGATION

Use simple mobile navigation such as:
- bottom navigation
- compact top navigation
- tab bars

Active navigation states may use orange as the primary accent.

Use:
- small monochrome icons
- clear labels
- subtle divider borders

Avoid putting every icon inside a circle or rounded square.

Navigation should feel lightweight and editorial rather than app-store generic.


ICONS

Do not use Lucide icons.

Use custom inline SVG line icons.

Icon style:
- approximately 1.5px to 2px stroke
- rounded stroke caps when appropriate
- simple geometry
- compact proportions
- mostly monochrome
- consistent visual weight

Icons should feel like editorial pictograms or simple retro interface symbols.

Do not use:
- sparkle icons
- decorative gradient icons
- generic filled SaaS icon sets
- emoji icons


AVATARS & ILLUSTRATION

Use custom pixel-art avatars for user profiles.

Pixel avatars should:
- be small
- use a restrained color palette
- feel charming and slightly nostalgic
- visually support the UI rather than dominate it

Do not turn the UI into a pixel-art game.

Use simple line-art doodles sparingly as decorative accents.

Doodles should:
- use dark line work
- remain simple
- feel handmade or editorial
- avoid excessive detail

Do not use generic stock illustrations.


RESPONSIVENESS

Use mobile-first responsive behavior.

For wider screens:
- keep the main interface visually restrained
- center content where appropriate
- avoid stretching mobile content edge-to-edge across large desktop widths
- introduce additional columns only when the content clearly benefits from it

The mobile experience should remain the primary design target.


SHADCN USAGE

Shadcn components may be used only as structural primitives.

Restyle them to match this custom design system.

Do not preserve the default shadcn SaaS appearance.

Override default:
- rounding
- muted grays
- shadows
- spacing
- button styling
- card styling
- form styling

Do not allow the UI to drift into a generic shadcn dashboard aesthetic.


VISUAL HIERARCHY

Do not apply:
- border
- radius
- shadow
- accent color

uniformly across all components.

Create hierarchy.

Primary elements may be visually stronger.

Secondary sections should usually be quieter and flatter.

Use fewer decorative treatments, but make each one intentional.


STRICT NEGATIVE CONSTRAINTS

Do not include:
- pure white #FFFFFF large surfaces
- harsh gradients
- neon colors
- rainbow coloring
- purple and black combinations
- glassmorphism
- soft Material-style floating shadows
- heavy hard shadows on every element
- 3px to 4px borders across the entire interface
- excessive rounded-xl or rounded-2xl cards
- pill-shaped UI everywhere
- bubble-like components
- floating dashboard card grids
- generic SaaS layouts
- oversized hero typography
- excessive whitespace
- generic stock illustrations
- Lucide icons
- sparkle icons
- emojis
- checkmark bullets
- colored left stripes on cards
- fake testimonials
- 3 pricing tiers
- generic 3-feature grid sections
- Inter
- Geist
- Space Grotesk
- font sizes smaller than 12px
- em dashes


IMPLEMENTATION

Use React and Tailwind CSS.

Reuse the existing design tokens and CSS variables whenever possible.

Prefer semantic reusable components for:
- buttons
- inputs
- tabs
- list rows
- profile items
- cards
- navigation
- labels
- badges

Keep the component structure reusable without over-engineering.

Prioritize:
1. visual consistency
2. clear hierarchy
3. mobile usability
4. restrained editorial personality
5. responsive behavior

The final result should feel like a warm modern social app influenced by retro editorial design, with soft rounded components and only subtle neo-brutalist character.
