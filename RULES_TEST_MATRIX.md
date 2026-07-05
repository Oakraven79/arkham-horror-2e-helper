# Rules Regression Test Matrix

These scenarios are framework-neutral acceptance tests. Use the relevant subset
for each rules-facing change. Cite the scenario ID in test names where useful.

## Core turn and checks

| ID      | Given                                             | When                             | Then                                                           |
| ------- | ------------------------------------------------- | -------------------------------- | -------------------------------------------------------------- |
| CORE-01 | A normal turn                                     | All investigators finish a phase | Advance to the next phase; pass first player only after Mythos |
| CORE-02 | Focus 2 and three skill sliders                   | Upkeep adjustment is committed   | Total slider movement is at most two stops                     |
| CORE-03 | A check has pool 0                                | No Clue is spent                 | The check fails automatically                                  |
| CORE-04 | A check has pool 0 and investigator spends a Clue | The bonus die succeeds           | The success counts and may pass the check                      |
| CORE-05 | A check includes initial and Clue dice            | A legal reroll is used           | Reroll all dice rolled so far                                  |
| CORE-06 | A check naturally succeeds                        | Player tries to choose failure   | Reject the voluntary failure                                   |

## Setup and optional mobile controllers

| ID        | Given                                                    | When                             | Then                                                                      |
| --------- | -------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------- |
| SETUP-01  | Opening Mythos draws a Rumor                             | Resolve Game Setup               | Discard it and draw again                                                 |
| SETUP-02  | Opening Mythos draws a non-Rumor without a gate location | Resolve Game Setup               | Discard it and draw again                                                 |
| SETUP-03  | Opening Mythos draws an Environment depicting a gate     | Resolve Game Setup               | Fully resolve the card and leave the Environment in play                  |
| SETUP-04  | Setup has no selected Ancient One                        | Advance to Opening Mythos        | Reject the transition; an Ancient One is mandatory before the game starts |
| SETUP-05  | The game has advanced to Opening Mythos                  | Previous phase is requested      | Stay in Opening Mythos; Setup is no longer reachable                      |
| SETUP-06  | A setup field or set checkbox changes                    | The control value changes        | Persist the setup change immediately without a separate apply/save button |
| MOBILE-01 | Mobile controls are disabled                             | The dashboard changes game state | Dashboard remains fully functional and authoritative                      |
| MOBILE-02 | A controller has the current revision                    | It submits a legal phase command | Apply once, log the actor, increment revision, and notify displays        |
| MOBILE-03 | A controller has an older revision                       | It submits any command           | Reject as stale without changing game state                               |
| MOBILE-04 | A controller repeats an idempotency key                  | The request is retried           | Return current state without applying the command twice                   |
| MOBILE-05 | A command belongs to another phase                       | A controller submits it manually | Reject it even if the mobile UI had previously displayed it               |
| MOBILE-06 | A controller room is disabled or expires                 | A phone reconnects or submits    | Reject access without changing or pausing the underlying game             |
| MOBILE-07 | A revealed Mythos Headline or Special is stored by ID    | The controller refreshes         | Show and accept Discard after resolving                                   |
| MOBILE-08 | An expansion board track is enabled                      | A controller submits a track event or correction | Apply the same dashboard expansion-track action and record the actor |

## Fixture Data Integrity

| ID      | Given                                     | When                                 | Then                                                                                |
| ------- | ----------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------- |
| DATA-01 | The bundled CMS game-data fixture changes | Validate or load the bundled fixture | Preserve portable relationship keys, required boxed-set gates, and registered media |

## Movement, encounters, and status

