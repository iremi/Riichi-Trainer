# Honitsu — decision rules

Reference knowledge for a honitsu routing/calling trainer. Plain text, no presentation.
Source: pro walkthrough (Tenhou-rank VTuber) on 混一色, cross-checked against Gentaro's
tile-efficiency course.

---

## 0. The frame

Honitsu is not a hand type you notice you're in. It is one of **three roads** you choose
between in the first few turns:

| Road | Japanese | When |
|---|---|---|
| **Riichi** | リーチ | Default. Reachable without forcing the hand out of shape. |
| **Hedge** | 両天秤 | Could naturally become either. Play efficiently, keep the shift route alive. |
| **Honitsu** | 混一色 | Hand is scattered, or honitsu multiplies it into a mangan. |

Yaku strength order: **riichi > yakuhai > honitsu**. Riichi is nominally 1 han but ippatsu,
ura and tsumo make it worth ~2+ in practice, which is why it outranks honitsu even though
honitsu's base value is higher.

Honitsu earns a permanent slot in the decision tree because without dora there are only two
routes to a big hand: riichi or honitsu. The open 2+ han yaku are honitsu, junchan and
toitoi — junchan needs dora to reach mangan and has brutal shape restrictions, toitoi
destroys your defense. **Honitsu is effectively the only open road to a big hand.**

---

## 1. The value gate

Bare open honitsu is **2 han ≈ 2,000 points**. That is not a big hand. The gate question is
always: *what is my second source of han?*

| Open honitsu, plus… | Han | Non-dealer ron |
|---|---|---|
| nothing | 2 | ~2,000–2,600 |
| one yakuhai (dragon, or seat/round wind) | 3 | ~3,900–5,200 |
| two yakuhai (e.g. haku + chun) | 4 | 8,000 (mangan) |
| one yakuhai + a dora or red five | 4 | ~7,700–8,000 |

Each extra han roughly **doubles** the payout. The first stacked han is therefore worth more
than any wait improvement you could engineer.

### The gate applies asymmetrically — important

What you are really testing is *what you are paying*.

- **When you'd break good blocks for it (trigger B below):** the gate is a **hard veto**.
  Never cut a ryanmen or a finished set for a 2-han hand.
- **When the hand had no other route anyway (trigger A below):** the gate is **advisory
  only**. A 2,000-point honitsu from a hand that would otherwise finish noten is a gain,
  because you paid nothing. Here the gate decides *how hard to push*, not whether to start:
  take the free calls, keep the honors, fold early.

### A pair is not yet a han

Two dragon pairs is a **ceiling** of 4 han, not a floor. Haku-haku is worth zero until it's
haku-haku-haku. Land both → 4 han; land one → 3 han (~3,900–5,200), still fine. A **dora or
red five is the more reliable second source**, because it's already in hand rather than
needing to complete.

---

## 2. Stop patterns — looks like honitsu, isn't

Prime directive: **if you can reach riichi without forcing the hand out of shape, take
riichi.** These three fool people because one suit looks heavy, but each already contains a
free head start toward a closed hand.

### Stop 1 — an honor tile arrives as a triplet (字牌が暗刻)
One set is already finished *and* it carries a yaku. Riichi + yakuhai + ura reaches mangan
with nothing forced. No reason to chase honitsu.

### Stop 2 — ryanmen in more than one other suit (他色の両面が複数)
Going straight has a far higher win rate. Ponning the yakuhai for 1,000 is also acceptable —
a cheap fast hand still ends someone's dealership. Honitsu here means cutting both ryanmen
and rebuilding a wait from nothing.

### Stop 3 — a finished set sits in another suit (他色で面子完成)
Breaking a completed set is the most expensive thing you can do to a hand. Play it naturally;
the value often arrives anyway.

**Common thread:** honitsu is expensive. It costs finished blocks, good shapes, often two
whole suits. That price only makes sense when you're being paid for it.

---

## 3. Go triggers — commit

