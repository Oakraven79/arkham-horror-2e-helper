# Core Rules

This file preserves the recurring rules of Arkham Horror Second Edition. Later
FAQ corrections are incorporated. See `RULES_FAQ_AND_TIMING.md` for the edge
cases behind them.

## Setup

At minimum, setup must preserve this state:

1. Set terror to 0.
2. Place one Clue token at every unstable location marked with a red diamond.
3. Choose the first player.
4. Choose or randomly deal investigators.
5. Choose or randomly select an Ancient One and resolve its start-of-game
   instructions.
6. Prepare decks and special-card supplies.
7. Give fixed possessions before shuffling the investigator decks.
8. Shuffle the investigator decks, then give random possessions. Abilities
   affecting random draws apply during setup.
9. Set current Sanity and Stamina to the printed maxima. Place each skill
   slider at any stop; initial placement ignores Focus.
10. Build the monster cup, excluding Mask monsters unless the Ancient One or
    another rule includes them.
11. Shuffle Mythos, Gate cards, and gate markers.
12. Place investigator markers at home locations.
13. Draw and fully resolve an initial Mythos card. Discard and redraw a Rumor
    or a card with no gate location. Add doom when the initial gate opens.

Sources: core rulebook, PDF p. 5; FAQ, PDF p. 2.

## Turn state machine

A normal turn has exactly five phases:

1. Upkeep
2. Movement
3. Arkham Encounters
4. Other World Encounters
5. Mythos

Within each phase, investigators act clockwise from the first player. After the
Mythos phase is complete, pass the first-player marker left and begin the next
turn. Do not pass it between phases. (Core rulebook, PDF pp. 5, 12)

### Upkeep

Each investigator resolves:

1. Refresh exhausted cards.
2. Perform mandatory Upkeep actions in an order chosen by that investigator.
3. Adjust skill sliders by no more than their total Focus in stops.

Bless, Curse, Bank Loan, and Retainer cards do not require their retention roll
during the first Upkeep after acquisition. "Start of turn" and "start of
Upkeep" refresh effects occur in the refresh step; other such effects occur in
the perform-actions step. (Core rulebook, PDF p. 6; FAQ, PDF p. 2)

### Movement

The movement branch depends on current position and status.

#### Arkham movement

- Receive movement points equal to current Speed.
- Spend 1 movement point per connected yellow line.
- A move may connect location to street, street to street, or street to
  location.
- Before leaving an area with monsters, fight or evade each monster there.
- On ending movement in an area with monsters, fight or evade each monster
  there.
- Once combat starts for any reason, all remaining movement is lost.
- After all required monsters are handled, an investigator ending movement in
  a location or street area may take any or all Clue tokens there. Passing
  through does not collect them.

Sources: core rulebook, PDF pp. 6, 8, 14; FAQ, PDF pp. 4, 11.

#### Other World movement

Other Worlds have first/left and second/right areas. Investigators there do not
receive movement points.

- From the first area, move to the second area.
- From the second area, return to a location with an open gate matching that
  Other World and gain an explored marker.
- If there is no matching open gate, become Lost in Time and Space.

An explored marker remains only while the investigator stays at that gate's
area. (Core rulebook, PDF p. 8)

#### Delayed movement

A delayed investigator's Movement consists of standing the marker up. The
investigator cannot move, spend movement points, use a replacement for normal
movement, or cast a Movement spell. Trading is still allowed, and after
standing the marker the investigator must still deal with monsters in the
area. Delay is binary and cannot stack. (Core rulebook, PDF pp. 8, 16; FAQ,
PDF p. 5)

#### Returning through a gate

On the turn an investigator returns to Arkham from an Other World during
Movement, they do not have to fight or evade monsters at the return gate, but
may choose to engage any number of them. This protection lasts only for that
Movement phase. (Core rulebook, PDF p. 18; FAQ, PDF p. 11)

### Arkham Encounters

Only investigators in locations take this phase's normal action. Investigators
in streets or Other Worlds do not draw a normal location encounter.

#### No open gate

Choose one legal branch:

- use the location's printed special ability if its requirements can actually
  be met; or
- shuffle the matching neighborhood deck, draw a card, and resolve the entry
  for the current location.

A location ability is not an encounter and is normally usable only once per
investigator per turn. A sealed location is stable; gates and monsters cannot
appear there unless a rule such as a gate burst specifically overrides the
seal. (Core rulebook, PDF pp. 8, 22; FAQ, PDF pp. 2, 8)

#### Open gate

- Without an explored marker, the investigator is drawn into the first area of
  the gate's Other World.
