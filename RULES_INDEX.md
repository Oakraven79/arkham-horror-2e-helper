# Arkham Horror 2e Rules Index

This is the navigation and source-authority file for agents working on the
helper. Page citations refer to the one-based PDF page displayed by a PDF
viewer, not necessarily the number printed in the page artwork.

## Reading map

| Change touches                                                            | Read                      |
| ------------------------------------------------------------------------- | ------------------------- |
| Turn and phase flow, checks, movement, encounters, combat, gates, victory | `RULES_CORE.md`           |
| Expansion boards, gate bursts, rifts, vortices, special decks, variants   | `RULES_EXPANSIONS.md`     |
| Timing, errata, edge cases, loss vs. cost, trading, redirected encounters | `RULES_FAQ_AND_TIMING.md` |
| State design, derived values, legal transitions, ordering                 | `RULES_INVARIANTS.md`     |
| Tests and acceptance scenarios                                            | `RULES_TEST_MATRIX.md`    |

## Interpretation policy

For a specific situation, apply:

1. Official FAQ errata or clarification for the named component or situation.
2. Specific active component text.
3. Enabled expansion rulebook.
4. Revised base rulebook.
5. These Markdown references.
6. The unofficial v7.6 player aid.

Rules from an expansion apply only when that expansion, its component set, or
its named optional variant is enabled. Miskatonic Horror is mainly an overlay:
most of its components require another expansion icon or named variant.

## Source inventory

The hashes pin the exact files used for this synthesis. If a source hash
changes, re-check every reference derived from that file.

| Source                                        | PDF pages | Role                                        | SHA-256                                                            |
| --------------------------------------------- | --------: | ------------------------------------------- | ------------------------------------------------------------------ |
| `rulebooks/arkham_horror_core_rulebook.pdf`   |        24 | Revised base rules                          | `97bd20dd2dca5fe7c07206fe25966937b453cd54404749712f3ed5aff2c6f9e5` |
| `rulebooks/complete_arkham_horror_faq.pdf`    |        43 | Official FAQ, errata, and later corrections | `0c7a5fea0f4aa77f7d7594c8ba34280c4a5551083649830bcbe8eb715594d4a8` |
| `rulebooks/dunwich_horror_rules.pdf`          |        12 | Dunwich board and systems                   | `e644e83482c5f2f83e11b70467a8fbe6fdf80ce7548d4661e5b3c47ead17457d` |
| `rulebooks/kingsport_horror_rules.pdf`        |        16 | Kingsport board, rifts, and variants        | `4d6d61c6d856e0680bc62eb22df82a8e5233b0e6afec2c062e0c483bd5ace705` |
| `rulebooks/innsmouth_horror_rules.pdf`        |        16 | Innsmouth board and systems                 | `41c5bd536531a6db93c64d9fc3fcf2f4439ccc445c64374286bb98e338d9a39b` |
| `rulebooks/curse_dark_pharoah_rules.pdf`      |         2 | Revised Dark Pharaoh expansion              | `f2b2573538e8ffe16a36d9a1eb2c5ee923f3e4d27d2b97130c9821fab04e6ed4` |
| `rulebooks/king_in_yellow_rules.pdf`          |         2 | King in Yellow expansion                    | `c9053dc970b91b16d1790d32e9cbc2c964f6c7fa1d25ef20bb672e125d468b6e` |
| `rulebooks/black_goat_rules.pdf`              |         2 | Black Goat expansion                        | `76c06e5c89692ca429fd581f3c55359cea407fef8d3ce6d7cab1dd27fdd76bf6` |
| `rulebooks/lurker_at_the_threshold_rules.pdf` |         2 | Lurker expansion                            | `e525774f572761a312b8908a49fdf5f2723226a58d4aea97b96e93e5fbb246e7` |
| `rulebooks/miskatonic_horror_rules.pdf`       |         4 | Overlay content and Institutions            | `6ff2978dd7d1733c1ab29d09830dc97a04bf8a5f4328fa7ba3c17ceaf45de43d` |
| `rulebooks/ArkhamHorror_v7.6.pdf`             |        20 | Unofficial quick reference only             | `150c6c7c068f1c5cc504a3c8811b5fc4b865bc63402db4f5a77d974b63d8b6fc` |

The unofficial file identifies itself as an Esoteric Order of Gamers player
aid and includes house rules on its final page. Do not implement its house
rules unless the product explicitly offers a house-rule option.

## Expansion and variant switches

Treat these as independent feature flags unless a dependency is shown.

| Module                            | Core systems enabled by module                                                                              | Optional submodule                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Dunwich Horror                    | Dunwich board, vortices, Dunwich Horror, Injury/Madness, Tasks/Missions, stalker movement, gate bursts      | None required                                                       |
| Kingsport Horror                  | Kingsport board, rifts, aquatic movement, elusive monsters, gate bursts                                     | Herald/Guardian; Epic Battle                                        |
| Innsmouth Horror                  | Innsmouth board, martial law, Deep Ones Rising, federal raid, Innsmouth Look, aquatic movement, gate bursts | Herald; Personal Stories                                            |
| Curse of the Dark Pharaoh Revised | Ancient Whispers, Exhibit Encounters/Items, Benefits/Detriments, patrols                                    | Dark Pharaoh Herald                                                 |
| The King in Yellow                | Act deck and Magical Effects                                                                                | Touring or Permanent setup style; King in Yellow Herald and Blights |
| The Black Goat of the Woods       | Cult Memberships/Encounters, Corruption, gate bursts                                                        | Black Goat Herald; Difficulty card                                  |
| The Lurker at the Threshold       | Relationships, replacement special gate markers, gate bursts                                                | Lurker Herald, Dark Pacts, Reckonings, Power                        |
| Miskatonic Horror                 | Compatible overlay cards selected by expansion icons, player reference sheets                               | Dunwich Herald; Institutions; additions to other variants           |

## Terms that must stay distinct

- Player and investigator: most counts use investigators if a player controls
  more than one investigator. The sources often say "player" under the default
  assumption of one investigator per player. (FAQ, PDF p. 2)
- Actual investigator count and modified board count: the multi-board handicap
  changes only four listed calculations. It is not a universal replacement for
  investigator count. (FAQ, PDF pp. 29, 36)
- Location and area: a location is normally a circular location space. Street
  areas and Other World areas are distinct, although some component abilities
  use "location" more broadly. (FAQ, PDF p. 2)
- Loss, cost, and sacrifice: prevention of loss does not prevent a cost;
  sacrifice is treated as a cost. (FAQ, PDF pp. 5, 14)
- Delayed and lose next turn: delayed changes Movement; losing a turn skips the
  investigator's phases except Mythos. (FAQ, PDF pp. 5, 13)
- Appears, moves, and is drawn through: these are different events and trigger
  different abilities.
- Close and seal: closing may award a trophy and may permit sealing; effects
  that merely say a gate closes normally award no trophy and cannot be turned
  into a seal. (FAQ, PDF p. 3)
- Monster limit and Outskirts capacity: reaching the maximum is legal;
  exceeding it triggers placement or terror resolution.
- Open gate awakening number: this is the count at which the Ancient One
  awakens, unlike monster and Outskirts limits, which are maxima before they
  are exceeded. (FAQ, PDF p. 42)

## Coverage boundary

These files preserve system behavior and recurring interactions. Named card
text remains source data. Before implementing a named card or sheet:

1. inspect the physical/digital component text;
2. search the official FAQ for its name;
3. model its scope and timing explicitly;
4. add a focused test without generalizing its exception.
