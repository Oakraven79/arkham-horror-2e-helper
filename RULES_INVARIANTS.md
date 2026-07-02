# Rules Implementation Invariants

These are constraints on any data model, reducer, action, API, or UI that
changes game state.

## State must remain explicit

Do not infer one of these from another when both can vary:

- current phase and active investigator;
- actual investigator count and modified expansion-board count;
- current Doom and Doom maximum;
- terror and whether the monster limit has been permanently removed;
- location, street, Other World first area, Other World second area, Sky,
  Outskirts, Lost in Time and Space, and off-board;
- current Sanity/Stamina and maximum Sanity/Stamina;
- delayed, lose-turn, arrested, explored, insane/unconscious resolution, and
  devoured;
- open gate, gate destination, gate dimensional symbol, gate modifier, gate
  attributes, and seal;
- monster identity, movement type, dimensional symbol, current zone, and Spawn
  status;
- active Environment and active Rumor;
- enabled expansion content and enabled optional variant;
- a persistent effect, its source component, and its expiry condition.

## Derived counts

Let:

- `I` = actual investigators in the game, including multiple investigators
  controlled by one person;
- `B` = enabled expansion boards among Dunwich, Kingsport, and Innsmouth;
- `E = max(1, I - max(0, B - 1))`.

Unless terror has removed the limit:

- `arkhamMonsterLimit = E + 3`
- `outskirtsMaximum = 8 - E`
- `ordinaryNewGateMonsterCount = E >= 5 ? 2 : 1`, before any Herald or card
  additions

The base open-gate awakening count is:

|   E | Threshold |
| --: | --------: |
| 1-2 |         8 |
| 3-4 |         7 |
| 5-6 |         6 |
| 7-8 |         5 |

Add 1 when both Dunwich and Innsmouth boards are enabled.

Use `I`, not `E`, for:

- monster surge size: `max(open gates, I)`;
- gate trophies needed for close-all-gates victory;
- successes required to remove one doom in final battle;
- ordinary card text referring to number of players/investigators.

Source: FAQ, PDF pp. 2, 29, 36.

## Zones and counts

The Arkham monster-limit count includes:

- monsters in base-board locations;
- monsters in base-board streets; and
- monsters in the Sky.

It excludes:

- Outskirts;
- Dunwich, Kingsport, and Innsmouth board areas;
- encounter-only monsters;
- Spawn monsters; and
- monsters outside play.

At terror 10, the limit is removed permanently even if another effect later
changes terror-related state.

The terror-10 awakening check counts Arkham plus Sky monsters only and compares
against twice the normal limit `E + 3`, even though the active placement limit
has been removed.

## Limit semantics

- Monster limit and Outskirts maximum are legal at equality and overflow only
  when exceeded.
- Open-gate awakening happens at equality with its threshold.
- Deep Ones Rising awakens when the sixth space is filled.
- Six elder signs win immediately unless an earlier effect in the same ordered
  resolution has already ended the game.
- A full Doom track awakens immediately and halts the remaining ordinary
  Mythos steps.

Never encode all of these as a generic `value >= limit` rule without a
per-track trigger semantic.

## Phase and event pipelines

### Normal turn

`Upkeep -> Movement -> Arkham Encounters -> Other World Encounters -> Mythos`

All investigators complete one phase before the game enters the next. Pass
first player only after Mythos completes.

### Mythos

At minimum, represent ordered substeps:

1. pre-resolution draw triggers;
2. open gate / surge / prevented gate and monster spawn;
3. Clue placement;
4. monster and open-rift movement, including any resulting rift spawn/doom;
5. immediate post-movement triggers such as Corruption;
6. rift progress for the Mythos movement pattern;
7. Mythos special ability;
8. post-ability or end-of-Mythos effects;
9. first-player pass.

Expansion hooks must attach to the correct point:

- rift progress checks the resolved Mythos movement pattern;
- open rifts activate with the matching symbol and resolve movement/spawn/doom;
- gate bursts move all flyers;
- Corruptions trigger immediately after monster movement;
- Ancient Whispers moves in Mythos only if it did not move in Arkham
  Encounters;
- Act draw triggers may occur immediately on each qualifying Mythos draw;
- Mudslides and similarly worded post-Mythos effects happen after Activate
  Mythos Ability.

### Opening a new gate

Use an ordered transaction:

1. determine whether seal, open gate, or empty location applies;
2. resolve prevention/replacement effects;
3. if opening, add doom unless a rule omits it;
4. check immediate awakening;
5. place the gate;
6. remove Clues at the location;
7. resolve revealed gate attributes that trigger when it opens and check
   immediate awakening again;
8. draw through and delay surviving investigators there;
9. place the required monster count;
10. apply monster limit/Outskirts after each placement;
11. resolve later expansion consequences.