| ID           | Given                                                         | When                    | Then                                                                                 |
| ------------ | ------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| MOVE-01      | Investigator leaves an area with two monsters                 | Movement begins         | Require each monster to be fought or evaded in chosen order                          |
| MOVE-02      | Investigator fails one Evade                                  | Combat begins           | End movement even if combat is later won                                             |
| MOVE-03      | Investigator ends with monsters and Clues                     | End movement resolves   | Handle monsters before collecting Clues                                              |
| MOVE-04      | Investigator merely passes through a Clue area                | Movement continues      | Do not collect the Clue                                                              |
| MOVE-05      | Delayed investigator shares an area with a monster            | Movement phase occurs   | Stand up, allow trading, disallow movement, then require monster handling            |
| MOVE-06      | Investigator returns through a gate during Movement           | Monsters share the gate | Allow engaging any subset or none for that Movement                                  |
| MOVE-07      | Investigator returns from Other World first area by encounter | A matching gate exists  | Place explored marker                                                                |
| MOVE-08      | Investigator becomes Lost in Time and Space in an Other World | Later returns to Arkham | Do not grant explored marker                                                         |
| ENCOUNTER-01 | Redirected encounter destination has monster, Clue, no gate   | Resolve destination     | Ignore board monster and Clue; draw normal location encounter                        |
| ENCOUNTER-02 | Redirected encounter destination has a gate                   | Resolve destination     | Ignore monster/Clue, then draw investigator through gate                             |
| ENCOUNTER-03 | Encounter says gate and monster appear                        | Resolve it              | Add doom, open gate, draw through/delay investigators, then place persistent monster |
| ENCOUNTER-04 | Encounter says only monster appears                           | Investigator evades     | Return monster to cup after encounter                                                |
| STATUS-01    | Current Sanity and Stamina hit zero simultaneously            | Resolve status          | Devour, do not choose insanity or unconsciousness                                    |
| STATUS-02    | Investigator has one item and becomes insane                  | Apply half rounded down | Lose zero items                                                                      |
| STATUS-03    | Investigator loses a turn                                     | Next turn occurs        | Skip investigator phases except Mythos; do not treat as delayed                      |

## Mythos, gates, and monsters

| ID         | Given                                                       | When                                | Then                                                                               |
| ---------- | ----------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| MYTHOS-01  | Empty unstable gate location                                | Mythos opens a gate                 | Add doom, place gate, remove Clues, draw through/delay investigator, spawn monster |
| MYTHOS-02  | Doom addition fills the track                               | Resolve new gate                    | Awaken immediately and stop remaining ordinary Mythos steps                        |
| MYTHOS-03  | Gate location is sealed                                     | Normal Mythos gate result           | Open no gate and spawn no monster                                                  |
| MYTHOS-04  | Gate location already has gate, 3 gates and 5 investigators | Surge                               | Draw 5 monsters                                                                    |
| MYTHOS-05  | Surge across 3 gates                                        | Distribution chosen                 | Counts differ by at most one and surging gate is not below another gate            |
| MYTHOS-06  | Surge exceeds monster limit                                 | Before monster identities are drawn | Require placement distribution choice first                                        |
| MYTHOS-07  | Clue location has open gate                                 | Place Clue step                     | Place no Clue                                                                      |
| MYTHOS-08  | Investigator occupies the Clue location                     | Place Clue step                     | Allow one investigator there to take it immediately                                |
| MYTHOS-09  | Existing Rumor active and a new Rumor is drawn              | Resolve card                        | Resolve gate/Clue/movement, ignore new special text, discard new Rumor             |
| MYTHOS-10  | Existing Environment active and new Environment resolves    | Activate ability                    | Discard old Environment and activate new one                                       |
| MONSTER-01 | Fast monster's first step reaches investigator              | Movement                            | Stop; do not take second step                                                      |
| MONSTER-02 | Flying monster in Sky and two street investigators          | Movement                            | Choose lowest Sneak; first player breaks tie                                       |
| MONSTER-03 | Monster moves from expansion board into a full Sky limit    | Movement                            | Put monster in Outskirts                                                           |
| GATE-01    | Explored investigator succeeds close                        | No sealing chosen                   | Award gate trophy and clear matching monsters in Arkham, Sky, Outskirts            |
| GATE-02    | Effect merely says gate closes                              | Resolve close                       | No trophy, no seal option, gate to bottom of stack                                 |
| GATE-03    | Gate is in stable location or street                        | Investigator closes it              | Permit close; reject seal                                                          |
| GATE-04    | Elder Sign is used                                          | Resolve it                          | No close roll or Clue cost; lose 1 Sanity/1 Stamina, remove one doom, seal         |

## Limits, terror, victory, and final battle