### Trigger A — the hand is scattered and riichi is hopeless (バラバラの配牌)
Where honitsu shines brightest, with two separate upsides:
1. **Calls advance a hand that couldn't advance alone.**
2. **You carry unwanted honors the whole way**, so when a riichi lands you can still fold —
   unusual for an open hand.

You can pon **guest winds** without breaking honitsu: winds and dragons all count as "one
suit" for this yaku. Honors are simultaneously yaku material, value, and defense.

### Trigger B — honitsu turns the hand into a mangan (満貫が見込める)
Two yakuhai pairs, or a red five in the suit, and the arithmetic changes completely. Straight,
the hand is worth 1,000–2,000. Forced into honitsu it's 8,000. **"It's a mangan" alone
justifies a worse wait.** Trigger B **overrides Stop 2** — the rule was never "don't break
ryanmen," it was "don't break ryanmen for a *cheap* honitsu."

Once the hand is mangan-class, **stop optimising the wait** and push whatever you're given.
A bad wait on 8,000 beats a good wait on 2,000.

The pattern to burn in: **honitsu 2 + anything worth 2 more = mangan**, and honors you were
holding anyway are the cheapest place to find those 2 han.

---

## 4. Hedging (両天秤)

For hands that could naturally reach either road. Not a compromise — an option you hold and
**pay for**.

1. **Default to efficiency.** You are not playing honitsu yet.
2. **Watch for the trigger:** a floating tile attaches to your honitsu suit, or an honor pairs
   up. That's the shift point.
3. **Pay for the option.** You may narrow tenpai acceptance — giving up a perfect iishanten,
   for instance — to keep the route alive.

Rule of thumb: *tenpai first → take it. Trigger first → shift.*
(テンパったら素直に取るが、その前に引ければホンイツへ移行する)

**What "paying" really means.** In the canonical example the player holds 2s3s and draws a 3s,
making 233s — a genuinely useful shape with a backup pair and an upgrade path. The efficient
discard is the lone haku. **Correct play is to discard the 3s and keep the haku.** The lesson
is not "discard junk to keep your option"; it's **decline a real improvement to keep the value
route open** (打点をおう). If optionality only ever costs you worthless tiles, you aren't
hedging — you're holding a floater until it becomes inconvenient.

The same trade appears outside honitsu: holding a shape slightly worse than optimal because a
tanyao, sanshoku, or junchan upgrade is one tile away.

---

## 5. Calling policy once committed

Honitsu does not reach tenpai unless the **count of tiles in your suit goes up**. Hence:
**もらえるものは全部鳴く** — call anything you're offered.

- **Obvious calls:** in-suit tiles completing or extending a block; any honor that pairs.
- **Calls that "don't make sense":** middle tiles in your suit that don't visibly improve a
  block are **still worth calling**. You need volume, and a called tile is a suit tile you
  never have to draw.
- **Guest winds are free:** no han, but no honitsu break either, and the hand advances.

### Kuinobashi (食い伸ばし) — the must-know technique

Chi **using tiles from a block that's already finished**, turning four tiles into a locked set
plus a live ryanmen. Looks like breaking something; you're gaining a block for free.

| Shape | Call | Result |
|---|---|---|
| 4556m | chi the 7m with 5m6m | 45m ryanmen + 567m set |
| 2234m | chi the 3m with 2m4m | 23m ryanmen + 234m set |
| 6789m | chi the 7m with 8m9m | 67m ryanmen + 789m set |

A call can also be correct while **not reducing shanten at all**. Example: holding 567m as a
finished run, you chi another 6m with the 5m and 7m. Shanten is unchanged, but you gained one
manzu tile from outside your hand and the spare 6m becomes a fifth-block seed (456m, 678m,
66m) where the locked run had nowhere to go. **Volume in the suit is worth paying for even
when it doesn't shorten the hand.**

---

## 6. The two calls that lose the hand

