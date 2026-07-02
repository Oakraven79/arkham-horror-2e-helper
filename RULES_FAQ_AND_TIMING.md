# FAQ Corrections and Timing

This file collects official FAQ rulings that are easy to lose when converting
the board game into software. The FAQ overrides older wording in a rulebook.

## Timing doctrine

### Simultaneous effects

If two or more effects occur simultaneously, the players choose their order.
If they cannot agree, the first player decides. Do not hard-code an arbitrary
order unless a later source defines one. (Core rulebook, PDF p. 23)

### Actions during a phase

An action may normally be used at any point in its listed phase when its
conditions are met. Once an encounter card is drawn, finish resolving that
encounter before taking more actions. Prevention or response effects such as
Flesh Ward and Premonition are explicit exceptions. (FAQ, PDF p. 14)

This means an app should distinguish:

- before an encounter is drawn;
- while an encounter is resolving;
- a legal prevention/response window; and
- after the encounter is complete.

### "Your turn ends"

The investigator takes no further action for the rest of that game turn, but
the Mythos phase still occurs. (FAQ, PDF p. 14)

### Start of turn and start of Upkeep

An effect concerning whether a card refreshes resolves during Refresh Exhausted
Cards. Other start-of-turn or start-of-Upkeep effects resolve during Perform
Upkeep Actions. (FAQ, PDF p. 2)

## Counts and ownership

When there are more investigators than human players, references to player
count mean investigator count. First-player decisions still belong to the
first player. (FAQ, PDF p. 2)

The multi-expansion-board handicap is not a universal player count. It applies
only to monster limit, Outskirts maximum, open-gate awakening number, and the
number of monsters placed when a new gate opens. See
`RULES_EXPANSIONS.md`. (FAQ, PDF pp. 29, 36)

## Clue timing

An investigator gains a board Clue only:

1. after ending Movement at its location or street and resolving every required
   monster there; or
2. immediately when Mythos places it in the investigator's area.

Do not collect a board Clue merely because an effect moved the investigator
during Upkeep, Arkham Encounters, or Other World Encounters. Do not place a
Mythos Clue where an open gate exists, even when an investigator there has an
explored marker. (FAQ, PDF pp. 4, 10, 14)

If the general Clue supply is empty, use substitute tokens or another tracking
method. The supply is not a cap. (FAQ, PDF p. 14)

## Monster engagement timing

Board monsters must be handled:

- during Movement before leaving their area;
- during Movement after ending in their area, including after standing from
  delayed; or
- when an encounter says a monster appears.

An effect moving an investigator to another board area during an encounter does
not itself cause engagement with board monsters there. A redirected Arkham
encounter ignores monsters and Clues at the destination, then resolves the
normal Gate or No Gate branch. (FAQ, PDF pp. 4, 8)

On returning from an Other World during Movement, an investigator may engage
any number of monsters at the return area but is not required to engage them.
If the return happened in another phase, wait for Movement. (FAQ, PDF p. 11)

When several monsters appear from one encounter, draw them together and let the
investigator choose their order. (FAQ, PDF p. 11)

## Delayed versus losing a turn

Delayed is a binary status.

- In the next Movement phase, stand the marker.
- The investigator may trade.
- The investigator cannot move, receive/spend movement points, use replacement
  movement, or cast Movement spells.
- After standing, the investigator must still handle monsters in the area.
- A delay gained during Movement cannot be cleared until the next turn's
  Movement.

"Lose your next turn" skips all of that investigator's phases except Mythos.
"Stay here next turn" means delayed rather than lose a turn. (FAQ, PDF pp. 5, 13)

## Trading

Investigators may trade during Movement whenever they share a location, street
area, or Other World area, except during combat. They may trade before, during,
or after movement, and trading does not end movement. Delayed investigators and
investigators who lost their turn may still trade. Final battle permits trading
during Investigator Refresh. (FAQ, PDF pp. 4-5)

Tradable:

- Common Items;
- Unique Items;
- Spells;
- Patrol Wagon;
- Deputy's Revolver;
- Exhibit Items;
- Rail Passes; and
- Money.

Not tradable unless specific text says otherwise:

- Clues;
- Allies;
- Skills;
- Retainers;
- Deputy status;
- Bank Loans;
- Bless/Curse;
- Injury/Madness;
- White Ship or Great Seal;
- monster or gate trophies; and
- other unlisted cards.

## Loss, cost, discard, and sacrifice

- An ability reducing Sanity or Stamina loss does not reduce a spell cost or
  another cost.
- "Sacrifice" is synonymous with cost.
- Discarding a card to pay a cost does not also trigger that card's optional
  benefit for being discarded.
- A requirement to give or spend all of a resource is not met when the
  investigator has zero of it.
- A spell's Sanity cost may reduce current Sanity to zero, but cannot be paid
  if current Sanity is below the cost. Resolve the Spell check/effect, then
  resolve insanity.

Sources: FAQ, PDF pp. 5-7, 14.

## Checks and rerolls

- A player cannot voluntarily fail a check or ignore rolled successes.
- Spend Clues one at a time after the initial roll.
- A reroll rerolls every die rolled for the check so far, including Clue dice
  already added.
- A modifier changes the dice pool, not die faces.
- Difficulty is required successes and defaults to 1.
- A "difficulty increases by 1" usually means one additional success, not one
  additional Clue or another resource, unless specific text says so.

Sources: core rulebook, PDF p. 13; FAQ, PDF pp. 12, 14.

## Encounters and movement

### Redirected encounters

When a location encounter sends an investigator elsewhere for another
encounter:

