# Honitsu trainer — build brief

## The two files

> **Implementation note:** `honitsu-items.json` now lives at `src/data/honitsu-items.json`,
> because Create React App can only bundle imports from inside `src/`. Edit it there; this
> folder keeps the reference prose.

| File | What it is | How to use it |
|---|---|---|
| `honitsu-rules.md` | The decision rules in plain prose. The "why". | **Reference, not content to display.** Read it to understand the domain and to write correct feedback. Do not paste sections into the UI. |
| `honitsu-items.json` | The drill item bank. 24 authored items. Moved to `src/data/`. | **This is the content.** Render items, score answers, show `rationale` as feedback. |

**Do not rebuild the cheatsheet.** A separate HTML reference document already exists and is not
part of this project. The deliverable here is a *drill tool*: show a problem, take an answer,
explain. If you find yourself writing long explanatory prose sections into the UI, stop — that
belongs in the rationale text of an item.

This tool is deliberately **separate from the existing tile-efficiency trainer**. Do not merge
them or share state.

---

## Tile notation

```
3m 5p 7s      number + suit (m = manzu, p = pinzu, s = souzu)
5mr           red five (renders as a normal "5" with a red glyph, NOT as "0")
E S W N       East South West North
P F C         haku (white) · hatsu (green) · chun (red)
```

Melds: `{ "tiles": [...], "called": <index>, "kind": "chi"|"pon" }`
Tiles are in **display order with the called tile first**, and `called` is its index — so
`{"tiles":["7m","5m","6m"],"called":0}` means a 7m was called using your 5m and 6m. Render the
called tile rotated 90°.

---

## Item schema

Every item, regardless of type, has:

- `id`, `type`, `difficulty` (1–5)
- `prompt` — the question text
- `hand` — `{ closed: [tiles], melds: [melds] }`
- `options[]` — each `{ id, label, correct }`, with **exactly one** `correct: true`
- `rationale` — the feedback string, shown after answering
- `rule`, `tags` — for filtering and progress tracking

Optional context fields, present where relevant: `seat_wind`, `round_wind`, `dora`, `turn`,
`offered` (the discarded tile in calling items), `drawn`, `result` / `result_if_wrong` (the hand
state after the call, useful for showing consequences), `han_if_completed`, `answer`, `note`.

**Scoring is uniform across all three types:** render prompt + hand + options, compare the
chosen option to `correct`, display `rationale`. Type only affects presentation.

---

## The three drill types

They are structurally different — give them **three separate modes**, not one shuffled deck.

**1. `routing` (9 items)** — a 13/14-tile hand, pick riichi / hedge / honitsu. Show seat and
round wind, since guest-wind status changes the answer. Note that item pairs are designed to
contrast: `r-09` and `r-10` have the same value picture and opposite answers; `r-02` and `r-05`
have the same shape family and opposite answers. If you shuffle, try to surface contrast pairs
in the same session.

**2. `calling` (9 items)** — a tile is offered; call it (and with which tiles) or pass. Several
items show only the relevant block rather than a full hand — respect the `note` field. Use
`result` / `result_if_wrong` to show the resulting shape after answering; seeing the kanchan you
would have been left with is most of the lesson.

**3. `value_gate` (6 items)** — count the han. Cheapest type to **generate procedurally**, and
worth doing: deal a lean suit plus random honors, resolve which honors are yakuhai against the
seat/round wind, add dora, and ask for the han count. If you build a generator, the authored
items serve as the correctness spec — match their arithmetic.

---

## Known scope problem, and the ask

Honitsu routing decisions happen **at the deal**, so unlike a defense trainer there is nothing
to harvest from replays. 24 authored items will be memorised within a few sessions — the user
will start recognising "the two-dragon-pairs one" rather than reading the hand.

Handle this however you think is best. Some directions, not prescriptions:

- Procedurally generate `value_gate` items (easiest win — needs a yakuhai/dora resolver, no
  shanten counter).
- Generate `routing` items, which needs a shanten counter plus a rough value estimator, so the
  tool can classify a random hand into the three roads itself.
- Randomise option order and, where it doesn't break the item, mirror hands across suits
  (manzu → pinzu → souzu) to break surface recognition while preserving the logic.
- Track per-`rule` accuracy rather than per-item, so progress means "I get bakahon right"
  rather than "I remember item c-07".

Prefer building something small that works over something complete that doesn't.

---

## Rules the tool's feedback must not get wrong

These are the two places where a plausible-sounding simplification is actually incorrect:

1. **The value gate is asymmetric.** When you would break good blocks for honitsu, 2 han is a
   *hard veto*. When the hand had no other route anyway, 2 han is *advisory* — it sets how hard
   to push, not whether to start. Items `r-09` and `r-10` exist specifically to teach this;
   don't let generated items collapse it into "always avoid cheap honitsu."

2. **A pair is not a han.** Two dragon pairs is a ceiling of 4 han, not a current value. Item
   `v-05` tests this. Any generated value item must count *completed* triplets only.

Full detail on both is in `honitsu-rules.md` sections 1 and 3.