- With an explored marker, the investigator may attempt to close the gate or
  use an Elder Sign.

If an encounter causes a gate to open on an investigator, the gate is resolved
first, the investigator is drawn through and delayed, and any instructed
monster then appears. (Core rulebook, PDF p. 9; FAQ, PDF p. 9)

### Other World Encounters

For each investigator in an Other World:

1. Draw Gate cards until a card color matches an encounter symbol of that
   Other World. Put nonmatching cards face down on the bottom of the deck.
2. Resolve the named Other World entry; if absent, resolve "Other."
3. Put the resolved card face down on the bottom of the deck.

A monster that appears by itself during an encounter does not remain on the
board. If defeated, it can be taken as a trophy unless its rules say otherwise;
if not defeated, return it to the cup. "A gate and a monster appear" is
different: both remain. (Core rulebook, PDF pp. 9, 22)

### Mythos

The first player draws one Mythos card and resolves these steps in order:

1. Open Gate and Spawn Monster.
2. Place Clue Token.
3. Move Monsters.
4. Activate Mythos Ability.

Only after all four steps and any resulting triggered effects are complete is
the first-player marker passed. (Core rulebook, PDF pp. 9-12)

#### 1. Open Gate and Spawn Monster

Evaluate the shown gate location.

**Elder sign present:** nothing opens and no monster appears, unless an enabled
rule such as gate burst overrides the seal.

**Open gate present:** resolve a monster surge.

- Draw `max(open gate count, actual investigator count)` monsters.
- Distribute them as evenly as possible among all open gates.
- No gate may receive more newly placed monsters than the surging gate.
- If the monster limit forces some monsters to the Outskirts, decide the legal
  placement distribution before drawing. Players decide; first player breaks a
  disagreement.

**Neither gate nor elder sign present:** resolve in order.

1. Add one doom. If this fills the track, awaken immediately and stop the
   Mythos phase.
2. Place a random gate marker face up and discard Clues at that location.
3. Any investigator at the location is immediately drawn to the first area of
   the Other World and delayed.
4. Draw and place one monster, or two with five or more investigators. Apply
   the monster limit and Outskirts rules.

Check all awakening conditions caused by the operation. Monsters are never
drawn through gates. (Core rulebook, PDF pp. 9-10; FAQ, PDF pp. 2-3)

#### 2. Place Clue Token

Place the indicated Clue unless an open gate occupies that area. If one or more
investigators are there, one may immediately take it. The players choose; the
first player breaks a disagreement. An explored marker does not allow a Clue
to appear through an open gate. (Core rulebook, PDF p. 10; FAQ, PDF p. 10)

#### 3. Move Monsters

For each dimensional symbol in a white box, matching monsters follow white
arrows. For each symbol in a black box, matching monsters follow black arrows.
A black/white arrow counts as both colors.

- A monster already sharing an area with an investigator normally stays.
- A moving monster stops on entering an investigator's area.
- Normal, stationary, fast, unique, and flying movement remain distinct.
- Stationary monsters do not move.
- Fast monsters take two steps but stop on reaching an investigator.
- Unique monsters follow their marker text.
- Flying monsters follow the Sky rules below.

Sources: core rulebook, PDF pp. 10-11.

#### Flying and the Sky

- A flying monster moves only when its symbol is activated, except when a gate
  burst rule moves all flying monsters.
- It stays if it already shares an area with an investigator.
- From a location or street with no investigator, it moves to a connected
  street containing an investigator; choose lowest Sneak, then first player on
  a tie. If none exists, it moves to the Sky.
- From the Sky, it moves to a street containing the investigator with the
  lowest Sneak; first player breaks ties. With no investigator in any street,
  it remains in the Sky.
- The Sky counts as Arkham for the monster limit.

Sources: core rulebook, PDF p. 11; FAQ, PDF p. 12.

#### 4. Activate Mythos Ability

- Headline: resolve immediately, then discard to the bottom.
- Environment: put in play and discard the previous Environment. Only one may
  be active.
- Rumor: keep in play until pass or fail. Only one may be active. If another
  Rumor is drawn, resolve its gate, Clue, and movement steps, ignore its special
  text, and discard it.
- Activity and closed markers remain tied to their source effect and are
  removed when that effect leaves play.

Sources: core rulebook, PDF p. 12.

## Skill checks

A check supplies:

- a base skill;
- a modifier to the number of dice;
- a difficulty, defaulting to 1.