- ignore board monsters and Clues at the destination;
- resolve its normal Gate or No Gate encounter branch;
- fully resolve nested encounters;
- return if the original instruction says to return; and
- if nested and original instructions conflict, the original encounter wins.

Sources: FAQ, PDF pp. 8-9.

### Gate and monster appear

Resolve the gate first:

1. add doom;
2. open the gate;
3. draw through and delay investigators at that location;
4. then make the monster appear.

Both gate and monster remain on the board. The monster counts against the
limit and can go to the Outskirts. A monster appearing without a gate is
encounter-only and returns to the cup unless defeated for a trophy. (FAQ, PDF
pp. 4, 9)

### Temporary location closure

Immediately move all investigators and monsters at a newly closed location to
its street. If a gate exists at a closed location, the gate replaces the
location while open. Put the gate over the closed marker; when the gate later
closes, move occupants to the street. (FAQ, PDF pp. 8-9)

### Location special abilities

- They replace the normal location encounter.
- They are not encounters.
- Requirements must be payable; a player cannot select an ability that does
  nothing.
- Unless another effect says otherwise, each investigator triggers a location
  special ability at most once per turn.
- Shopping requires purchasing one of the drawn cards if the investigator can
  afford one, and only one may be purchased.

Source: FAQ, PDF p. 8.

## Explored markers and gates

Gain an explored marker whenever moving directly from either Other World area
to a matching open gate in Arkham, including:

- normal return from the second area;
- an encounter return from the first area; and
- Find Gate.

Do not gain one after becoming Lost in Time and Space or after an effect merely
sends the investigator to an Arkham location without saying return. Being
delayed survives the return. (FAQ, PDF pp. 9-10)

When a gate closes:

- a normal investigator close awards the trophy and may be followed by a seal;
- an effect merely saying the gate closes awards no trophy, places the marker
  on the bottom of the stack, and permits no seal;
- all matching-symbol monsters in Arkham, Sky, and Outskirts return to the cup;
- a gate in a stable location or street may close but cannot seal.

Sources: FAQ, PDF pp. 3, 9.

## Mythos timing

### Drawing a Mythos card for information

A card drawn outside normal full Mythos resolution has no effects beyond the
specific information requested and is discarded. Abilities triggered by
"drawing a Mythos card" apply before any part of a card being fully resolved,
but not when the card is drawn only for ancillary information. Named expansion
rules can override this, such as Miskatonic Act timing for cards drawn during
the Mythos phase. (FAQ, PDF p. 10)

### Environment scope and precedence

An effect without "in Arkham" also affects Other Worlds. An effect explicitly
limited to Arkham does not. When an Environment directly conflicts with
another game effect, the FAQ says the Environment takes precedence. (FAQ, PDF
p. 10)

### Monster surge

The surge occurs in Open Gate and Spawn Monster, not Activate Mythos Ability.
Choose the legal placement distribution before drawing if the limit will be
exceeded. On special multi-surge cards, the first player chooses the primary
surging gate when instructed. (Core rulebook, PDF p. 9; FAQ, PDF pp. 3, 39)

### Gate burst

All flying monsters move on a gate-burst card even when the burst is prevented.
A burst at an already open gate is a surge. A burst prevented by Kate
Winthrop leaves the seal. (FAQ, PDF pp. 32, 35, 39-40, 42)

## Monster-limit timing

The monster limit is a maximum, not a trigger at equality. A monster that would
make the count exceed the maximum is placed in Outskirts.

Outskirts overflow resolves as soon as a placement exceeds its maximum:

1. raise terror by 1;
2. return every Outskirts monster to the cup;
3. then continue any remaining monster draws/placements.

At terror 10, return existing Outskirts monsters to the cup and permanently
remove the Arkham monster limit. (FAQ, PDF pp. 3, 12)

## Monster rules that often drift

- Encounter-only monsters return to the cup if not defeated.
- Spawn monsters never count against the limit, enter Outskirts, become
  trophies, or return to the cup through a generic "return monsters" effect.
- Physical/Magical Resistance or Immunity changes only the relevant combat
  bonus, not a weapon/spell's secondary effect.
- A flying monster moves to the Sky only through its movement rule, and the Sky
  counts against the monster limit.
- A monster moving from an expansion board into the Sky is moved to Outskirts
  if the Arkham limit is already full.

Sources: core rulebook, PDF pp. 11, 22, 24; FAQ, PDF pp. 12, 28.

## Final battle corrections

- Discard active Environment and Rumor cards before battle.
- Investigators stop gaining Clues and Money and stop Bank Loan/Retainer rolls.
- They receive a full Upkeep-like Investigator Refresh each round.
- They are considered together for trading and applicable abilities.
- Successes persist across investigators and rounds. Remove one doom for each
  full group equal to the original investigator count and carry any remainder.
- An investigator devoured during final battle is not replaced and still
  counts toward successes needed per doom.
- If an investigator's action both devours that investigator and awakens the
  Ancient One, that player gets no replacement for battle.

Sources: FAQ, PDF pp. 4, 12-14.

## Official errata with systemic impact

- Setup: redraw both Rumors and no-gate Mythos cards for the initial Mythos.
- At terror 10, return Outskirts monsters to the cup.
- Stable means printed green diamond or any location with an elder sign.
- Gate-burst flyers move even if the burst itself is prevented.
- Multi-board modified count has only the four uses listed above.
- Miskatonic player reference "Open Gate Limit" is the count at which the
  threshold is exceeded and awakening happens; monster and Outskirts limits are
  legal maxima.

Sources: FAQ, PDF pp. 2-3, 12, 29, 36, 42.
