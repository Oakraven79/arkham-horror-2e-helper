import type { OfficialBoxedSetKey } from './boxedSetTypes'

export interface ArkhamEncounterCardFixture {
  cardCode: string
  clarifications?: string
  encounters: {
    locationKey: string
    text: string
  }[]
  neighborhoodKey: string
  requiredSetKeys?: OfficialBoxedSetKey[]
  sourceSetKey: OfficialBoxedSetKey
}

export const starterArkhamEncounterCards: ArkhamEncounterCardFixture[] = [
  {
    cardCode: 'base-uptown-001',
    neighborhoodKey: 'arkham-uptown',
    sourceSetKey: 'base-game',
    encounters: [
      {
        locationKey: 'st-marys-hospital',
        text: `Nurse Sharon slips something into your hand when the doctor isn't looking. Pass a **Sneak (-1) check** to keep anyone else from noticing. If you do, you later examine the object and find it to be an old parchment with a spell scratched on it. Draw 1 Spell. If you fail, an orderly takes it away from you and you gain nothing.`,
      },
      {
        locationKey: 'woods',
        text: `You come across a cringing dog. Pass a **Speed (-2) check** to catch and calm him. If you have Food, you can discard that to automatically pass the check instead of rolling. You see by his collar that he is named **Duke**. Take his Ally card. If it isn't available, gain $3 as a reward for returning him to his owner, instead.`,
      },
      {
        locationKey: 'ye-olde-magick-shoppe',
        text: `Miriam Beecher talks to you for awhile, explaining some very interesting theories she has concerning the Mythos. Gain 1 Clue token.`,
      },
    ],
  },
  {
    cardCode: 'base-miskatonic-university-001',
    neighborhoodKey: 'arkham-miskatonic-university',
    sourceSetKey: 'base-game',
    encounters: [
      {
        locationKey: 'administration-building',
        text: `Your discussions on the Mythos lead campus security to conclude that you are off your rocker, and they escort you off campus. Move to Arkham Asylum and immediately have an encounter there.`,
      },
      {
        locationKey: 'library',
        text: `A book in a shadowy corner of the library begins to whisper terrible things to you. Lose 1 Sanity.`,
      },
      {
        locationKey: 'science-building',
        text: `A chemical brew bubbles on a nearby Bunsen burner. It smells delicious. If you drink it, make a **Luck (+0) check**. If you pass, the strange liquid fortifies you. Roll a die and gain that many points, split between your Stamina and Sanity however you like. If you fail, the liquid turns out to be coffee. Gain 1 Stamina.`,
      },
    ],
  },
  {
    cardCode: 'base-northside-001',
    neighborhoodKey: 'arkham-northside',
    sourceSetKey: 'base-game',
    encounters: [
      {
        locationKey: 'curiositie-shoppe',
        text: `As you wander into the back of the shop, you hear a noise. Pass a **Speed (-1) check** or you look up just in time to see a descending club. Everything goes black. When you awaken, you are somewhere else. Draw a Mythos card and move to the gate location shown on it, then immediately have an encounter there.`,
      },
      {
        locationKey: 'newspaper',
        text: `You accidentally tip over a bottle of ink and are aghast at the pattern the ink forms on the newsroom floor. Lose 1 Sanity.`,
      },
      {
        locationKey: 'train-station',
        text: `A stranger in a turban steps off the Boston local train with a crazed look on his face. Make a **Luck (-1) check**. If you pass, the man pulls a strange object from beneath his cloak and gives it to you. Draw 1 Unique Item. If you fail, he pulls a poisoned blade out of his cloak and stabs you. Roll a die and lose that much Stamina.`,
      },
    ],
  },
  {
    cardCode: 'base-easttown-001',
    neighborhoodKey: 'arkham-easttown',
    sourceSetKey: 'base-game',
    encounters: [
      {
        locationKey: 'hibbs-roadhouse',
        text: `A stranger buys you a drink. You may search the Common Item deck for a Whiskey card and take it.`,
      },
      {
        locationKey: 'police-station',
        text: `Pass a **Will (-1) check** to convince Deputy Dingby to share some files with you that are very interesting. Gain 2 Clue tokens.`,
      },
      {
        locationKey: 'velmas-diner',
        text: `"This must be where pies go when they die." If you want, pay $1 to enjoy a fine slice of cherry pie. If you do, gain 2 Stamina.`,
      },
    ],
  },
  {
    cardCode: 'base-downtown-001',
    neighborhoodKey: 'arkham-downtown',
    sourceSetKey: 'base-game',
    encounters: [
      {
        locationKey: 'arkham-asylum',
        text: `Nurse Heather is coming! Make a **Speed (-1) check** to hide in time. If you pass, you see her drop something as she walks by. Draw 1 Unique Item. If you fail, she throws you out. Move to the street.`,
      },
      {
        locationKey: 'bank-of-arkham',
        text: `A man wearing dirty and tattered clothing is loitering outside the bank. He offers to sell you his last possession to get some food money for him and his family. If you accept, pay $2 and make a **Luck (-1) check**. If you pass, draw 1 Unique Item. If you fail, draw 1 Common Item.`,
      },
      {
        locationKey: 'independence-square',
        text: `Make a **Will (-1) check**. If you pass it, **Anna Kaslow** the fortune teller offers her help in your investigation. Take her Ally card if it is still available. Otherwise, gain 2 Clue tokens. If you fail, nothing happens.`,
      },
    ],
  },
  {
    cardCode: 'base-rivertown-001',
    neighborhoodKey: 'arkham-rivertown',
    sourceSetKey: 'base-game',
    encounters: [
      {
        locationKey: 'black-cave',
        text: `A monster appears!`,
      },
      {
        locationKey: 'general-store',
        text: `You notice that some of the locals have an odd, fish-like quality that sets your teeth on edge. The shopkeeper notices your gaze and nods. "Marsh stock, from over in Innsmouth. Watch yourself around them." Shivering, you lose 1 Sanity.`,
      },
      {
        locationKey: 'graveyard',
        text: `You find a man painting a picture of one of the horrible gargoyles lining the walls of the graveyard. Seeing you, he introduces himself as **Richard Upton Pickman**, a painter visiting from Boston. If you spend monster trophies that have a total of 5 toughness, Pickman takes a liking to you. Take his Ally card. If it is not available, he teaches you an incantation instead. Draw 1 Spell.`,
      },
    ],
  },
  {
    cardCode: 'base-southside-001',
    neighborhoodKey: 'arkham-southside',
    sourceSetKey: 'base-game',
    encounters: [
      {
        locationKey: 'historical-society',
        text: `Perusing the county records, you discover something horrifying about your family tree. Lose 1 Sanity.`,
      },
      {
        locationKey: 'mas-boarding-house',
        text: `The last guest to stay in your room had to leave in a hurry and left something behind. Draw 1 Common Item.`,
      },
      {
        locationKey: 'south-church',
        text: `You enter the confessional. "Bless me, Father, for I have sinned." Make a **Luck (+0) check** and consult the chart below:

**Successes:**

0: "Father? Are you there?" You hear a scream in the next compartment! Lose 3 Sanity and move to the street.  
1: "Father?" There is no answer. Sighing, you leave. Move to the street.  
2+: "I don't remember my last confession." Raise your Sanity to its maximum value.`,
      },
    ],
  },
  {
    cardCode: 'base-merchant-district-001',
    neighborhoodKey: 'arkham-merchant-district',
    sourceSetKey: 'base-game',
    encounters: [
      {
        locationKey: 'river-docks',
        text: `As you look out across the waves, you feel strangely compelled to throw yourself into the ocean's watery embrace. Pass a **Will (+1) check** or you are lost in time and space.`,
      },
      {
        locationKey: 'the-unnamable',
        text: `You hear the scurrying and squeaking of a horde of rats from inside the walls. Abruptly, you realize that they are moving to surround you. Pass a **Speed (-1) check** to make it to the front door first. If you fail, you are lost in time and space.`,
      },
      {
        locationKey: 'unvisited-isle',
        text: `Looking up at the night sky from the island, you see constellations that you've never seen before. The entire night sky is different here! Lose 1 Sanity and gain 1 Clue token.`,
      },
    ],
  },
  {
    cardCode: 'base-french-hill-001',
    neighborhoodKey: 'arkham-french-hill',
    sourceSetKey: 'base-game',
    encounters: [
      {
        locationKey: 'silver-twilight-lodge',
        text: `You find an old parchment in the study. Pass a **Lore (-1) check** to draw 2 Spells and keep one of your choice.`,
      },
      {
        locationKey: 'inner-sanctum',
        text: `You are allowed into the vault of Silver Secrets. Pass a **Luck (-2) check** to steal a very unusual item. Search the Unique Item deck and take any 1 Unique Item you want.`,
      },
      {
        locationKey: 'the-witch-house',
        text: `"Excuse me, stranger, but have you ever seen this symbol before?" A man standing near the house holds up an occult symbol. Make a **Lore (-1) check**. If you pass, the man introduces himself as **Thomas F. Malone**, a police detective visiting Arkham on a case. He's impressed with you and offers to join you. Take his Ally card. If it's not available, he tells you some valuable information instead. Gain 2 Clue tokens. If you fail, nothing happens.`,
      },
    ],
  },
]
