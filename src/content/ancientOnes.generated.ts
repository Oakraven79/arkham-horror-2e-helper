import type { StarterAncientOne } from './ancientOneTypes'

// Generated from wireframes/Source data/ancient_ones.json. Do not edit by hand.
export const generatedAncientOnes: readonly StarterAncientOne[] = [
  {
    "name": "Azathoth",
    "key": "azathoth",
    "boxedSet": "Base Game",
    "lore": "Azathoth first appears in Azathoth (1922), written by H.P. Lovecraft.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 14,
        "combatRating": {
          "display": "-\u221e",
          "type": "infinite"
        },
        "defenses": [],
        "defenseText": "None",
        "worshippers": "Since Azathoth promises nothing except destruction, only the insane worship him. However, their fanaticism gives them strength. Maniacs have their toughness increased by 1.",
        "powerName": "Absolute Destruction",
        "power": "If Azathoth awakens, the game is over and the investigators lose.",
        "attack": "The end is here! Azathoth destroys the world."
      }
    ]
  },
  {
    "name": "Cthulhu",
    "key": "cthulhu",
    "boxedSet": "Base Game",
    "lore": "Cthulhu was introduced in The Call of Cthulhu (1926), written by H.P. Lovecraft.",
    "sheets": [
      {
        "key": "original",
        "label": "Original",
        "isDefault": true,
        "doomTrack": 13,
        "combatRating": {
          "display": "-6",
          "type": "fixed",
          "modifier": -6
        },
        "defenses": [
          "special"
        ],
        "defenseText": "Special (See Attack)",
        "worshippers": "Cthulhu's worshippers often have the Innsmouth Look, a sign of monstrous ancestors. Cultists have a horror rating of -2 and a horror damage of 2 Sanity.",
        "powerName": "Dreams of Madness",
        "power": "While Cthulhu stirs in his slumber, investigators have their maximum Sanity and maximum Stamina reduced by 1.",
        "attack": "Each investigator lowers either his maximum Sanity or Maximum Stamina by 1 (his choice). After Cthulhu attacks 1 doom token is placed back on Cthulhu's doom track if it isn't already full."
      },
      {
        "key": "arkham-nights",
        "label": "Arkham Nights",
        "isDefault": false,
        "doomTrack": 13,
        "combatRating": {
          "display": "-6",
          "type": "fixed",
          "modifier": -6
        },
        "defenses": [
          "special"
        ],
        "defenseText": "Special (See Attack)",
        "worshippers": "Cthulhu's worshippers often have the Innsmouth Look, a sign of monstrous ancestors. Cultists are Aquatic, have a horror rating of -2 and a horror damage of 2 Sanity.",
        "powerName": "Madness Without End",
        "power": "While Cthulhu stirs in his slumber, investigators have their maximum Sanity and maximum Stamina reduced by 1. Each time an investigator is knocked unconscious, his maximum Stamina is reduced by 1. Each time an investigator is driven insane, his maximum Santiy is reduced by 1.",
        "attack": "Each investigator lowers either his maximum Sanity or Maximum Stamina by 1 (his choice). After Cthulhu attacks 1 doom token is placed back on Cthulhu's doom track if it isn't already full."
      }
    ]
  },
  {
    "name": "Hastur",
    "key": "hastur",
    "boxedSet": "Base Game",
    "lore": "The name Hastur first appeared in Haita the Shepherd (1893), written by Ambrose Bierce, where he was a benevolent god of shepherds. Robert W. Chambers appropriated the name for use in his anthology The King in Yellow (1895). The first Mythos story to use the name was The Whisperer in Darkness (1930), written by H.P. Lovecraft.",
    "sheets": [
      {
        "key": "original",
        "label": "Original",
        "isDefault": true,
        "doomTrack": 13,
        "combatRating": {
          "display": "-X",
          "type": "variable"
        },
        "defenses": [
          "physical-resistance"
        ],
        "defenseText": "Physical Resistance",
        "worshippers": "Hastur's worshippers ride byakhee mounts that they call with enchanted whistles. Cultists are flying monsters and their combat rating is -2.",
        "powerName": "The King in Yellow",
        "power": "While Hastur stirs in his slumber, the cost to seal a gate is 8 Clue tokens instead of 5.",
        "startOfBattle": "X is set to the current terror level.",
        "attack": "Each investigator must pass a Luck (+1) check or lose 2 Sanity. This check's modifier decreases by 1 each turn (+0 the 2nd turn, -1 the 3rd turn, etc.)"
      },
      {
        "key": "arkham-nights",
        "label": "Arkham Nights",
        "isDefault": false,
        "doomTrack": 13,
        "combatRating": {
          "display": "-5",
          "type": "fixed",
          "modifier": -5
        },
        "defenses": [
          "physical-resistance"
        ],
        "defenseText": "Physical Resistance",
        "worshippers": "Hastur's worshippers ride byakhee mounts that they call with enchanted whistles. Cultists are flying monsters and their combat rating is \u20132.",
        "powerName": "The Unspeakable One",
        "power": "While Hastur stirs in his slumber, immediately after an investigator seals a gate, he or she must reduce his or her maximum Sanity by 1. (An investigator may seal a gate even if doing so would reduce his or her maximum Sanity to 0.)\n\nEach time an investigator in Arkham is driven insane or devoured, raise the Terror\nLevel by 1.",
        "attack": "Each investigator must pass a Luck (+1) check or lose 2 Sanity. This check's modifier decreases by 1 each turn (+0 the 2nd turn, -1 the 3rd turn, etc.)"
      }
    ]
  },
  {
    "name": "Ithaqua",
    "key": "ithaqua",
    "boxedSet": "Base Game",
    "lore": "Ithaqua first appeared in The Thing that Walked on the Wind (1933), written by August Derleth.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 11,
        "combatRating": {
          "display": "-3",
          "type": "fixed",
          "modifier": -3
        },
        "defenses": [],
        "defenseText": "None",
        "worshippers": "Ithaqua's worshippers eat the flesh of their fellow men, gaining supernatural power through their dark practice. Cultists have their toughness increased by 2.",
        "powerName": "Icy Winds",
        "power": "While Ithaqua stirs in his slumber, any investigator in a street area at the end of the Mythos phase loses 1 Stamina. In addition, all Weather cards are discarded without their special effects taking place.",
        "startOfBattle": "Investigators must roll a die for every item they have, discarding the item on a failure.",
        "attack": "Each investigator must pass a Fight (+1) check or lose 2 Stamina. This check's modifier decreases by 1 each turn (+0 the 2nd turn, -1 the 3rd turn, etc.)"
      }
    ],
    "rulesNotes": [
      {
        "kind": "errata",
        "text": "If a non-weather environment card is in play and a new Mythos card is drawn with a weather environmental effect, all functions of the card are followed except for the environmental effect. The card is then discarded.\n\nAt the start of battle, each investigator must roll one die separately for each item the investigator has."
      }
    ]
  },
  {
    "name": "Nyarlathotep",
    "key": "nyarlathotep",
    "boxedSet": "Base Game",
    "lore": "Nyarlathotep is first mentioned in the prose poem Nyarlathotep (1920), written by H.P. Lovecraft. The first piece of fiction to feature him is The Rats in the Walls (1924), also written by H.P. Lovecraft.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 11,
        "combatRating": {
          "display": "-4",
          "type": "fixed",
          "modifier": -4
        },
        "defenses": [
          "magical-resistance"
        ],
        "defenseText": "Magical Resistance",
        "worshippers": "Nyarlathotep has innumerable cults all over the world. Cultists have the Endless ability.",
        "powerName": "A Thousand Masks",
        "power": "At the start of the game add the 5 Mask monsters to the cup. Multiple Mask monsters can be in play at once.",
        "startOfBattle": "Any investigator with no Clue tokens is devoured.",
        "attack": "Each investigator must pass a Lore (+1) check or lose 1 Clue token. Any investigator with no Clue tokens left is devoured. This check's modifier decreases by 1 each turn (+0 the 2nd turn, -1 the 3rd turn, etc.)"
      }
    ],
    "rulesNotes": [
      {
        "kind": "clarification",
        "text": "Add ALL Mask monsters to the cup at the beginning of the game."
      }
    ]
  },
  {
    "name": "Shub-Niggurath",
    "key": "shub-niggurath",
    "boxedSet": "Base Game",
    "lore": "Shub-Niggurath first appeared in The Last Test (1927), written by H.P. Lovecraft and Adolphe de Castro. It was also mentioned in The Thing on the Doorstep (1937), written by H.P. Lovecraft.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 12,
        "combatRating": {
          "display": "-5",
          "type": "fixed",
          "modifier": -5
        },
        "defenses": [
          "physical-immunity"
        ],
        "defenseText": "Physical Immunity",
        "worshippers": "Shub-Niggurath's young are numberless. Dark Young have the Endless ability.",
        "powerName": "Black Goat of the Woods",
        "power": "While Shub-Niggurath stirs in her slumber, all monsters have their toughness increased by 1.",
        "startOfBattle": "Any investigator with no monster trophies is devoured.",
        "attack": "Each investigator must pass a Sneak (+1) check or lose 1 monster trophy. Any investigator with no monster trophies left is devoured. The check's modifier decreases by 1 each turn (+0 the 2nd turn, -1 the 3rd turn, etc.)"
      }
    ]
  },
  {
    "name": "Yig",
    "key": "yig",
    "boxedSet": "Base Game",
    "lore": "Yig first appears in The Curse of Yig (1928), written by H.P. Lovecraft and Zealia Bishop.",
    "sheets": [
      {
        "key": "original",
        "label": "Original",
        "isDefault": true,
        "doomTrack": 10,
        "combatRating": {
          "display": "-3",
          "type": "fixed",
          "modifier": -3
        },
        "defenses": [],
        "defenseText": "None",
        "worshippers": "Yig's worshippers are actually disguised serpent people. Their bite is highly poisonous. Cultists have a combat rating of +0 and a combat damage of 4 Stamina.",
        "powerName": "Yig's Anger",
        "power": "While Yig stirs in his slumber, he gains a doom token whenever a Cultist is defeated or an investigator is Lost in Time and Space.",
        "startOfBattle": "Every investigator is Cursed. Any investigator that already has a Curse is devoured.",
        "attack": "Each investigator must pass a Speed (+1) check or lose 1 Sanity and 1 Stamina. This check's modifier decreases by 1 each turn (+0 the 2nd turn, -1 the 3rd turn, etc.)"
      },
      {
        "key": "arkham-nights",
        "label": "Arkham Nights",
        "isDefault": false,
        "doomTrack": 10,
        "combatRating": {
          "display": "-3",
          "type": "fixed",
          "modifier": -3
        },
        "defenses": [],
        "defenseText": "None",
        "worshippers": "Yig's worshippers are actually disguised serpent people. Their bite is highly venomous. Cultists have a combat rating of +0 and a combat damage of 4 Stamina.",
        "powerName": "The Father of Serpents",
        "power": "While Yig stirs in his slumber, he gains a doom token whenever a Cultist is defeated or an investigator is Lost in Time and Space. When a gate opens (including during setup), each investigator must pass a Sneak (+2) check or be Cursed. Reduce the modifier by 1 for each open gate.",
        "startOfBattle": "All Cursed investigators are devoured. Then all remaining investigators are Cursed.",
        "attack": "Each investigator must pass a Speed (+1) check or lose 1 Sanity and 1 Stamina. This check's modifier decreases by 1 each turn (+0 the 2nd turn, -1 the 3rd turn, etc.) If the results of an investigator's skill check include two or more 1s, he loses 1 Sanity and 1 Stamina. If the investigator is devoured as a result, no successes are scored and he fails the check."
      }
    ]
  },
  {
    "name": "Yog-Sothoth",
    "key": "yog-sothoth",
    "boxedSet": "Base Game",
    "lore": "The name Yog-Sothoth first appears in The Case of Charles Dexter Ward (1927), written by H.P. Lovecraft. Actual details of his attributes appear in The Dunwich Horror (1928), also written by H.P. Lovecraft.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 12,
        "combatRating": {
          "display": "-5",
          "type": "fixed",
          "modifier": -5
        },
        "defenses": [
          "magical-immunity"
        ],
        "defenseText": "Magical Immunity",
        "worshippers": "Yog-Sothoth's worshippers have powerful magical abilities. Cultists have Magical Immunity and a combat rating of -1.",
        "powerName": "The Key and the Gate",
        "power": "While Yog-Sothoth stirs in his slumber, the difficulty to close or seal a gate increases by 1. In addition, any investigator Lost in Time and Space is devoured.",
        "startOfBattle": "Any investigator with no gate trophies is devoured.",
        "attack": "Each investigator must pass a Will (+1) check or lose 1 gate trophy. Any investigator with no gate trophies left is devoured. This check's modifier decreases by 1 each turn (+0 the 2nd turn, -1 the 3rd turn, etc.)"
      }
    ],
    "rulesNotes": [
      {
        "kind": "errata",
        "text": "The difficulty increase caused by Yog-Sothoth's power The Key And The Gate does not affect the number of clue tokens required to seal a gate. The power only requires an extra success when attempting to close a gate."
      }
    ]
  },
  {
    "name": "Abhoth",
    "key": "abhoth",
    "boxedSet": "Dunwich Horror",
    "lore": "Abhoth first appears in The Seven Geases (1934), written by Clark Ashton Smith.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 11,
        "combatRating": {
          "display": "-4",
          "type": "fixed",
          "modifier": -4
        },
        "defenses": [
          "magical-resistance"
        ],
        "defenseText": "Magical Resistance",
        "worshippers": "Abhoth has no human worshippers. Return all Cultists to the box at the start of the game. Place the 3 Child of Abhoth monsters on this sheet. Children of Abhoth that are defeated return to this sheet. They can never be claimed as trophies.",
        "powerName": "Abominations",
        "power": "While Abhoth stirs in his slumber, each time a monster surge occurs, place a random Child of Abhoth on the surging gate. If all 3 Children of Abhoth are already on the board, raise the terror level by 2 and add 1 doom token to the doom track.",
        "attack": "Each investigator must discard a total of 3 Clue tokens, monster trophies, gate trophies, and/or Items or be devoured."
      }
    ]
  },
  {
    "name": "Glaaki",
    "key": "glaaki",
    "boxedSet": "Dunwich Horror",
    "lore": "Glaaki first appeared in The Inhabitant of the Lake (1964), written by Ramsey Campbell.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 12,
        "combatRating": {
          "display": "-5",
          "type": "fixed",
          "modifier": -5
        },
        "defenses": [
          "physical-resistance"
        ],
        "defenseText": "Physical Resistance",
        "worshippers": "Glaaki's worshippers are relentless undead creatures. Cultists are Undead and stalkers. Place the 5 Servant of Glaaki monsters on this sheet. Servants of Glaaki that are defeated return to this sheet. They can never be claimed as trophies.",
        "powerName": "Undead Servants",
        "power": "While Glaaki stirs in his slumber, each time an Ally is discarded or removed from the game, draw a mythos card and place a random Servant of Glaaki on the gate location shown (even if it is sealed). If all 5 Servants of Glaaki are already on the board, Glaaki immediately awakens. If an investigator is devoured, raise the terror level by 2.",
        "attack": "Raise the terror level by 1. If it is 10 or higher, all investigators are devoured."
      }
    ]
  },
  {
    "name": "Shudde M'ell",
    "key": "shudde-mell",
    "boxedSet": "Dunwich Horror",
    "lore": "Shudde M'ell first appeared in Cement Surroundings (1969), written by Brian Lumley.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 12,
        "combatRating": {
          "display": "-3",
          "type": "fixed",
          "modifier": -3
        },
        "defenses": [
          "physical-resistance",
          "magical-resistance"
        ],
        "defenseText": "Magical Resistance and Physical Resistance",
        "worshippers": "Shudde M'ell is worshipped by his inhuman children. Chthonians deal their damage when moving on a roll of 2-6 instead of a roll of 4-6.",
        "powerName": "World Cracking",
        "power": "While Shudde M'ell stirs in his slumber place the 7 rubble tokens face down near the board. Each time a monster surge occurs, draw a rubble token. The token is placed on the location it shows, closing that location for the rest of the game. If there are no rubble tokens left when one should be drawn, the game is over and the investigators lose.",
        "attack": "One undrawn rubble token is discarded. If there are no rubble tokens left to discard when Shudde M'ell attacks, Arkham is destroyed by a massive earthquake and all investigators are devoured."
      }
    ]
  },
  {
    "name": "Tsathoggua",
    "key": "tsathoggua",
    "boxedSet": "Dunwich Horror",
    "lore": "Tsathoggua was first mentioned in H.P. Lovecraft's The Whisperer in the Darkness (1931) and again in The Shadow Out of Time (1936), although he was invented and first described in Clark Ashton Smith's short story The Tale of Satampra Zeiros (1931). Published only a few month's apart, Smith's story was actually written a year earlier. Tsathoggua is a primary deity in Smith's Hyperborean Cycle.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 13,
        "combatRating": {
          "display": "-6",
          "type": "fixed",
          "modifier": -6
        },
        "defenses": [],
        "defenseText": "None",
        "worshippers": "Tsathoggua is served by black, amorphous creatures. Formless Spawn gain +1 toughness and become stalkers.",
        "powerName": "Malaise",
        "power": "While Tsathoggua stirs in his slumber, investigators cannot use the special ability of any locations other than the Arkham Asylum, Curiositie Shoppe, General Store, Ye Olde Magick Shoppe, and St. Mary's Hospital. This does not prevent investigators from having encounters or traveling between cities. In addition, all Urban cards are discarded without their special effects taking place.",
        "startOfBattle": "Investigators discard all Clue tokens.",
        "attack": "Each investigator must discard 2 monster trophies and 1 gate trophy or be devoured."
      }
    ]
  },
  {
    "name": "Atlach-Nacha",
    "key": "atlach-nacha",
    "boxedSet": "Kingsport Horror",
    "lore": "Atlach-Nacha first appears in The Seven Geases (1934), written by Clark Ashton Smith.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 13,
        "combatRating": {
          "display": "-5",
          "type": "fixed",
          "modifier": -5
        },
        "defenses": [
          "physical-resistance",
          "magical-resistance"
        ],
        "defenseText": "Magical Resistance and Physical Resistance",
        "worshippers": "Atlach-Nacha is worshipped by the terrible Leng Spiders. Leng Spiders are fast, and their toughness is increased by 2.",
        "powerName": "Web Between Worlds",
        "power": "While Atlach-Nacha stirs in his slumber, all gate openings are gate bursts. In addition, all Mystic cards are discarded without their special effects taking place.",
        "attack": "The Investigators must, as a group, choose one Ally in play or one investigator. If an Ally is chosen, it is returned to the box. If an investigator is chosen, that investigator is devoured."
      }
    ]
  },
  {
    "name": "Eihort",
    "key": "eihort",
    "boxedSet": "Kingsport Horror",
    "lore": "Eihort first appeared in Before the Storm (1980), written by Ramsey Campbell.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 12,
        "combatRating": {
          "display": "-4",
          "type": "fixed",
          "modifier": -4
        },
        "defenses": [
          "physical-immunity"
        ],
        "defenseText": "Physical Immunity",
        "worshippers": "Eihort's worshippers are infested with his blood. Each time an investigator defeats a Cultist, that investigator gains a brood token.",
        "powerName": "Eihort's Bargain",
        "power": "While Eihort stirs in his slumber, any investigator who seals a gate gains 1 brood token. Any brood tokens on an investigator who is devoured are immediately added to Eihort's doom track as doom tokens. Eihort can exceed 12 doom tokens on his doom track.\n\nEihort's Brood: Each time an investigator gains a brood token, roll a die. If the roll is lower than the number of brood tokens possessed by that investigator, he is devoured.",
        "startOfBattle": "When Eihort awakens, each investigator gains one brood token.",
        "attack": "The first player gains one brood token."
      }
    ]
  },
  {
    "name": "Y'Golonac",
    "key": "ygolonac",
    "boxedSet": "Kingsport Horror",
    "lore": "Y'Golonac first appeared in Cold Print (1969), written by Ramsey Campbell.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 12,
        "combatRating": {
          "display": "-4",
          "type": "fixed",
          "modifier": -4
        },
        "defenses": [
          "physical-resistance"
        ],
        "defenseText": "Physical Resistance",
        "worshippers": "Y'Golonac's worshippers are possessed by him and revert to their normal form upon death. Each time an investigator defeats a Cultist, increase the terror level by 1.",
        "powerName": "Corrupting Text",
        "power": "While Y'Golonac stirs in his slumber, each time an investigator draws a Tome from any deck after dealing out starting equipment (whether he keeps the Tome or not) add one doom token to Y'Golonac's doom track.",
        "attack": "Wounds from Y'Golonac's hands remain open and bleeding. Each investigator loses 1 point of Sanity and/or Stamina, split between the two however he likes. This increases by 1 point each successive round (e.g., 2 points in round two, 3 in round three, etc.)."
      }
    ],
    "rulesNotes": [
      {
        "kind": "clarification",
        "text": "Y'Golonac's Corrupting Text ability does not trigger if an investigator is instructed to look through a deck and take an item of his choice unless he takes a Tome."
      }
    ]
  },
  {
    "name": "Yibb-Tstll",
    "key": "yibb-tstll",
    "boxedSet": "Kingsport Horror",
    "lore": "Yibb-Tstll first appeared in Cement Surroundings (1969), written by Brian Lumley.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 11,
        "combatRating": {
          "display": "-X",
          "type": "variable"
        },
        "defenses": [
          "special"
        ],
        "defenseText": "Special",
        "worshippers": "Yibb-Tstll is served by the Nightgaunts. All Nightgaunts have their horror damage increased to 3 Sanity.",
        "powerName": "All-Seeing",
        "power": "While Yibb-Tstll stirs in her slumber, the difficulty of all Evade checks is increased by 1.\n\nIn addition, no investigator can have more than 5 Clue tokens at once.\n\nWhen Yibb-Tstll awakens, X is set to the number of Clue tokens left on the board.",
        "startOfBattle": "When Yibb-Tstll awakens all investigators lose all Clue tokens.",
        "attack": "The first player rolls dice equal to his focus. If he does not roll at least one success, he is devoured. If he rolls two or more successes he is Blessed. It takes twice as many successes as usual to remove each doom token from Yibb-Tstll's doom track."
      }
    ]
  },
  {
    "name": "Bokrug",
    "key": "bokrug",
    "boxedSet": "Innsmouth Horror",
    "lore": "Bokrug first appeared in the story The Doom That Came to Sarnath (1919), written by H.P. Lovecraft. Bokrug was a god worshiped by the beings of the city of Ib. The beings of Ib were killed by the men that founded the city Sarnath. 1,000 years after the massacre Bokrug helped the ghosts of the Beings of Ib take their revenge on Sarnath.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 12,
        "combatRating": {
          "display": "-X",
          "type": "variable"
        },
        "defenses": [
          "physical-resistance",
          "magical-resistance"
        ],
        "defenseText": "Magical Resistance, Physical Resistance",
        "worshippers": "Bokrug is worshipped by the ghosts of its followers, the Beings of Ib. At the start of the game, place the four Being of Ib monster tokens on this sheet.\n\nInvestigators suffer the penalties listed on each Being of Ib on this sheet.",
        "powerName": "Vengeance for the Dead",
        "power": "While Bokrug stirs in his slumber, any investigator may spend 2 gate trophies, 10 toughness worth of monster trophies, or 1 gate trophy and 5 toughness worth of monster trophies during the Upkeep Phase while in any Other World to remove one Being of Ib of his choice from this sheet.",
        "startOfBattle": "X is set to twice the number of Beings of Ib on this sheet.",
        "attack": "Add 1 clue token to this sheet. If this brings the total number of clues and Beings of Ib on this sheet to eight or more, the investigators are devoured and lose the game."
      }
    ],
    "rulesNotes": [
      {
        "kind": "reference",
        "text": "Being of Ib\nBeing of Ib (2)\nBeing of Ib (3)\nBeing of Ib (4)"
      }
    ]
  },
  {
    "name": "Chaugnar Faugn",
    "key": "chaugnar-faugn",
    "boxedSet": "Innsmouth Horror",
    "lore": "Chaugnar Faugn first appears in The Horror from the Hills (1931), written by Frank B. Long.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 12,
        "combatRating": {
          "display": "-4",
          "type": "fixed",
          "modifier": -4
        },
        "defenses": [
          "physical-immunity"
        ],
        "defenseText": "Physical Immunity",
        "worshippers": "Chaugnar Faugn is worshipped by a fierce and fanatical jungle tribe. All Tcho-tchos and Tcho-tcho Priests gain +2 toughness.",
        "powerName": "Curse of the Jungle",
        "power": "While Chaugnar Faugn stirs in his slumber, any investigator carrying an Elder Sign or in the same neighborhood as an elder sign token suffers a -1 penalty to all skill checks.",
        "attack": "Each investigator must discard three Clue tokens, one Ally, or be devoured. Chaugnar Faugn cannot have more than three doom tokens removed from his doom track during a single round of combat - he ignores all further successes."
      }
    ]
  },
  {
    "name": "Cthugha",
    "key": "cthugha",
    "boxedSet": "Innsmouth Horror",
    "lore": "Cthugha first appears in The House on Curwen Street (1944), written by August Derleth.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 13,
        "combatRating": {
          "display": "-5",
          "type": "fixed",
          "modifier": -5
        },
        "defenses": [
          "physical-resistance"
        ],
        "defenseText": "Physical Resistance",
        "worshippers": "Cthugha is worshipped by its smaller brethren. Fire Vampires gain +2 toughness and deal 1 extra Stamina as combat damage.",
        "powerName": "Sweltering Heat",
        "power": "While Cthugha stirs in its slumber, each investigator loses 1 Stamina for each movement point over 3 he spends each turn. Reading Tomes does not count towards this total. In addition, all Weather cards are ignored when drawn - a new card being drawn instead.",
        "attack": "Roll a die. Each investigator must lose a total of that many Clue tokens, Stamina, and/or Sanity or be devoured. Any weapon used in an attack against Cthugha is discarded after the attack is made."
      }
    ]
  },
  {
    "name": "Ghatanothoa",
    "key": "ghatanothoa",
    "boxedSet": "Innsmouth Horror",
    "lore": "Ghatanothoa first appeared in Out of the Aeons (1933), written by H.P. Lovecraft and Hazel Heald.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 13,
        "combatRating": {
          "display": "-6",
          "type": "fixed",
          "modifier": -6
        },
        "defenses": [],
        "defenseText": "None",
        "worshippers": "Ghatanothoa is worshipped by certain ancient reptiles and fungi from Yuggoth. Lloigor and Mi-Go gain +2 toughness.",
        "powerName": "Annihilating Gaze",
        "power": "While Ghatanothoa stirs in his slumber, place the eight visage tokens facedown on this sheet. Each time an investigator gains 2 or more Clue tokens at once, he must turn a visage token faceup. If it has Ghatanothoa's face on it, he is devoured. If not, leave the token faceup. Once four visage tokens are faceup, turn them facedown and shuffle the visage tokens.",
        "attack": "Each investigator must spend 1 movement point or be devoured. This increases by 1 point in each successive round (e.g. 2 points in round 2, 3 in round three, etc.).\n\nEach investigator's attack against Ghatanothoa deals one less success than normal."
      }
    ]
  },
  {
    "name": "Nyogtha",
    "key": "nyogtha",
    "boxedSet": "Innsmouth Horror",
    "lore": "Nyogtha first appeared in The Salem Horror (1937), written by Henry Kuttner.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 12,
        "combatRating": {
          "display": "-8",
          "type": "fixed",
          "modifier": -8
        },
        "defenses": [],
        "defenseText": "None",
        "worshippers": "Nyogtha is worshipped by a variety of beings in return for teaching them spells. Witches, Warlocks, and Ghouls gain +1 toughness and Physical Resistance.",
        "powerName": "Tendrils from Below",
        "power": "While Nyogtha stirs in its slumber, at the start of the game, place the Tendril of Nyogtha monster token on this sheet. Each time a monster (but not a gate) appears during an encounter, the Tendril of Nyogtha is encountered instead. If it is defeated, return the Tendril to this sheet. It cannot be claimed as a trophy.",
        "attack": "The first player is pulled underground. Roll a die. On a success, that player escapes with their life; otherwise they are devoured.\n\nNyogtha's combat rating is -3 for the first player only."
      }
    ]
  },
  {
    "name": "Quachil Uttaus",
    "key": "quachil-uttaus",
    "boxedSet": "Innsmouth Horror",
    "lore": "Quachil Uttaus first appeared in The Treader of the Dust (1935), written by Clark Ashton Smith.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 12,
        "combatRating": {
          "display": "-3",
          "type": "fixed",
          "modifier": -3
        },
        "defenses": [
          "physical-immunity",
          "magical-immunity"
        ],
        "defenseText": "Physical Immunity, Magical Immunity",
        "worshippers": "Quachil Uttaus is worshipped by wizards who call upon him for immortality. Warlocks gain +2 toughness and Endless. Investigators do not collect clue tokens from defeating a Warlock unless they can ignore the Endless ability.",
        "powerName": "Footprints in the Dust",
        "power": "While Quachil Uttaus stirs in his slumber, shuffle the three dust decks at the start of the game and place them facedown on this sheet.\n\nAt the start of each turn, the first player must either spend 2 clue tokens or draw a card from the lowest-numbered dust deck that still has undrawn cards in it.",
        "startOfBattle": "All Allies are returned to the box.",
        "attack": "Quachil Uttaus touches the first player, who ages to dust and blows away in the wind. The first player is devoured."
      }
    ],
    "rulesNotes": [
      {
        "kind": "clarification",
        "text": "When Quachil Uttaus is the Ancient One, the first player marker is only moved when the first player is devoured. If a player spends Clue tokens to avoid drawing a Dust card, he still keeps the first player marker."
      }
    ]
  },
  {
    "name": "Rhan-Tegoth",
    "key": "rhan-tegoth",
    "boxedSet": "Innsmouth Horror",
    "lore": "Rhan-Tegoth first appeared in The Horror in the Museum (1932), ghost-written by H.P. Lovecraft for Hazel Heald.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 11,
        "combatRating": {
          "display": "-4",
          "type": "fixed",
          "modifier": -4
        },
        "defenses": [
          "physical-immunity"
        ],
        "defenseText": "Physical Immunity",
        "worshippers": "Rhan-Tegoth is worshipped by the twisted creatures of the tundra. Gnoph-Keh gain Nightmarish 1.",
        "powerName": "Insatiable Hunger",
        "power": "While Rhan-Tegoth stirs in his slumber, any Cultist that is drawn from the monster cup is placed on this sheet. The terror level then increases by 1, a doom token is added to the doom track, and a replacement monster is drawn.",
        "startOfBattle": "Rhan-Tegoth gains 2 extra doom tokens for each Cultist on this sheet.",
        "attack": "Rhan-Tegoth drains the blood from a victim. The investigator with the highest current Stamina (first player breaks ties) rolls dice equal to his Stamina and loses 1 Stamina for each failed die. For each Stamina Rhan-Tegoth drains, the investigators must inflict one extra success on him in order to defeat him."
      }
    ],
    "rulesNotes": [
      {
        "kind": "clarification",
        "text": "Stamina loss inflicted by Rhan-Tegoth's attack cannot be prevented or reduced by any means."
      }
    ]
  },
  {
    "name": "Zhar",
    "key": "zhar",
    "boxedSet": "Innsmouth Horror",
    "lore": "Zhar first appears in Lair of the Star Spawn (1932), written by August Derleth and Mark Schorer.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 11,
        "combatRating": {
          "display": "-3",
          "type": "fixed",
          "modifier": -3
        },
        "defenses": [
          "special"
        ],
        "defenseText": "Special",
        "worshippers": "Zhar is worshipped by an evil tribe. Tcho-tchos and Tcho-tcho Priests gain Overwhelming 1",
        "powerName": "The Twin Horror",
        "power": "When a new gate opens, roll two dice. If doubles are rolled, immediately draw and resolve a mythos card.\n\nIf Zhar awakens, it must be defeated twice. After removing its last doom token for the first time, any further successes from that attack are ignored and Zhar's doom track is refilled.",
        "startOfBattle": "Zhar gains Magical Immunity. Once Zhar has been defeated once, this becomes Physical Immunity instead.",
        "attack": "Each investigator is in turn wrapped in a tentacle, then crushed. If no player has the Zhar token, give the Zhar token to the first player. That player then loses one hand for use in combat. If an investigator already has the Zhar token he is devoured. The first player marker does not get passed until its current holder is devoured."
      }
    ]
  },
  {
    "name": "Daoloth",
    "key": "daoloth",
    "boxedSet": "Promotional",
    "lore": "Daoloth first appeared in The Render of the Veils (1964), written by Ramsey Campbell.",
    "sheets": [
      {
        "key": "standard",
        "label": "Standard",
        "isDefault": true,
        "doomTrack": 12,
        "combatRating": {
          "display": "-4",
          "type": "fixed",
          "modifier": -4
        },
        "defenses": [
          "special"
        ],
        "defenseText": "Special (See Attack)",
        "worshippers": "The followers of Daoloth are astronomers that can see into both the past and the future. When Cultists move, they do not follow normal movement rules. Instead, they move to the nearest investigator in a street area or unstable location.",
        "powerName": "The Render of Veils",
        "power": "While Daoloth stirs in his slumber, immediately after each monster surge, replace all open gates, one at a time. Do this by reshuffling the gate into the pile of gate markers and drawing a new one to take its place. Then, discard all explored markers. This is not treated as a new gate opening (no doom tokens are added to the doom track and no monsters are drawn). Investigators are not drawn through these gates until the Arkham Encounter phase.",
        "attack": "Draw a Mythos Card. If the card instructs the players to place a gate in a location that does not have an elder sign on it, the first player is devoured. If the card instructs players to place a gate in a location that does have an elder sign on it, remove the elder sign from that location. If the Mythos Card does not instruct players to place a gate in a location, 1 token is placed back on Daoloth's doom track if it is not full."
      }
    ]
  }
]
