import { calculateStandardShanten } from './ShantenCalculator';
import { calculateUkeire, calculateDiscardUkeire } from './UkeireCalculator';
import { convertRedFives } from './TileConversions';

/**
 * The analysis behind the live honitsu trainer.
 *
 * Every turn the hand is evaluated twice: once normally (the speed line) and
 * once toward a one-suit hand (the honitsu line). Showing both with their real
 * numbers is the point, because the routing decision is exactly the trade
 * between them.
 *
 * The honitsu line needs no separate engine. Shanten is 8 - 2*sets - partials
 * - pair computed over a counts array, so masking the array down to one suit
 * plus the honors yields the shanten of the honitsu hand directly. Masking the
 * remaining tiles the same way makes the existing ukeire code honitsu-aware.
 */

/** @readonly The base tile index of each suit. */
export const SUIT_BASES = [0, 10, 20];

/** @readonly Names for each suit base, used in explanations. */
export const SUIT_NAMES = { 0: "manzu", 10: "pinzu", 20: "souzu" };

/** @readonly A meld is worth two shanten, the same as any completed set. */
const SHANTEN_PER_MELD = 2;

/**
 * Whether a tile belongs to a honitsu built on the given suit. Honors always do.
 * @param {TileIndex} tile The tile to test.
 * @param {number} suitBase The base index of the honitsu suit.
 * @returns {boolean} True if the tile can be part of that honitsu.
 */
export function isInHonitsu(tile, suitBase) {
    if (tile >= 31) return true;
    return Math.floor(tile / 10) * 10 === suitBase;
}

/**
 * Copies a counts array, keeping only one suit and the honors.
 * @param {TileCounts} counts The counts to mask.
 * @param {number} suitBase The base index of the suit to keep.
 * @returns {TileCounts} The masked counts.
 */
export function maskToSuit(counts, suitBase) {
    let masked = Array(counts.length).fill(0);

    for (let i = suitBase; i < suitBase + 10; i++) {
        masked[i] = counts[i];
    }

    for (let i = 31; i < 38; i++) {
        masked[i] = counts[i];
    }

    return masked;
}

/**
 * Resolves a dora indicator into the tile that is actually dora.
 * @param {TileIndex} indicator The dora indicator.
 * @returns {TileIndex} The dora tile.
 */
export function doraFromIndicator(indicator) {
    // Winds cycle east to north, dragons cycle white to red, both wrapping.
    if (indicator >= 31) {
        if (indicator <= 34) return indicator === 34 ? 31 : indicator + 1;
        return indicator === 37 ? 35 : indicator + 1;
    }

    let base = Math.floor(indicator / 10) * 10;
    let value = indicator % 10;
    // A red five indicates whatever a normal five would.
    if (value === 0) value = 5;

    return value === 9 ? base + 1 : base + value + 1;
}

/**
 * Counts a tile in the hand and melds together, treating red fives as fives.
 * @param {TileCounts} hand The closed hand.
 * @param {Object[]} melds The called sets.
 * @param {TileIndex} tile The tile to count, already normalized.
 * @returns {number} How many the player holds.
 */
function totalOf(hand, melds, tile) {
    let normalized = convertRedFives(hand);
    let count = normalized[tile];

    for (let meld of melds) {
        for (let meldTile of meld.tiles) {
            if (convertRedFives(meldTile) === tile) count++;
        }
    }

    return count;
}

/**
 * Estimates what a honitsu in the given suit would be worth.
 *
 * Reports the value twice on purpose. A pair of dragons is not a han until it
 * is a triplet, so `han` counts only what is complete while `ceiling` counts
 * what the pairs could become. Collapsing the two is the single most common
 * miscount in the whole subject.
 * @param {TileCounts} hand The closed hand.
 * @param {Object[]} melds The called sets.
 * @param {number} suitBase The base index of the honitsu suit.
 * @param {Object} context The seat wind, round wind and dora tile.
 * @returns {Object} The value estimate.
 */