Two exceptions to "call everything." They are the same mistake from opposite angles: one
wrecks your shape, one wrecks your defense.

### Never 1 — the shape-wrecking call (悪い食いのばし)
Converts a good shape into a kanchan or penchan. **Same starting shapes as kuinobashi, called
wrong:**

| Shape | Bad call | Result |
|---|---|---|
| 4556m | pon the 5m | 4-6m **kanchan** |
| 6789m | chi the 5m with 6m7m | 8-9m **penchan** |

Take these only if it's clear you won't tenpai otherwise, and reluctantly. The whole skill is
that identical four tiles yield opposite outcomes depending on which tiles you call with.

### Never 2 — bakahon (バカホン, "idiot honitsu")
Setup: honitsu-only, no yakuhai, 2 han, ~2,000 points. You pon your spare honors to widen the
hand — then a riichi lands and you hold a cheap hand with **nothing safe to throw**. Worst
position in the game: forced to feed a big hand while chasing a small one.

Leave the honor pair as fold stock. That defensive reserve *is* why scattered-hand honitsu was
attractive in the first place.

**Exception:** if the wind is your **seat or round wind**, the pon adds a han, putting you at
3+ and mangan-adjacent. At that value, burning defense to push is correct. The rule isn't
"protect your safe tiles" — it's **"don't sell your safe tiles cheaply."**

---

## 7. Decision order

- **Q0** — If I build honitsu, what's my second source of han? None → never pay good blocks
  for it. Proceed only if the hand had no other route, and then push cheaply.
- **Q1** — Can I reach riichi without forcing the hand out of shape? Honor triplet, multi-suit
  ryanmen, or a finished set elsewhere → **yes, take riichi, stop.**
- **Q2** — Is the hand actually hopeless? → **commit** (trigger A).
- **Q3** — Does honitsu make this a mangan? → **commit, and pay ryanmen for it** (trigger B).
  Overrides Q1.
- **Q4** — Could it plausibly go either way? → **hedge.**
- **Q5** — Committed: call everything in-suit, kuinobashi to extend finished blocks, guest
  winds are free.
- **Q6** — Before each call: does it leave me worse-shaped? does it leave me with no safe tiles
  on a cheap hand? Either yes → pass, unless the hand is 3+ han.

---

## 8. Situational notes

**The loudness tax.** Everyone can read a honitsu from your discards. The suit feed shuts off
and so does the honor feed. Speed through calls matters more here than in any other hand type
— get there before the table adjusts. This also weakens the usual "honor waits are easy to win
on" logic, because opponents start *hoarding* honors against you.

**Live play (no tile counter).** Online you can check how much of a suit is gone; at the table
you can't. Honitsu is the hand type most punished by a dead suit, so read availability off the
discards and bias toward committing **earlier** live, while the feed is open, rather than
confirming first and calling late. Humans at one table also spot a one-suit discard pattern
faster than a random online lobby, so the shutoff comes sooner. Same conclusion: speed over
polish.

---

## 9. Gentaro cross-references

| Topic | Where | Relevance |
|---|---|---|
| Honitsu vs. speed, explicitly | **Q8-4** | A hand ambiguous between the two; answer is "it depends" — 6-block to keep the honitsu route, 5-block to cut the weakest block for fastest tenpai. This *is* the routing decision. |
| Block hierarchy | **Section 6 table** | Yakuhai pair sits in the green zone; terminals and non-yakuhai pairs are excellent pon material. Trigger B read forward: two yakuhai pairs = two blocks that each carry a han. |
| Speed vs. value framing | **Q9-2, Q9-4** | Drills the habit of asking "speed or value?" before a discard. Hedging is the same question asked about a whole hand. |
| Confirm a yaku before calling | **Q9-1 – Q9-3** | The avoid-yaku-less-tenpai habit. Bakahon is getting the calling plan right and the value check wrong. |
| Shaping for calls | **Q4-2** | When you plan to call, discard the lone tile and keep the pairs — pairs are pon material. |
