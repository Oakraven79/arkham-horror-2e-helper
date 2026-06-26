# Arkham Horror 2e Rules Synthesis For Helper Design

This note synthesizes the rulebooks in this folder into product and data-model implications for a table-side helper. It is intentionally operational: what the players need to remember, when the game state changes, and which expansion modules add extra admin.

## Sources Read

- `arkham_horror_core_rulebook.pdf`
- `complete_arkham_horror_faq.pdf`
- `ArkhamHorror_v7.6.pdf`
- `dunwich_horror_rules.pdf`
- `kingsport_horror_rules.pdf`
- `innsmouth_horror_rules.pdf`
- `curse_dark_pharoah_rules.pdf`
- `king_in_yellow_rules.pdf`
- `black_goat_rules.pdf`
- `lurker_at_the_threshold_rules.pdf`
- `miskatonic_horror_rules.pdf`

## Core Game Loop

Arkham Horror is a turn-based cooperative game where the main admin load is not hidden information, but sequencing. A helper should make the current phase, required checks, and state changes obvious without forcing players to enter every physical component.

The normal turn has five phases:

1. Upkeep
2. Movement
3. Arkham Encounters
4. Other World Encounters
5. Mythos

Important recurring state:

- First player, player count, and active investigator order.
- Ancient One doom track: current doom and max doom.
- Terror level and terror milestones.
- Open gates and sealed locations.
- Clue tokens on board locations.
- Monster count in Arkham plus the Sky, monster limit, and Outskirts count.
- Active Environment card and active Rumor card.
- Current phase, current turn, and a log of recent changes.

## Phase Admin

### Upkeep

Players refresh exhausted cards, resolve required upkeep effects, and adjust skills. This is a good place for the app to show a checklist rather than automate every card. Useful reminders:

- Bless, Curse, Bank Loan, Retainer, and similar upkeep rolls.
- Exhausted cards refresh.
- Skill sliders may move according to focus.
- Expansion upkeep hooks can happen here, such as Innsmouth federal raid clue spending or mission sacrifices.

### Movement

Arkham movement is based on Speed and board connections. Investigators must deal with monsters when leaving or ending in spaces with monsters. Other World movement is stepwise: first area to second area, then back to an open matching gate with an explored marker.

Useful helper features:

- Delayed investigator reminders.
- "Return from Other World" reminder with explored marker.
- Clue pickup reminder when movement ends on a clue location.
- Travel between Arkham and expansion boards through the Train Station/depot rule.
- Expansion movement reminders: aquatic, stalker, flying, elusive, martial law, patrol markers.

### Arkham Encounters

If an investigator is in a location with no gate, draw the matching neighborhood/location encounter. If the location has a gate, the investigator is drawn through unless they have returned with an explored marker, in which case they may close or seal it.

Useful helper features:

- Show whether each investigator should draw an encounter, enter a gate, or attempt close/seal.
- Close/seal flow: choose Fight or Lore, apply gate modifier, optionally spend 5 clues to seal.
- Elder Sign flow: no close roll, spend the card, lose 1 Sanity and 1 Stamina, remove one doom from the Ancient One track, and seal the location.
- On gate closure, remind players to remove monsters with the matching dimensional symbol from Arkham, the Sky, and the Outskirts.

### Other World Encounters

Investigators in Other Worlds draw gate cards until a color/symbol matches the current Other World, then resolve the matching specific entry or the generic "Other" entry.

Useful helper features:

- Show who needs an Other World encounter.
- Track which Other World area each investigator occupies.
- Remind that encounter monsters do not remain on the board after resolution.

### Mythos

The Mythos phase is the strongest candidate for guided automation. It has a fixed sub-sequence:

1. Resolve the gate location.
2. Place the clue token.
3. Move monsters.
4. Resolve the card ability.
5. Pass first player.

Gate location outcomes:

- Sealed location: nothing opens, unless the card is a gate burst.
- Existing open gate: monster surge.
- No gate or seal: add doom, open a gate marker, discard clues on that location, and spawn a monster.