| ID        | Given                                                       | When                                      | Then                                                                 |
| --------- | ----------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| LIMIT-01  | 3 investigators and 6 Arkham/Sky monsters                   | Another monster appears                   | Put it in Outskirts                                                  |
| LIMIT-02  | 3 investigators and 5 Outskirts monsters                    | Another enters Outskirts                  | Raise terror, return all 6 to cup                                    |
| LIMIT-03  | Outskirts just overflowed during a multi-monster event      | More monsters remain                      | Continue remaining draws against the now-empty Outskirts             |
| TERROR-01 | Terror rises to 3                                           | Resolve milestone                         | Remove random Ally, close General Store, move occupants to Rivertown |
| TERROR-02 | Terror rises to 10                                          | Resolve milestone                         | Remove monster limit permanently and empty Outskirts                 |
| TERROR-03 | Terror is already 10                                        | It would rise by 2                        | Add 2 doom instead                                                   |
| WIN-01    | Last gate closes and held gate trophies equal investigators | Resolve close                             | Win immediately                                                      |
| WIN-02    | Last gate closes but trophies are too few                   | Resolve close                             | Do not win                                                           |
| WIN-03    | Sixth elder sign is placed                                  | Resolve seal                              | Win immediately                                                      |
| AWAKE-01  | 4 investigators and seventh gate opens                      | Check gates                               | Awaken                                                               |
| AWAKE-02  | Monster must be drawn from empty normal cup                 | Draw event                                | Awaken                                                               |
| AWAKE-03  | New gate must open with no marker available                 | Open event                                | Awaken                                                               |
| FINAL-01  | Four original investigators, one eliminated                 | Survivors score four cumulative successes | Remove one doom, not after three                                     |
| FINAL-02  | Cumulative successes exceed a full group                    | Remove doom                               | Carry remainder into later attacks/rounds                            |
| FINAL-03  | Investigator is devoured in final battle                    | Resolve devouring                         | Eliminate with no replacement                                        |

## Multiple expansion boards

| ID       | Given                                    | When                          | Then                                       |
| -------- | ---------------------------------------- | ----------------------------- | ------------------------------------------ |
| BOARD-01 | 6 investigators, Dunwich and Kingsport   | Derive E                      | E is 5                                     |
| BOARD-02 | 6 investigators and all three boards     | Derive E                      | E is 4                                     |
| BOARD-03 | 1 investigator and all three boards      | Derive E                      | E remains 1                                |
| BOARD-04 | I=6, E=5, two boards                     | New empty-location gate opens | Spawn two monsters                         |
| BOARD-05 | I=6, E=5, two boards, 3 open gates surge | Surge size                    | Draw six, using I rather than E            |
| BOARD-06 | I=6, E=5, two boards                     | Final battle successes        | Need six successes per doom                |
| BOARD-07 | I=6, E=5, two boards                     | Close-all-gates victory       | Need six gate trophies                     |
| BOARD-08 | Dunwich and Innsmouth enabled with E=4   | Check gate awakening          | Threshold is base 7 plus 1, so awaken at 8 |

## Dunwich

| ID     | Given                                                              | When                  | Then                                                                   |
| ------ | ------------------------------------------------------------------ | --------------------- | ---------------------------------------------------------------------- |
| DUN-01 | Monster enters Dunwich vortex                                      | Resolve entry         | Return to cup, terror +1, Dunwich track +1                             |
| DUN-02 | Third Dunwich token added                                          | Resolve track         | Place Dunwich Horror at Sentinel Hill                                  |
| DUN-03 | Dunwich Horror defeated                                            | Resolve defeat        | Empty track, set marker aside, allow one deck search reward            |
| DUN-04 | Stamina reaches zero                                               | Player chooses Injury | Keep items/Clues, restore max Stamina, move appropriately, draw Injury |
| DUN-05 | Investigator has two total Injury/Madness cards                    | Player retires        | Skip turn and replace without devoured triggers                        |
| DUN-06 | Stalker adjacent to lowest-Sneak investigator in unstable location | Movement              | Ignore arrows and move to that investigator                            |
| DUN-07 | Stalker adjacent only to investigator in stable location           | Movement              | Do not enter stable location; use normal arrow                         |

## Kingsport

| ID           | Given                                                                    | When                       | Then                                                     |
| ------------ | ------------------------------------------------------------------------ | -------------------------- | -------------------------------------------------------- |
| KINGSPORT-01 | Closed rift pattern matches and its pair has room                        | Resolve Mythos             | Add one random progress marker                           |
| KINGSPORT-02 | Fourth rift progress marker placed                                       | Resolve                    | Open rift at current Mythos gate location even if sealed |
| KINGSPORT-03 | Open rift was opened this Mythos                                         | Same Mythos symbol matches | Do not activate until next Mythos                        |
| KINGSPORT-04 | Open rift symbol activates but rift cannot move                          | Resolve                    | Spawn monster; add doom if colors match                  |
| KINGSPORT-05 | Rift moves over black/white arrow but Mythos box color differs from rift | Resolve                    | Do not add doom                                          |
| KINGSPORT-06 | True encounter at pictured progress location for open rift               | Investigate                | Turn one marker facedown                                 |
| KINGSPORT-07 | Location special ability at pictured progress location                   | Resolve ability            | Do not investigate the rift                              |
| KINGSPORT-08 | Fourth open-rift marker turns facedown                                   | Resolve                    | Close rift and recycle all four markers                  |
| KINGSPORT-09 | Elusive monster shares investigator's area                               | Investigator leaves        | No forced evade/combat                                   |
| KINGSPORT-10 | Investigator tries to attack Elusive and fails its Evade check           | Resolve                    | End movement without combat                              |