export function estimateHonitsuValue(hand, melds, suitBase, context) {
    let open = melds.length > 0;

    // One suit and no honors at all is chinitsu, which is worth far more than
    // the honitsu it grew out of. Scoring it as honitsu would understate the
    // best outcome the hand still has.
    let honorCount = 0;
    for (let honor = 31; honor < 38; honor++) {
        honorCount += totalOf(hand, melds, honor);
    }
    let chinitsu = honorCount === 0;

    let han = chinitsu ? (open ? 5 : 6) : (open ? 2 : 3);
    let ceiling = han;
    let sources = [chinitsu
        ? (open ? "chinitsu 5" : "chinitsu (closed) 6")
        : (open ? "honitsu 2" : "honitsu (closed) 3")];
    let pending = [];

    for (let honor = 31; honor < 38; honor++) {
        let value = 0;
        if (honor >= 35) value = 1;
        if (honor === context.seatWind) value += 1;
        if (honor === context.roundWind) value += 1;
        if (value === 0) continue;

        let held = totalOf(hand, melds, honor);

        if (held >= 3) {
            han += value;
            ceiling += value;
            sources.push(`${honorName(honor)} ${value}`);
        } else if (held === 2) {
            // A pair is a ceiling, not a han.
            ceiling += value;
            pending.push(`${honorName(honor)} ${value}`);
        }
    }

    // Dora and red fives only count if they survive into the finished hand, so
    // anything outside the honitsu suit is worth nothing to this line.
    if (context.dora !== undefined && context.dora !== null && isInHonitsu(context.dora, suitBase)) {
        let doraCount = totalOf(hand, melds, context.dora);

        if (doraCount > 0) {
            han += doraCount;
            ceiling += doraCount;
            sources.push(`dora ${doraCount}`);
        }
    }

    // A suit's red five is stored at the suit's own base index.
    let reds = hand[suitBase] + melds.reduce((total, meld) =>
        total + meld.tiles.filter((tile) => tile === suitBase).length, 0);

    if (reds > 0) {
        han += reds;
        ceiling += reds;
        sources.push(`red five ${reds}`);
    }

    return { han, ceiling, sources, pending, open };
}

/**
 * Estimates what the hand is worth played straight.
 * @param {TileCounts} hand The closed hand.
 * @param {Object[]} melds The called sets.
 * @param {Object} context The seat wind, round wind and dora tile.
 * @returns {Object} The value estimate.
 */
export function estimateSpeedValue(hand, melds, context) {
    let open = melds.length > 0;
    let han = 0;
    let sources = [];

    if (!open) {
        han += 1;
        sources.push("riichi 1");
    }

    for (let honor = 31; honor < 38; honor++) {
        let value = 0;
        if (honor >= 35) value = 1;
        if (honor === context.seatWind) value += 1;
        if (honor === context.roundWind) value += 1;
        if (value === 0) continue;

        if (totalOf(hand, melds, honor) >= 3) {
            han += value;
            sources.push(`${honorName(honor)} ${value}`);
        }
    }

    if (context.dora !== undefined && context.dora !== null) {
        let doraCount = totalOf(hand, melds, context.dora);
        if (doraCount > 0) {
            han += doraCount;
            sources.push(`dora ${doraCount}`);
        }
    }

    let redCount = 0;
    for (let tile of [0, 10, 20]) {
        redCount += hand[tile];
    }
    for (let meld of melds) {
        redCount += meld.tiles.filter((tile) => tile < 30 && tile % 10 === 0).length;
    }
    if (redCount > 0) {
        han += redCount;
        sources.push(`red five ${redCount}`);
    }

    // An open hand with no yaku cannot win at all, however fast it is.
    let yakuless = open && !sources.some((source) => !source.startsWith("dora") && !source.startsWith("red"));

    return { han, sources, open, yakuless };
}

/**
 * The short name of an honor tile, matching the item bank's prose.
 * @param {TileIndex} honor The honor tile.
 * @returns {string} The name.
 */
function honorName(honor) {
    return { 31: "East", 32: "South", 33: "West", 34: "North", 35: "haku", 36: "hatsu", 37: "chun" }[honor];
}

/**
 * Pulls the obvious blocks out of one suit, so the stop patterns can be
 * detected. Complete sets are taken first so a run is not also counted as the
 * two ryanmen it contains.
 * @param {TileCounts} counts The hand, already red-five normalized.
 * @param {number} base The base index of the suit to scan.
 * @returns {Object} How many complete sets and ryanmen the suit holds.
 */
function extractBlocks(counts, base) {
    let work = counts.slice();
    let completeSets = 0;
    let ryanmen = 0;

    for (let i = base + 1; i < base + 10; i++) {
        while (work[i] >= 3) {
            work[i] -= 3;
            completeSets++;
        }
    }

    for (let i = base + 1; i <= base + 7; i++) {
        while (work[i] > 0 && work[i + 1] > 0 && work[i + 2] > 0) {
            work[i]--; work[i + 1]--; work[i + 2]--;
            completeSets++;
        }
    }

    // Two-sided shapes only: 1-2 and 8-9 are penchan and are not worth protecting.
    for (let i = base + 2; i <= base + 7; i++) {
        while (work[i] > 0 && work[i + 1] > 0) {
            work[i]--; work[i + 1]--;
            ryanmen++;
        }
    }

    return { completeSets, ryanmen };
}

/**
 * Evaluates the honitsu line for one suit.
 * @param {TileCounts} hand The closed hand.
 * @param {Object[]} melds The called sets.
 * @param {TileCounts} remainingTiles The tiles the player cannot see.
 * @param {number} suitBase The suit to evaluate.
 * @param {Object} context The seat wind, round wind and dora tile.
 * @returns {Object|null} The line, or null if a call has already killed it.
 */
