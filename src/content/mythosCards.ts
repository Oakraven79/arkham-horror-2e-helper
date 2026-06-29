import { generatedMythosCards } from './mythosCards.generated'
import type { StarterMythosCard } from './mythosCardTypes'

export type { StarterMythosCard } from './mythosCardTypes'

const curatedMythosCards = [
  {
    cardCode: 'base-fourth-of-july-parade',
    title: 'Fourth Of July Parade!',
    cardType: 'Headline',
    copyCount: 1,
    locationKey: 'the-witch-house',
    description: `Investigators cannot move into or out of the Merchant District street until the end of the next turn. Leave this card in play until then to indicate this.

### Close:
Merchant District Streets

### Clue Appears at:
Black Cave`,
    monsterMoveWhite: ['crescentMoon'],
    monsterMoveBlack: ['cross'],
  },
  {
    cardCode: 'base-the-chill-of-the-grave',
    title: 'The Chill of the Grave',
    cardType: 'Environment (Mystic)',
    copyCount: 1,
    locationKey: 'unvisited-isle',
    description: `All *Undead* Monsters have their toughness increased by 1.

### Clue Appears at:
Science Building`,
    monsterMoveWhite: ['cross'],
    monsterMoveBlack: ['crescentMoon'],
  },
  {
    cardCode: 'king-in-yellow-new-miskatonic-u-curriculum',
    title: 'New Miskatonic U. Curriculum',
    cardType: 'Environment (Urban)',
    copyCount: 1,
    locationKey: 'unvisited-isle',
    description: `"The King in Yellow" has, amidst heavy
controversy, been added to the literary
curriculum at the University. Its teaching
has stirred up the students' interest in all
written occult works. If an investigator
reads a _**Tome**_ in the Library, he gains a +2
bonus to any **Lore check** made to do so.

### Activity At:
Library
### Clue Appears At:
Black Cave`,
    monsterMoveWhite: ['hexagon'],
    monsterMoveBlack: ['leftLean', 'triangle', 'star'],
  },
  {
    cardCode: 'king-in-yellow-two-sunsets',
    title: 'Two Sunsets?',
    cardType: 'Environment (Weather)',
    copyCount: 1,
    locationKey: 'black-cave',
    description: `A blurring effect in the atmosphere, which
scientists believe may be caused by foreign
weapons testing, has caused there to seem
to be two suns, setting in rapid succession!

Sneak and Will checks in Arkham are made
at a -1 penalty.

### Clue Appears At:
Hibb's Roadhouse`,
    monsterMoveWhite: ['hexagon'],
    monsterMoveBlack: ['leftLean', 'triangle', 'star'],
  },
  {
    cardCode: 'base-disturbing-the-dead',
    title: 'Disturbing the Dead',
    cardType: 'Rumor',
    copyCount: 1,
    locationKey: 'black-cave',
    description: `**Ongoing Effect:** Roll a die at the end of every **Mythos Phase** while this is in play (Beginning the turn after it entered play). On a 1 or 2, increase the terror level by 1.

**Pass:** If a player discards 2 gate trophies during the **Arkham Encounter Phase** while in the Rivertown Streets, return this card to the box. Each player draws 1 Spell.

**Fail:** If the terror level reaches 10, return the card to the box. Every investigator is *Cursed*.

### Activity at:
Rivertown Streets`,
    monsterMoveWhite: ['leftLean', 'triangle', 'star'],
    monsterMoveBlack: ['hexagon'],
  },
  {
    cardCode: 'base-the-terrible-experiment',
    title: 'The Terrible Experiment',
    cardType: 'Rumor',
    copyCount: 1,
    locationKey: 'unvisited-isle',
    description: `When this card enters play, place 5 monsters from
the cup on it. Any player may choose to fight one
or more of these monsters while in the Miskatonic
U. streets during the **Arkham Encounter Phase**. If
defeated, they are claimed as monster trophies. These
monsters do not move, are not considered to be on
the board, and do not count against the monster limit.

**Ongoing Effect:** Place a monster on this card at the
end of every Mythos Phase (beginning the turn after
it entered play).

**Pass:** If there are no monsters on this card, return it
to the box. Each player draws 1 Skill.

**Fail:** If there are 8 monsters on this card, return it
to the box. Raise the terror level to 10 and place the
monsters that were on it into play in the Miskatonic
U. streets.

### Activity At:
Miskatonic U. Streets`,
    monsterMoveWhite: ['leftLean', 'triangle', 'star'],
    monsterMoveBlack: ['hexagon'],
  },
  {
    cardCode: 'king-in-yellow-the-tattered-king',
    title: 'The Tattered King',
    cardType: 'Rumor',
    copyCount: 1,
    description: `**Ongoing Effect:** Place 1 Clue token on
this card at the end of every **Mythos Phase**
(beginning the turn after it enters play).

**Fail:** When the 5th clue token is placed on
this card, return this card to the box. Any
investigator in a street area is devoured,
as the tattered king catches sight of him in
the dead of night.`,
    monsterMoveWhite: ['leftLean', 'triangle', 'star', 'cross', 'circle'],
    monsterMoveBlack: ['square', 'diamond', 'crescentMoon', 'hexagon'],
    lowerLeftOverride: {
      imagePublicPath: '/images/misc/doomCounters.png',
      text: 'No gates open, but add 2 doom tokens to the doom track.',
    },
  },
  {
    cardCode: 'base-the-story-continues',
    title: 'The Story Continues ...',
    cardType: 'Special',
    copyCount: 1,
    description: `*"I cannot remember, I **must** not
remember what I saw on that dark
and foreboding night ... "*


Shuffle the Mythos deck, being
sure to include this card in it.
After the deck is shuffled, draw
a new Mythos card for the turn.`,
  },
  {
    cardCode: 'king-in-yellow-the-next-act-begins',
    title: 'The Next Act Begins',
    cardType: 'Headline',
    copyCount: 1,
    description: `The terror level is increased by 1. However,
no gate is opened this turn.

The next act of the charity performance of
"The King in Yellow" has begun.

The first piavey must put the top card of
deck into play.

The first player gains 1 Clue token.`,
    monsterMoveWhite: ['square', 'diamond', 'crescentMoon', 'hexagon'],
    monsterMoveBlack: ['leftLean', 'triangle', 'star', 'cross', 'circle'],
  },
]

const curatedPresentation = new Map(
  curatedMythosCards.map((card) => [
    card.cardCode,
    {
      description: card.description,
      title: card.title,
      ...('lowerLeftOverride' in card ? { lowerLeftOverride: card.lowerLeftOverride } : {}),
    },
  ]),
)

export const starterMythosCards: StarterMythosCard[] = generatedMythosCards.map((card) => ({
  ...card,
  gateInstruction: {
    ...card.gateInstruction,
    locationKeys: [...card.gateInstruction.locationKeys],
  },
  ...(card.monsterMoveWhite ? { monsterMoveWhite: [...card.monsterMoveWhite] } : {}),
  ...(card.monsterMoveBlack ? { monsterMoveBlack: [...card.monsterMoveBlack] } : {}),
  ...(card.rulesNotes ? { rulesNotes: card.rulesNotes.map((note) => ({ ...note })) } : {}),
  ...curatedPresentation.get(card.cardCode),
}))

export function getStarterMythosCard(cardCode: string) {
  return starterMythosCards.find((card) => card.cardCode === cardCode)
}