## Innsmouth

| ID     | Given                                         | When               | Then                                            |
| ------ | --------------------------------------------- | ------------------ | ----------------------------------------------- |
| INN-01 | Doom first reaches half full                  | Resolve            | Martial law begins permanently                  |
| INN-02 | Doom later falls below half                   | Check martial law  | Martial law remains                             |
| INN-03 | Martial law active at modified Innsmouth area | End Movement       | Make martial-law Evade before handling monsters |
| INN-04 | Gate opening is prevented by seal             | Resolve prevention | Add one uprising token                          |
| INN-05 | Monster enters Innsmouth vortex               | Resolve            | Return to cup, terror +1, uprising +1           |
| INN-06 | Sixth uprising token placed                   | Resolve            | Awaken immediately                              |
| INN-07 | Sixth correctly colored federal Clue placed   | Resolve            | Clear both federal and uprising tracks          |
| INN-08 | Returning through open gate under martial law | End movement       | Open gate overrides martial-law arrest check    |

## Small expansions and Miskatonic

| ID         | Given                                                | When                                          | Then                                                     |
| ---------- | ---------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| BURST-01   | Gate burst at a seal                                 | Resolve                                       | Remove seal, no burst doom, open gate, spawn monster     |
| BURST-02   | Gate burst at open gate                              | Resolve                                       | Monster surge                                            |
| BURST-03   | Gate burst prevented                                 | Monster movement                              | All flying monsters still move                           |
| PHARAOH-01 | First investigator resolves Exhibit Encounter        | Ancient Whispers moves to second investigator | No second Exhibit Encounter that turn                    |
| PHARAOH-02 | No Exhibit Encounter moved Ancient Whispers          | Mythos movement                               | Move as moon normal monster while ignoring investigators |
| PHARAOH-03 | Investigator leaves patrolled street and fails Sneak | Resolve                                       | Arrest                                                   |
| PHARAOH-04 | Terror rises                                         | Patrols exist                                 | Remove all Patrol markers                                |
| KIY-01     | Act III enters play                                  | Resolve                                       | Investigators lose immediately                           |
| KIY-02     | Blight name appears only as part of a place name     | Resolve encounter                             | Do not suppress encounter                                |
| GOAT-01    | Corruption symbol matches but box color differs      | Post-movement                                 | Do not trigger                                           |
| GOAT-02    | Corruption symbol and color both match               | Post-movement                                 | Trigger mandatorily after monster movement               |
| GOAT-03    | Gate closes                                          | Matching Corruptions in play                  | Discard them                                             |
| GOAT-04    | Corruption draw required from empty deck             | Draw                                          | Awaken immediately                                       |
| LURKER-01  | Moving Gate symbol activates on opening Mythos       | Resolve                                       | It may move during that same Mythos                      |
| LURKER-02  | Moving Gate enters investigator area                 | Resolve                                       | Pull through and delay investigator                      |
| LURKER-03  | Moving Gate moves away from explored investigator    | Resolve                                       | Remove explored marker                                   |
| LURKER-04  | Split Gate closes                                    | Resolve                                       | Clear monsters matching either symbol                    |
| LURKER-05  | Gate of Doom opens on an investigator                | Resolve opening                               | Add its extra doom and check awakening before continuing |
| MISK-01    | Alternate gate upper board disabled                  | Resolve gate                                  | Use lower location                                       |
| MISK-02    | Alternate gate upper board enabled                   | Resolve gate                                  | Use upper location only                                  |
| MISK-03    | Miskatonic card requires disabled expansion icon     | Draw                                          | Exclude at setup or replace draw                         |
| MISK-04    | Investigator holds a paired Injury and Madness       | Resolve acquisition                           | Devour unless a specific ability prevents it             |
| MISK-05    | Miskatonic component requires another boxed set      | Build eligible content for enabled sets       | Include only when every required set is enabled          |