Monster surge:

- Spawn monsters equal to the greater of open gates or players.
- Distribute evenly across open gates, with the surge location receiving the extra monster if needed.
- Respect monster limit/outskirts unless the terror level has removed the limit.

Clue placement:

- Place a clue on the listed location unless an open gate is there.
- If investigators are already there, they may immediately take the clue.

Monster movement:

- White and black Mythos movement boxes map dimensional symbols to board arrows.
- Normal, stationary, fast, unique, flying, aquatic, stalker, and elusive movement need reminders.
- A monster sharing a space with an investigator generally stays put.

Card ability:

- Headline resolves immediately and is discarded.
- Environment remains in play and replaces the previous Environment.
- Rumor remains until pass/fail; only one Rumor can be active, so later Rumors have their special text ignored after other Mythos effects.
- Activity and closed markers should be tracked while the relevant card remains active.

## Core Track Rules

### Doom

Doom usually advances when a new gate opens. If the last doom space is filled, the Ancient One awakens immediately. Elder Signs are one of the few ways to reduce current doom.

### Terror

Terror never decreases. Each increase removes a random Ally from availability. At 3 the General Store closes, at 6 the Curiositie Shoppe closes, at 9 Ye Olde Magick Shoppe closes, and at 10 Arkham is overrun and the monster limit is removed. Further terror increases at 10 add doom instead.

### Monster Limit And Outskirts

Monster limit is `players + 3` for monsters in Arkham and the Sky. Outskirts capacity depends on player count:

| Players | Outskirts Capacity |
| --- | ---: |
| 1 | 7 |
| 2 | 6 |
| 3 | 5 |
| 4 | 4 |
| 5 | 3 |
| 6 | 2 |
| 7 | 1 |
| 8 | 0 |

When Outskirts exceeds capacity, return those monsters to the cup and raise terror by 1.

### Open Gate Awakening Threshold

Too many open gates can awaken the Ancient One:

| Players | Awakens At Open Gates |
| --- | ---: |
| 1-2 | 8 |
| 3-4 | 7 |
| 5-6 | 6 |
| 7-8 | 5 |

The Ancient One can also awaken from no gate markers, no monsters in the cup when one must be drawn, or terror 10 plus twice the normal monster limit in play.

## Expansion Modules

### Dunwich Horror

Admin added:

- Dunwich board and Train Station/depot travel.
- Dunwich monsters do not count against the Arkham monster limit and do not go to Outskirts.
- Vortices return monsters to the cup, raise terror, and add Dunwich Horror tokens.
- Three Dunwich Horror tokens summon the Dunwich Horror at Sentinel Hill.
- Injury and Madness cards as alternatives to the normal 0 Stamina/Sanity penalties.
- Tasks and Missions use ordered location progress, usually marked with clue tokens on the card.
- Gate bursts can remove elder signs and open gates without adding doom or causing a surge.
- Stalker movement.

Helper implication: a Dunwich module needs a Dunwich Horror track, vortex resolution button, Injury/Madness badges per investigator, and a task/mission progress tracker.

### Kingsport Horror

Admin added:

- Kingsport board and Train Station/depot travel.
- Kingsport monsters do not count against the Arkham monster limit and do not go to Outskirts.
- Rift tracks fill from Mythos movement patterns.
- Open rifts move like monsters, spawn monsters, and may add doom when moving on their matching color.
- Rift progress markers can be investigated and eventually close open rifts.
- Aquatic movement, elusive monsters, Herald/Guardian variant, and Epic Battle variant.

Helper implication: a Kingsport module should track three rift tracks, open rift location/symbol/color, and investigation progress. This is a high-value screen-side tracker because it is easy to forget during Mythos.

### Innsmouth Horror

Admin added:

