# Codebase Review And Helper Roadmap

This note reviews the current Next.js/Payload codebase with emphasis on collections and components, then maps it to a table-side Arkham Horror helper.

## Current Shape

The repo is a Payload 3 and Next 15 app. It still has the Payload starter public page, but the game-specific work has started in three places:

- `src/collections/MythosCards.ts`
- `src/components/*Card*.tsx`
- Storybook stories for card previews

The current Payload collections are:

- `users`: auth-enabled admin users.
- `media`: upload collection with an `alt` field and public read access.
- `mythos-cards`: a custom collection for Mythos card rendering.

The current card components are:

- `MythosCardFront`
- `MythosCardBack`
- `OtherworldEncounterCardFront`
- `OtherworldEncounterCardBack`

## What Is Working Well

- The Mythos card component already captures a real high-value game object: title, subtype, text, gate/location art, and black/white monster movement symbols.
- Payload live preview is wired to `mythos-cards`, which is useful for content iteration.
- Storybook examples are doing good product discovery. They cover Headlines, Environments, Rumors, long text, missing gate locations, and custom alternate lower-left content.
- Constants are shared between Payload fields and Storybook controls, which reduces drift for card type and monster icon options.
- The card rendering components are standalone enough to reuse in a future dashboard.

## Collection Review

### `MythosCards`

Current fields:

- `title`
- `cardType`
- `desc`
- `encounterLocation`
- `altLocationText`
- `altLocationImg`
- `monsterMoveWhite`
- `monsterMoveBlack`
- `boxedset`

This is a solid card-rendering model, but not yet a play-helper model.

Gaps for helper use:

- The gate/opening location and clue location are not separated. Existing `encounterLocation` appears to represent the lower-left gate location/art, while clues and activity markers live inside free text.
- Gate burst cards are not modeled.
- Activity/closed markers are not structured.
- Rumor pass/fail/ongoing text is not structured.
- Environment subtype is embedded in `cardType`; that is okay for display, but helper behavior wants a normalized subtype such as `headline`, `environment`, `rumor`, with optional environment flavor.
- Only three Arkham locations are currently defined in constants.
- `altLocationImg` is plain text rather than a media relationship or controlled asset path.
- `boxedset` is a display string, not a relationship or stable expansion key.
- The collection imports constants from `src/components`, which works now but couples server schema to UI modules.

Suggested next collection direction:

- `expansions`: stable key, display name, type, enabled modules.
- `locations`: name, board, neighborhood, stable/unstable, street/location, arrows, aquatic, depot, image.
- `mythos-cards`: title, expansion, subtype, environmentType, gateLocation, isGateBurst, clueLocation, movementWhite, movementBlack, effectText, activityMarkers, closedMarkers, rumor fields.
- `other-world-encounters`: color, text blocks, expansion, source identifiers.
- `game-sessions`: player count, active expansions, phase, first player, doom, terror, open gates, sealed locations, active environment, active rumor, monster/outskirts counts, and turn log.
- `investigators-in-session`: player name, investigator name, current place, delayed/lost/explored flags, clue count, sanity/stamina, Injury/Madness/Relationship/Personal Story flags.

### `Media`

The media collection is minimal and fine for early work. For helper use, it will likely need image sizes or at least conventions for board location thumbnails, card art references, and icons.

### `Users`

The users collection is standard Payload auth. No concern for this stage.

## Component Review

### `MythosCardFront`

Strengths:

- Uses markdown for card body text.
- Handles long text with size classes.
- Normalizes single/multiple movement symbols.
- Supports alternate lower-left content for unusual cards.

Issues to clean up before building on it:

- `encounterObj` is computed in `MythosCardFront` and never used.
- Components that render nothing return `undefined`; React prefers `null`.
- Movement icon `key={icon}` can collide if the same icon appears twice.
- Images do not have meaningful `alt` text.
- The title length is used to shrink both title and card type; card type sizing should depend on the card type text.
- Layout is highly absolute and fixed-width, which is fine for card previews but should not drive dashboard layout.

Suggested direction:

- Keep this as a print/card-preview component.
- Extract smaller display primitives: card frame, movement symbol row, location medallion, markdown text block.
- Build separate dashboard components instead of stretching the card CSS into app layout.

### `OtherworldEncounterCardFront`

Strengths:

- Captures the repeated "header plus encounter text" structure.
- Color variants map to Other World encounter colors.

Issues:

- The `.map()` output is missing a React key.
- `ReactMarkdown` is wrapped in a `<p>`, which can produce invalid nested paragraphs.
- There is no Payload collection behind Other World encounters yet.
- The component is presentation-only and has no dynamic sizing strategy for many or long text blocks.

Suggested direction:

- Add an `other-world-encounters` collection if these cards remain part of the authoring goal.
- Use a `<div>` wrapper for markdown blocks.
- Add text-length and block-count layout handling, or limit card authoring input with validation.