Roll `skill + modifiers` dice. A natural 5 or 6 is one success, modified by
Bless or Curse. Meet or exceed the difficulty to pass. Zero or fewer dice
automatically fails unless bonus dice are added.

Clue tokens are spent one at a time after the roll. Each normally adds one die,
even when the initial pool was zero or less. A player may continue spending
after seeing each added die. A reroll rerolls all dice rolled for that check so
far, including prior Clue dice. Success cannot be ignored and a check cannot be
failed voluntarily. (Core rulebook, PDF p. 13; FAQ, PDF p. 14)

Special checks inherit bonuses to their base skill, but a bonus only to the
special check does not apply to ordinary checks:

| Check  | Base skill |
| ------ | ---------- |
| Evade  | Sneak      |
| Horror | Will       |
| Combat | Fight      |
| Spell  | Lore       |

Blessed investigators succeed on 4-6. Cursed investigators succeed only on 6.
An investigator cannot be both; gaining one discards the other. (Core rulebook,
PDF p. 17)

## Monster combat

Combat with one monster follows this loop:

1. Make one Horror check for that battle. On failure, lose the monster's Horror
   damage. Nightmarish and other abilities may modify this.
2. Choose flee or fight.
3. Flee: make an Evade check. Failure deals combat damage and returns to step
   2 if the investigator remains able to continue.
4. Fight: make a Fight-based Combat check using the monster's combat modifier
   and toughness as difficulty.
5. On a pass, defeat the monster and take it as a trophy unless Endless, Spawn,
   or another rule prevents this.
6. On a failure, take the full combat damage. Partial successes do not persist
   against an ordinary monster.
7. Continue at fight-or-flee until the battle ends.

If an investigator failed an Evade check before combat began, the monster deals
combat damage immediately and then the normal combat begins with its Horror
check. (Core rulebook, PDF pp. 14-15)

### Weapons, spells, and hands

- An investigator normally has two hands.
- Used weapons and combat spells cannot require more hands in total than are
  available.
- A bonus lasts only while the required hands remain committed.
- Weapons grant their printed Physical or Magical bonuses without a cast
  check.
- To cast a spell, first pay its Sanity cost, then make its Lore-based Spell
  check. The cost is paid even on failure.
- A failed combat spell attempt still occupies its hands for that combat round.
- Resistance halves the relevant bonus, rounded up. Immunity reduces the
  relevant bonus to zero. Neither removes unrelated secondary effects.

Sources: core rulebook, PDF pp. 16, 24; FAQ, PDF pp. 7-8, 11-12.

## Investigator status

Current Sanity and Stamina cannot normally exceed their current maxima.

### Zero Sanity or Stamina in Arkham

At zero Sanity, become insane and go to Arkham Asylum. At zero Stamina, become
unconscious and go to St. Mary's Hospital.

In either case:

- discard half of all items, rounded down;
- discard half of all Clues, rounded down;
- discard all Retainers;
- restore the depleted value to 1;
- take no further encounters this turn.

Items for this calculation include Common Items, Unique Items, Spells, the
Patrol Wagon, Deputy's Revolver, Exhibit Items, and Rail Passes. (Core
rulebook, PDF p. 16; FAQ, PDF p. 6)

### Zero Sanity or Stamina in an Other World

Apply the same losses, restore both values to at least 1, then become delayed in
Lost in Time and Space. (Core rulebook, PDF p. 16)

### Devoured

An investigator is devoured if:

- current Sanity and current Stamina reach zero simultaneously;
- maximum Sanity reaches zero;
- maximum Stamina reaches zero; or
- a component effect says so.

Outside final battle, discard cards except unspent trophies and begin a new
random investigator at the start of the next turn. During final battle, the
player is eliminated and does not receive a replacement. (Core rulebook, PDF
pp. 17, 22; FAQ, PDF p. 14)

### Lost in Time and Space

Move to Lost in Time and Space and become delayed. The next Movement phase
only stands the marker. At the start of the following Upkeep, return to a legal
location or street area in Arkham, subject to expansion restrictions. (Core
rulebook, PDF p. 17)

### Arrested

In Arkham, move to the Jail Cell, lose half of Money rounded down, and become
delayed. On the next turn, skip all investigator phases and stand in the main
Police Station area during Movement. (Core rulebook, PDF p. 16)

## Closing and sealing gates

An investigator with an explored marker at an open gate may act during Arkham
Encounters:

1. Choose a Fight or Lore check.
2. Apply the gate marker's modifier.
3. On failure, the gate stays open and may be retried in a later Arkham
   Encounters phase while the investigator remains there.