function evaluateHonitsuLine(hand, melds, remainingTiles, suitBase, context) {
    // A meld outside the suit kills that honitsu permanently.
    for (let meld of melds) {
        for (let tile of meld.tiles) {
            if (!isInHonitsu(tile, suitBase)) return null;
        }
    }

    let masked = maskToSuit(hand, suitBase);
    let maskedRemaining = maskToSuit(remainingTiles, suitBase);
    let offset = melds.length * SHANTEN_PER_MELD;

    let shanten = calculateStandardShanten(masked) - offset;
    let discardUkeire = calculateDiscardUkeire(masked, maskedRemaining, calculateStandardShanten);
    let offSuitUkeire = calculateUkeire(masked, maskedRemaining, calculateStandardShanten);

    // Discarding a tile the honitsu does not use leaves the honitsu hand
    // untouched, so every off-suit discard scores the same as doing nothing.
    for (let tile = 0; tile < hand.length; tile++) {
        if (hand[tile] > 0 && !isInHonitsu(tile, suitBase)) {
            discardUkeire[tile] = offSuitUkeire;
        }
    }

    let tilesInSuit = 0;
    for (let tile = 0; tile < hand.length; tile++) {
        if (hand[tile] > 0 && isInHonitsu(tile, suitBase)) tilesInSuit += hand[tile];
    }

    return {
        suit: suitBase,
        shanten,
        ukeire: discardUkeire,
        tilesInSuit,
        value: estimateHonitsuValue(hand, melds, suitBase, context)
    };
}

/**
 * Picks the discard a line wants: the most acceptance, and where that ties, the
 * tile that costs the other line least.
 * @param {UkeireObject[]} ukeire The per-discard acceptance for this line.
 * @param {TileCounts} hand The closed hand.
 * @param {UkeireObject[]} tieBreak The other line's acceptance, used to break ties.
 * @returns {TileIndex} The tile to discard.
 */
function pickDiscard(ukeire, hand, tieBreak) {
    let best = -1;

    for (let tile = 0; tile < hand.length; tile++) {
        if (hand[tile] === 0) continue;
        if (best < 0) { best = tile; continue; }

        if (ukeire[tile].value > ukeire[best].value) {
            best = tile;
        } else if (ukeire[tile].value === ukeire[best].value && tieBreak) {
            // Same acceptance for this line, so give up the least elsewhere.
            if (tieBreak[tile].value < tieBreak[best].value) best = tile;
        }
    }

    return best;
}

/**
 * Decides which road the hand is on, following the decision order in the rules:
 * value gate, then the stop patterns, then the go triggers, then hedging.
 * @param {Object} analysis The speed and honitsu lines.
 * @param {TileCounts} hand The closed hand.
 * @param {Object[]} melds The called sets.
 * @returns {Object} The verdict and the reason for it.
 */
function classifyRoad(analysis, hand, melds) {
    let { speed, honitsu } = analysis;
    let normalized = convertRedFives(hand);

    if (!honitsu) {
        return { road: "riichi", reason: "noHonitsu" };
    }

    // Once a call has been made the hand is committed; the only question left
    // is whether it can still win at all.
    if (melds.length > 0) {
        let honitsuAlive = honitsu.shanten <= speed.shanten + 2;
        return {
            road: honitsuAlive ? "honitsu" : "riichi",
            reason: honitsuAlive ? "committed" : "openNoYaku",
            suit: honitsu.suit
        };
    }

    let offSuitRyanmen = 0;
    let offSuitSets = 0;
    for (let base of SUIT_BASES) {
        if (base === honitsu.suit) continue;
        let blocks = extractBlocks(normalized, base);
        offSuitRyanmen += blocks.ryanmen;
        offSuitSets += blocks.completeSets;
    }

    let honorTriplet = false;
    for (let honor = 31; honor < 38; honor++) {
        if (normalized[honor] >= 3) honorTriplet = true;
    }

    let cost = honitsu.shanten - speed.shanten;

    // Committing to honitsu means calling for it, so the gate has to be judged
    // on what an OPEN honitsu would be worth. Scoring the closed value here
    // would make every hand look like a mangan, because a closed honitsu is
    // already 3 han before anything is stacked on it.
    let openCeiling = honitsu.value.ceiling - (honitsu.value.open ? 0 : 1);
    let detail = { han: honitsu.value.han, ceiling: honitsu.value.ceiling, openCeiling, cost };

    // Trigger B. Honitsu 2 plus anything worth 2 more is a mangan, and a mangan
    // justifies a worse wait, so this overrides the stop patterns.
    if (openCeiling >= 4) {
        return { road: "honitsu", reason: "triggerB", suit: honitsu.suit, detail };
    }

    // Stop patterns. Each already contains a head start toward a closed hand,
    // and honitsu would cost more than it pays.
    if (honorTriplet) return { road: "riichi", reason: "stop1", suit: honitsu.suit, detail };
    if (offSuitSets > 0) return { road: "riichi", reason: "stop3", suit: honitsu.suit, detail: { ...detail, offSuitSets } };
    if (offSuitRyanmen >= 2) return { road: "riichi", reason: "stop2", suit: honitsu.suit, detail: { ...detail, offSuitRyanmen } };

    // Trigger A. The gate is advisory rather than a veto when the hand has
    // nothing to pay with: honitsu that costs no shanten is free, and a
    // scattered hand was not reaching tenpai straight anyway.
    if (cost <= 0 || speed.shanten >= 4) {
        return { road: "honitsu", reason: "triggerA", suit: honitsu.suit, detail };
    }

    // The value gate as a veto: never pay good blocks for a hand worth nothing.
    if (openCeiling < 3 && cost > 1) {
        return { road: "riichi", reason: "valueGate", suit: honitsu.suit, detail };
    }

    return {
        road: "hedge", reason: "hedge", suit: honitsu.suit,
        detail: { han: honitsu.value.han, ceiling: honitsu.value.ceiling, cost }
    };
}