A gate burst at a seal skips the normal doom addition, but it still removes the
seal, opens a gate, and places a monster. An Innsmouth prevented gate adds an
uprising token.

### Monster surge

Keep these as separate values:

- number to draw;
- legal distribution by gate before limit handling;
- actual monster identities drawn;
- placement destination after monster-limit handling.

Do not draw identities before the players make a required placement
distribution choice.

### Closing a gate

The close event must know:

- whether it was an investigator close or a card/effect close;
- whether a trophy is awarded;
- whether sealing is legal and chosen;
- gate symbols used for removing monsters and Corruption;
- whether the gate is Endless or Split;
- where the marker goes after resolution.

Clear matching monsters from Arkham, Sky, and Outskirts, not expansion boards,
unless a specific effect says otherwise.

## Choice ownership

Preserve player choice for:

- Fight or Lore to close;
- whether to spend Clues to seal after a successful close;
- which legal matching return gate to use;
- monster and encounter ordering where allowed;
- simultaneous effect ordering;
- monster surge distribution;
- first-player tie breaks;
- Injury/Madness versus normal zero-stat consequences;
- legal optional actions and card responses.

Do not choose automatically because one option appears strategically better.
If all players must agree and cannot, route the decision to first player.

## Investigator invariants

- Delayed is boolean, not a counter.
- Standing from delayed is not normal movement.
- Lose-turn is not delayed.
- An explored marker belongs to an investigator at a specific gate area and is
  lost when the investigator or gate leaves.
- Returning from an Other World may preserve delayed.
- Current stats cannot exceed maxima unless a specific component permits it.
- Simultaneous zero current Sanity and Stamina devours.
- Zero maximum Sanity or Stamina devours.
- In final battle, devouring eliminates rather than replacing.
- Outside final battle, a replacement investigator enters at the beginning of
  the next turn.

## Gate and seal invariants

- A normal area cannot simultaneously have a seal and an open gate unless a
  transient event is being resolved.
- A sealed location is stable.
- Only an unstable location can be sealed.
- An open gate suppresses normal location special abilities and Clue placement.
- Gate destination and dimensional symbol are separate.
- Split gates may have two of each.
- Gate attributes are composable and cannot be represented by a single
  ordinary/special boolean.
- A Moving Gate can exist in a street or stable location, but that does not
  make sealing there legal.

## Monster invariants

- "Appears," "moves," "is placed," "is drawn," "is defeated," and "returns to
  cup" are distinct events.
- Encounter-only monsters have transient placement.
- Spawn monsters are never inserted into the normal cup or Outskirts and do not
  become trophies.
- A monster can change zones without appearing; do not fire appear triggers on
  movement.
- A monster can be defeated without becoming a trophy.
- Monster-limit enforcement is required when entering Arkham from an expansion
  board or when a rift spawns a monster, not only when a gate opens.
- Expansion-board monsters entering the Sky become part of the Arkham limit.

## Persistent effect invariants

- At most one Environment is active.
- At most one Rumor is active.
- Activity and closed markers retain a link to their source effect.
- Discarding/replacing the source removes its associated temporary markers.
- Benefits, Detriments, Blights, Corruptions, Conditions, Personal Stories,
  Relationships, Pacts, and Institutions have different ownership and expiry
  rules; do not collapse them into one generic status without type-specific
  behavior.

## Expansion isolation

- Expansion flags and optional variant flags are separate.
- Do not enable a Herald because its parent expansion is enabled.
- Do not enable Epic Battle because Kingsport is enabled.
- Do not enable Personal Stories because Innsmouth is enabled.
- Do not enable Lurker Pacts/Power because Lurker gate markers or Relationships
  are enabled.
- Miskatonic content checks all required expansion icons.
- Turning off a module must either reject incompatible active state or perform
  an explicit, logged migration. Never silently discard it.

## Automation and correction

The helper should calculate warnings and legal consequences, but the physical
table is authoritative.

Every automated state change should:

- record the rule/event that caused it;
- preserve the previous value;
- be reversible or manually correctable;
- avoid deleting unrelated state; and
- expose unresolved player choices instead of guessing.

## Rules-facing change checklist

Before declaring a change complete:

- [ ] Identify the exact rule source and PDF page.
- [ ] Check the FAQ for a correction.
- [ ] Check every expansion hook at that timing point.
- [ ] Use actual versus modified count correctly.
- [ ] Preserve legal choices and first-player tie breaks.
- [ ] Confirm equality versus overflow semantics.
- [ ] Confirm all affected zones.
- [ ] Confirm immediate win/awakening checks.
- [ ] Add or update tests from `RULES_TEST_MATRIX.md`.
- [ ] Keep a manual correction path.