4. On success, close the gate and take it as a trophy.
5. Immediately after a successful close, optionally spend 5 Clues to place an
   elder sign at that unstable location.

When a gate closes or seals, return all monsters with its dimensional symbol
from Arkham, the Sky, and the Outskirts to the cup. Expansion rules may add
symbols or exceptions. (Core rulebook, PDF pp. 17-18)

### Elder Sign item

At an explored gate:

1. No Fight/Lore close check and no Clue payment are required.
2. Lose 1 Sanity and 1 Stamina; the seal still completes if this causes insanity
   or unconsciousness.
3. Remove one doom from the Ancient One's track, flip it, and place it as the
   elder sign.
4. Return the Elder Sign card to the box.
5. Take the gate as a trophy and clear matching-symbol monsters.

Sources: core rulebook, PDF p. 18.

An effect that merely states that a gate closes sends the marker to the bottom
of the gate stack, awards no trophy, and cannot be upgraded into a seal. Gates
in streets or stable locations may close but may not be sealed. (FAQ, PDF p. 3)

## Limits and tracks

### Monster limit and Outskirts

For a base game:

`monster limit = investigator count + 3`

Count monsters in Arkham locations, Arkham streets, and the Sky. Do not count
the Outskirts, encounter-only monsters, expansion-board monsters, or Spawn
monsters.

If adding a monster would exceed the limit, place that monster in the
Outskirts. Outskirts capacity is:

| Investigators | Maximum before overflow |
| ------------: | ----------------------: |
|             1 |                       7 |
|             2 |                       6 |
|             3 |                       5 |
|             4 |                       4 |
|             5 |                       3 |
|             6 |                       2 |
|             7 |                       1 |
|             8 |                       0 |

Equivalently, `Outskirts maximum = 8 - investigator count`.

When placement makes the Outskirts exceed its maximum, return all Outskirts
monsters to the cup and raise terror by 1. Continue processing any remaining
monsters after that resolution. (Core rulebook, PDF p. 18; FAQ, PDF p. 12)

### Terror

Terror never decreases and cannot exceed 10.

Whenever terror rises:

- return one random available Ally from the Ally deck to the box per point;
- at 3, permanently close the General Store and move occupants to Rivertown
  street;
- at 6, permanently close the Curiositie Shoppe and move occupants to
  Northside street;
- at 9, permanently close Ye Olde Magick Shoppe and move occupants to Uptown
  street;
- at 10, remove the monster limit for the rest of the game and return all
  monsters in the Outskirts to the cup;
- for each attempted increase while already at 10, add one doom instead.

Sources: core rulebook, PDF p. 20; FAQ, PDF p. 3.

## Victory, awakening, and final battle

### Immediate victories

Investigators win immediately when any one condition is met:

- the last open gate is closed and the investigators collectively hold at least
  as many unspent gate trophies as the actual investigator count;
- six elder signs are on the board; or
- the Ancient One is defeated in final battle.

Sources: core rulebook, PDF p. 12.

### Awakening conditions

The Ancient One awakens immediately when:

- the doom track fills;
- the open-gate threshold is reached;
- a gate must open but no unused gate marker exists;
- a monster must be drawn from the normal cup but it is empty; or
- terror is 10 and the count of monsters in Arkham plus the Sky reaches twice
  the normal monster limit.

| Investigators | Awakens at open gates |
| ------------: | --------------------: |
|           1-2 |                     8 |
|           3-4 |                     7 |
|           5-6 |                     6 |
|           7-8 |                     5 |

For the terror-10 condition, do not count expansion-board monsters. If awakening
occurs with an incomplete doom track, fill it before final battle. (Core
rulebook, PDF p. 20; FAQ, PDF p. 3)

### Final battle

Before battle:

- investigators in Lost in Time and Space are devoured;
- discard active Environment and Rumor cards;
- stop gaining Clues and Money and stop Bank Loan/Retainer rolls;
- fill doom if awakening did not fill it.

Each round:

1. Investigator Refresh: refresh cards, use legal abilities, adjust sliders as
   in Upkeep, pass first player left, and trade as if together.
2. Investigator Attacks: each survivor makes one Combat check. Accumulate
   successes across investigators and rounds. For each group equal to the
   original number of investigators, remove one doom; carry excess successes
   forward.
3. Ancient One Attacks: resolve the sheet's attack against each survivor.
   Zero Sanity or Stamina devours the investigator.

Removing the last doom wins. Devouring every investigator loses. Eliminated
investigators still count toward successes needed per doom. (Core rulebook,
PDF pp. 19, 22; FAQ, PDF pp. 12-13)