/**
 * Runs the full analysis of a hand: both lines, their preferred discards, and
 * the road the hand is on.
 * @param {TileCounts} hand The closed hand.
 * @param {Object[]} melds The called sets.
 * @param {TileCounts} remainingTiles The tiles the player cannot see.
 * @param {Object} context The seat wind, round wind and dora tile.
 * @returns {Object} The analysis.
 */
export function analyzeHand(hand, melds, remainingTiles, context) {
    let offset = melds.length * SHANTEN_PER_MELD;

    let speed = {
        shanten: calculateStandardShanten(hand) - offset,
        ukeire: calculateDiscardUkeire(hand, remainingTiles, calculateStandardShanten),
        value: estimateSpeedValue(hand, melds, context)
    };

    let lines = SUIT_BASES
        .map((base) => evaluateHonitsuLine(hand, melds, remainingTiles, base, context))
        .filter((line) => line !== null);

    // The best honitsu is the nearest one, and where two are equally near, the
    // one already holding more tiles.
    let honitsu = null;
    for (let line of lines) {
        if (!honitsu) { honitsu = line; continue; }
        if (line.shanten < honitsu.shanten) { honitsu = line; continue; }
        if (line.shanten === honitsu.shanten && line.tilesInSuit > honitsu.tilesInSuit) honitsu = line;
    }

    speed.best = pickDiscard(speed.ukeire, hand, honitsu ? honitsu.ukeire : null);
    if (honitsu) {
        honitsu.best = pickDiscard(honitsu.ukeire, hand, speed.ukeire);
    }

    let analysis = { speed, honitsu, alternatives: lines };
    analysis.road = classifyRoad(analysis, hand, melds);

    return analysis;
}

/**
 * Finds every call the player could make on a discarded tile.
 * @param {TileCounts} hand The closed hand.
 * @param {TileIndex} tile The discarded tile.
 * @param {boolean} fromKamicha Whether the discard came from the left player.
 * @returns {Object[]} The available calls.
 */
export function findCalls(hand, tile, fromKamicha) {
    let normalizedHand = convertRedFives(hand);
    let normalizedTile = convertRedFives(tile);
    let calls = [];

    if (normalizedHand[normalizedTile] >= 2) {
        calls.push({ kind: "pon", uses: [normalizedTile, normalizedTile] });
    }

    // Only the player to your left can be chi'd from, and only number tiles.
    if (fromKamicha && normalizedTile < 30) {
        let base = Math.floor(normalizedTile / 10) * 10;
        let value = normalizedTile % 10;

        for (let [first, second] of [[-2, -1], [-1, 1], [1, 2]]) {
            let a = value + first;
            let b = value + second;
            if (a < 1 || a > 9 || b < 1 || b > 9) continue;
            if (normalizedHand[base + a] > 0 && normalizedHand[base + b] > 0) {
                calls.push({ kind: "chi", uses: [base + a, base + b] });
            }
        }
    }

    return calls;
}

/**
 * Removes one physical copy of a tile from the hand, preferring a normal five
 * over a red one so the red five is kept for its han.
 * @param {TileCounts} hand The closed hand, modified in place.
 * @param {TileIndex} tile The normalized tile to remove.
 * @returns {TileIndex} The tile actually removed, or -1 if it was absent.
 */
export function takeTile(hand, tile) {
    if (hand[tile] > 0) {
        hand[tile]--;
        return tile;
    }

    if (tile < 30 && tile % 10 === 5 && hand[tile - 5] > 0) {
        hand[tile - 5]--;
        return tile - 5;
    }

    return -1;
}