### CSS And App Routes

Current public frontend is still the Payload blank template, including metadata and tests that assert the blank page. For a helper, this should become the first real screen.

Notable cleanup candidates:

- `src/app/(frontend)/page.tsx`: starter content should be replaced by the helper dashboard.
- `src/app/(frontend)/layout.tsx`: metadata still says Payload Blank Template.
- `tests/e2e/frontend.e2e.spec.ts`: test still expects the starter page.
- `src/app/preview/[id]/page.tsx`: imports `notFound` but does not use it; missing cards should be handled.
- `src/components/card.css`: good for card art experiments, but it should not become the global dashboard layout system.

## Helper System Recommendation

The current codebase should evolve from "card renderer" into "session assistant". The card renderer remains useful, but the table-side screen should focus on state, reminders, and turn flow.

### MVP Screen

First screen for a board-side display:

- Large phase rail: Upkeep, Movement, Arkham Encounters, Other World Encounters, Mythos.
- Current action panel with the next checklist item.
- Doom, terror, open gates, monster limit, Outskirts, and first player in large readable counters.
- Active Environment and Rumor panel.
- Investigator strip showing location/status reminders.
- Mythos resolver panel that reuses the existing Mythos card visual or a simplified card summary.

### MVP Interaction

Core flow:

1. Create or resume a game session.
2. Select player count, Ancient One doom max, and expansions/variants.
3. Step through phases with manual checkboxes.
4. During Mythos, select or draw a Mythos card.
5. The app guides gate/surge, clue placement, monster movement symbols, and card effect.
6. The app records a turn log and updates counters.

The app should not require users to enter every monster and item immediately. A practical MVP can track counts and reminders first, then add detailed board state later.

### High-Value Automations

- Monster limit and Outskirts warnings.
- Open gate awakening threshold warnings.
- Terror milestones and shop closures.
- "Only one Environment" and "only one Rumor" enforcement.
- Gate burst resolution.
- Expansion Mythos reminders: rifts, corruption triggers, Acts, Deep Ones Rising, Ancient Whispers, patrols.
- Close/seal checklist with reminder to clear matching-symbol monsters.

### Data Model Shape

Suggested entities:

- `Expansion`
- `Location`
- `AncientOne`
- `Investigator`
- `MythosCard`
- `OtherWorldEncounterCard`
- `GameSession`
- `SessionInvestigator`
- `OpenGate`
- `SessionLogEntry`
- `RuleReminder`

For a local helper, it may be useful to keep `GameSession` state in Payload but allow optimistic client-side edits, since the screen will be used live at the table and should never feel slow.

### Expansion Modules

Treat expansion mechanics as feature modules:

- Base: phases, doom, terror, gates, monster limit, Mythos.
- Dunwich: Dunwich Horror track, vortices, Injury/Madness, tasks/missions.
- Kingsport: rift tracks, open rifts, Herald/Guardian, Epic Battle.
- Innsmouth: Deep Ones Rising, Feds Raid, martial law, Innsmouth Look, personal stories.
- Dark Pharaoh: Ancient Whispers, Exhibit Encounters, patrols, Benefits/Detriments.
- King in Yellow: Act deck, Blights, Yellow Sign, riot monsters.
- Black Goat: Cult Membership, Cult Encounters, Corruption triggers.
- Lurker: Relationships, special gate markers, Dark Pacts, Reckonings, Power.
- Miskatonic: overlay content, Institutions, extra cards for earlier modules.

### Product North Star

The best version of this project is not a rules encyclopedia. It is a quiet "game night co-pilot" on a nearby screen:

- It tells the group what to do next.
- It remembers the admin that physical components make easy to miss.
- It keeps the table moving without taking over the table.
- It supports expansion complexity through toggles.
- It lets players correct state quickly when the physical board disagrees with the app.

## Suggested Build Order

1. Replace the starter frontend with a read-only dashboard mock using hard-coded/session-local state.
2. Add structured constants for phases, tracks, player-count thresholds, and expansion modules.
3. Expand `MythosCards` into helper-friendly fields while preserving the current card preview.
4. Add `GameSessions` and a lightweight session state reducer.
5. Build the guided Mythos resolver.
6. Add expansion modules one at a time, starting with the ones that create recurring Mythos-phase reminders: Kingsport rifts, Innsmouth Deep Ones, King in Yellow Acts, Black Goat corruption.
7. Add tests around derived limits and phase flow before adding full UI tests.

## Content And Publishing Note

The repo already contains official-looking rulebooks and card-art assets. For private table use that may be fine, but if this helper is ever published publicly, be careful with official card text, scans, art, and rulebook excerpts. The safer product shape is user-entered card data plus original helper UI and short rule reminders.