- Innsmouth board and Train Station/depot travel.
- Innsmouth monsters do not count against the Arkham monster limit and do not go to Outskirts.
- Martial law begins once at least half the Ancient One doom track is full and causes arrest checks in Innsmouth.
- Innsmouth Jail and Sawbone Alley rescue rules.
- Innsmouth Look draw/check.
- Deep Ones Rising track; if filled, the Ancient One awakens.
- Feds Raid Innsmouth track; investigators spend clues during Upkeep from matching neighborhoods to clear both the federal raid and Deep Ones tracks.
- Vortices add terror and Deep Ones Rising tokens.
- Personal Story variant.

Helper implication: Innsmouth needs clear warning lights for martial law, Deep Ones Rising, and Feds Raid progress. It should prompt Upkeep clue-spend opportunities for investigators in Innsmouth neighborhoods.

### Curse Of The Dark Pharaoh

Admin added:

- Exhibit Items and Exhibit Encounters.
- Ancient Whispers marker moves and grants at most one Exhibit Encounter per turn.
- Benefit and Detriment conditions.
- Patrol markers force Sneak checks when entering/leaving/ending in patrolled street areas and are cleared when terror rises.
- Optional Dark Pharaoh Herald rules.

Helper implication: track Ancient Whispers location, whether an Exhibit Encounter has happened this turn, active patrol markers, and Benefit/Detriment cards per investigator.

### The King In Yellow

Admin added:

- Act deck advances when "The Next Act Begins!" Mythos cards resolve.
- Magical Effect cards.
- Optional Herald adds Yellow Sign tokens, Blight cards, and riot monsters.
- Blights can globally change encounters and city behavior.

Helper implication: track Act deck state, active Blights, Yellow Sign count, and remind when a Mythos card should advance the Act deck.

### The Black Goat Of The Woods

Admin added:

- "One of the Thousand" Cult Membership cards.
- Cult Encounter deck for members at unstable locations.
- Corruption deck stacked green then red; effects can trigger when Mythos movement symbol and color match.
- Matching corruption cards are removed when gates with the same dimensional symbol close.
- Corruption deck is not reshuffled; drawing from empty can have severe consequences.
- Optional Herald and difficulty cards.

Helper implication: track cult members, active corruption cards with movement triggers, and prompt corruption resolution immediately after monster movement.

### The Lurker At The Threshold

Admin added:

- Relationship cards between neighboring players.
- Gate bursts.
- Replacement gate markers with extra effects such as devouring, doom, endless, monstrous, blood, madness, moving, and split gates.
- Optional Herald adds Dark Pacts, Reckoning cards, and Power tokens.

Helper implication: the gate model should not assume a gate is only "location plus Other World plus modifier". It needs optional icons/effects and moving gates.

### Miskatonic Horror

Admin added:

- Modular content that extends earlier expansions.
- More Relationship, Reckoning, Epic Battle, and Mythos interactions.
- Institution variant, including Miskatonic University and related student/expedition tracking.
- Additional Herald/Guardian/Institution compatibility rules.

Helper implication: model expansions and variants independently. Miskatonic is best treated as an overlay pack that augments other modules rather than as one standalone mechanic.

## FAQ And Timing Implications

The FAQ reinforces that the helper should expose timing and ownership decisions rather than hide them:

- Monster surge placement happens during the Open Gate and Spawn Monster step.
- Player count matters for monster limit, Outskirts, and open gate awakening thresholds, but some card effects use other counts or fixed wording.
- Expansion boards often exclude monsters from the Arkham monster limit, but flying monsters and Sky interactions still matter.
- Gate burst, rift, corruption, Act, and Herald timing all depend on Mythos ordering.
- Activity markers are reminders, so the app should treat many markers as reminders tied to source cards, not as separate rules engines.

## Design Takeaways

The strongest first helper is a table-side state dashboard with a guided Mythos resolver. It does not need to replace the physical board or fully simulate all card text.

Recommended principles:

- Keep the app manual-friendly: every automated state change should be editable.
- Treat the board as shared truth: the app tracks reminders, limits, and derived warnings.
- Make expansions toggleable modules.
- Show "what must happen now" rather than a wall of rules.
- Keep a turn log so players can recover from missed admin.
- Separate official card rendering from helper state; cards are content, session state is behavior.

