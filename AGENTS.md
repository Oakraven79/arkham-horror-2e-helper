# Agent Rules Contract

This repository implements a helper for Arkham Horror Second Edition. Game
rules are product requirements, not suggestions.

## Mandatory reading

Before changing game state, phase flow, counters, limits, movement, encounters,
gates, monsters, investigators, Mythos resolution, expansion behavior, or
rules-facing UI:

1. Read [RULES_INDEX.md](./RULES_INDEX.md).
2. Read the relevant sections of [RULES_CORE.md](./RULES_CORE.md) and
   [RULES_EXPANSIONS.md](./RULES_EXPANSIONS.md).
3. Check [RULES_FAQ_AND_TIMING.md](./RULES_FAQ_AND_TIMING.md) for a later
   clarification.
4. Preserve [RULES_INVARIANTS.md](./RULES_INVARIANTS.md).
5. Add or update cases in [RULES_TEST_MATRIX.md](./RULES_TEST_MATRIX.md).

Purely visual changes do not require reading every rules file, but they must not
hide required choices, change rules terminology, or imply an illegal action.

## Authority

Use this precedence when sources appear to disagree:

1. Applicable errata or clarification in
   `rulebooks/complete_arkham_horror_faq.pdf`.
2. Applicable card, investigator, Ancient One, Herald, Guardian, Institution,
   or other component text for the specific situation.
3. The rulebook for an enabled expansion.
4. `rulebooks/arkham_horror_core_rulebook.pdf`.
5. The Markdown references in the repository.
6. `rulebooks/ArkhamHorror_v7.6.pdf`, which is an unofficial player aid.

This ordering is the repository's interpretation policy. When a rule remains
ambiguous, do not silently choose an interpretation. Preserve a manual choice,
record the ambiguity, and cite the competing source pages.

## Change policy

- Never simplify a rule by deleting its timing window, exception, player
  choice, or expansion condition.
- Never use the modified expansion-board player count where the FAQ requires
  the actual investigator count.
- Never treat the unofficial v7.6 player aid as authority over an official
  source.
- Model card text as data or a scoped effect. Do not turn one card's exception
  into a global rule.
- Keep automated changes reversible. The physical board remains authoritative,
  so users must be able to correct tracked state.
- Preserve the ordered event sequence. If two effects are officially
  simultaneous, expose an ordering choice and let the first player decide when
  the players cannot agree.
- A change to a derived limit, phase transition, gate outcome, monster
  placement, investigator status, win condition, or awakening condition needs a
  focused regression test.
- Cite rules in code comments or tests as `source filename, PDF p. N` when the
  behavior is not obvious.

## Scope of these references

The references summarize general and expansion-system rules. They do not
reproduce every encounter, investigator, item, spell, monster, Ancient One,
Herald, Guardian, Institution, Personal Story, or Mythos card. When a feature
implements a named component, inspect that component and the relevant FAQ entry
in addition to these files.
