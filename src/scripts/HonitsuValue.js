import { randomInt, getRandomItem, shuffleArray } from './Utils';

/**
 * Han counting and procedural item generation for the honitsu value gate.
 *
 * This deliberately stops at the han count and a coarse value class. The drill
 * is about answering "where is my second source of han?", which needs no fu and
 * no point table.
 */

/** @readonly The tile indexes of the three dragons. */
const DRAGONS = [35, 36, 37];

/** @readonly The tile indexes of the four winds. */
const WINDS = [31, 32, 33, 34];

/** @readonly Short names for the honors, matching the item bank's own prose. */
const HONOR_NAMES = {
    31: "East", 32: "South", 33: "West", 34: "North",
    35: "haku", 36: "hatsu", 37: "chun"
};

/** @readonly The base tile index of each suit. */
const SUIT_BASES = [0, 10, 20];

/** @readonly The name each suit goes by in the generated prose. */
const SUIT_NAMES = { 0: "manzu", 10: "pinzu", 20: "souzu" };

/**
 * Whether a tile is an honor.
 * @param {TileIndex} tile The tile to check.
 * @returns {boolean} True if the tile is a wind or dragon.
 */
function isHonor(tile) {
    return tile >= 31;
}

/**
 * Converts a red five to its normal counterpart, leaving other tiles alone.
 * @param {TileIndex} tile The tile to normalize.
 * @returns {TileIndex} The normalized tile.
 */
function normalize(tile) {
    return (tile < 30 && tile % 10 === 0) ? tile + 5 : tile;
}

/**
 * Whether a tile is a red five.
 * @param {TileIndex} tile The tile to check.
 * @returns {boolean} True if the tile is a red five.
 */
function isRedFive(tile) {
    return tile < 30 && tile % 10 === 0;
}

/**
 * Whether a tile is a terminal or an honor.
 * @param {TileIndex} tile The tile to check.
 * @returns {boolean} True for 1s, 9s, winds and dragons.
 */
function isTerminalOrHonor(tile) {
    let normalized = normalize(tile);
    return isHonor(normalized) || normalized % 10 === 1 || normalized % 10 === 9;
}

/**
 * A sort key that places a red five where its value belongs rather than at the
 * suit's zero index, so 4m 0m 6m sorts as 4m 5m(red) 6m.
 * @param {TileIndex} tile The tile to key.
 * @returns {number} The sort key.
 */
export function tileSortKey(tile) {
    return isRedFive(tile) ? normalize(tile) - 0.5 : tile;
}

/**
 * Gets the coarse value class of a han count. Deliberately has no fu input, so
 * four han is described as mangan-class rather than as an exact score.
 * @param {number} han The han count.
 * @returns {Object} The value class, with a label and whether it reaches mangan.
 */
export function getValueClass(han) {
    if (han >= 13) return { label: "yakuman", mangan: true };
    if (han >= 11) return { label: "sanbaiman", mangan: true };
    if (han >= 8) return { label: "baiman", mangan: true };
    if (han >= 6) return { label: "haneman", mangan: true };
    if (han >= 5) return { label: "mangan", mangan: true };
    if (han >= 4) return { label: "mangan-class", mangan: true };
    if (han >= 3) return { label: "not mangan — a real hand, but not a big one", mangan: false };
    return { label: "not mangan — no second source of han", mangan: false };
}

/**
 * Counts the han of a completed honitsu hand described as blocks.
 * @param {Object[]} blocks The blocks, each { kind, tiles, open }.
 * @param {Object} context The seat wind, round wind and dora tile.
 * @returns {Object} The han total and the sources that produced it.
 */
export function countHan(blocks, context) {
    let sources = [];
    let han = 0;

    let isOpen = blocks.some((block) => block.open);
    han += isOpen ? 2 : 3;
    sources.push(isOpen ? "honitsu 2" : "honitsu (closed) 3");

    for (let block of blocks) {
        if (block.kind !== "triplet") continue;

        let tile = normalize(block.tiles[0]);
        if (DRAGONS.includes(tile)) {
            han += 1;
            sources.push(`${HONOR_NAMES[tile]} 1`);
            continue;
        }

        // A wind is only worth han to the player whose seat or round it is, and
        // a double wind scores both.
        if (tile === context.seatWind) {
            han += 1;
            sources.push(`${HONOR_NAMES[tile]} as your seat wind 1`);
        }

        if (tile === context.roundWind) {
            han += 1;
            sources.push(`${HONOR_NAMES[tile]} as the round wind 1`);
        }
    }

    let tiles = blocks.reduce((all, block) => all.concat(block.tiles), []);

    if (context.dora !== undefined && context.dora !== null) {
        let doraCount = tiles.filter((tile) => normalize(tile) === normalize(context.dora)).length;
        if (doraCount > 0) {
            han += doraCount;
            sources.push(`dora ${doraCount}`);
        }
    }

    let redCount = tiles.filter(isRedFive).length;
    if (redCount > 0) {
        han += redCount;
        sources.push(`red five ${redCount}`);
    }

    return { han, sources, open: isOpen };
}

/**
 * Checks whether a hand scores anything beyond honitsu, yakuhai, dora and red
 * fives. Generated items must not contain those, because their answer only
 * accounts for the four the drill teaches.
 * @param {Object[]} blocks The blocks, each { kind, tiles, open }.
 * @returns {boolean} True if an unaccounted yaku is present.
 */
function hasUncountedYaku(blocks) {
    let sets = blocks.filter((block) => block.kind !== "pair");
    let pair = blocks.find((block) => block.kind === "pair");

    // Toitoi: every set is a triplet.
    if (sets.every((set) => set.kind === "triplet")) return true;

    // Chanta and honroutou: every block contains a terminal or an honor.
    if (blocks.every((block) => block.tiles.some(isTerminalOrHonor))) return true;

    // Ittsuu: runs starting at 1, 4 and 7 in the same suit.
    let runStarts = sets.filter((set) => set.kind === "run").map((set) => normalize(set.tiles[0]) % 10);
    if ([1, 4, 7].every((start) => runStarts.includes(start))) return true;

    // Shousangen and daisangen: two dragon triplets plus a dragon pair, or three.
    let dragonTriplets = sets.filter((set) =>
        set.kind === "triplet" && DRAGONS.includes(normalize(set.tiles[0]))).length;
    if (dragonTriplets >= 3) return true;
    if (dragonTriplets === 2 && pair && DRAGONS.includes(normalize(pair.tiles[0]))) return true;

    // Sanankou needs three concealed triplets. The generator always opens at
    // least two blocks, which leaves too few concealed ones for it to apply.
    return false;
}

/**
 * Builds one candidate completed honitsu hand.
 * @returns {Object|null} The candidate, or null if the draw was invalid.
 */
function buildCandidate() {
    let suit = getRandomItem(SUIT_BASES);
    let roundWind = getRandomItem([31, 32]);
    let seatWind = getRandomItem(WINDS);

    // Tracks the four-copies-per-tile limit across the whole hand.
    let used = Array(38).fill(0);
    let take = (tile, count) => {
        used[normalize(tile)] += count;
        return used[normalize(tile)] <= 4;
    };

    let honorSetCount = randomInt(3);
    let pairIsHonor = honorSetCount === 0 ? true : randomInt(2) === 0;
    let suitSetCount = 4 - honorSetCount;

    // Honitsu needs at least one honor and at least one tile of the suit.
    if (suitSetCount < 1) return null;
    if (honorSetCount === 0 && !pairIsHonor) return null;

    let blocks = [];
    let honorPool = shuffleArray(DRAGONS.concat(WINDS));

    for (let i = 0; i < honorSetCount; i++) {
        let tile = honorPool[i];
        if (!take(tile, 3)) return null;
        blocks.push({ kind: "triplet", tiles: [tile, tile, tile], open: false });
    }

    for (let i = 0; i < suitSetCount; i++) {
        if (randomInt(4) === 0) {
            let value = randomInt(10, 1);
            let tile = suit + value;
            if (!take(tile, 3)) return null;
            blocks.push({ kind: "triplet", tiles: [tile, tile, tile], open: false });
        } else {
            let start = suit + randomInt(8, 1);
            if (!take(start, 1) || !take(start + 1, 1) || !take(start + 2, 1)) return null;
            blocks.push({ kind: "run", tiles: [start, start + 1, start + 2], open: false });
        }
    }

    let pairTile = pairIsHonor ? honorPool[honorSetCount] : suit + randomInt(10, 1);
    if (!take(pairTile, 2)) return null;
    blocks.push({ kind: "pair", tiles: [pairTile, pairTile], open: false });

    if (hasUncountedYaku(blocks)) return null;

    // Open two or three of the sets. Opening at least two also rules out
    // sanankou, which this drill does not count.
    let sets = blocks.filter((block) => block.kind !== "pair");
    let toOpen = shuffleArray(sets.slice()).slice(0, randomInt(2) === 0 ? 2 : 3);
    for (let set of toOpen) {
        set.open = true;
    }

    // A red five is only possible where a five of the suit already sits.
    if (randomInt(10) < 4) {
        for (let block of blocks) {
            let index = block.tiles.findIndex((tile) => tile === suit + 5);
            if (index >= 0) {
                block.tiles = block.tiles.slice();
                block.tiles[index] = suit;
                break;
            }
        }
    }

    let dora = pickDora(blocks, suit);

    return { blocks, suit, seatWind, roundWind, dora };
}

/**
 * Picks a dora tile, usually one that is actually in the hand so the count has
 * something to add.
 * @param {Object[]} blocks The hand's blocks.
 * @param {number} suit The base index of the hand's suit.
 * @returns {TileIndex} The dora tile.
 */
function pickDora(blocks, suit) {
    let tiles = blocks.reduce((all, block) => all.concat(block.tiles), []).map(normalize);

    // Two thirds of the time the dora is live, so the answer usually depends on
    // spotting it; the rest of the time there is nothing to add.
    if (randomInt(3) > 0) {
        return getRandomItem(tiles);
    }

    let absent = [];
    for (let value = 1; value < 10; value++) {
        if (!tiles.includes(suit + value)) absent.push(suit + value);
    }
    for (let honor of DRAGONS.concat(WINDS)) {
        if (!tiles.includes(honor)) absent.push(honor);
    }

    return absent.length > 0 ? getRandomItem(absent) : getRandomItem(tiles);
}

/**
 * Converts a block into the meld or closed tiles the renderer expects.
 * @param {Object} block The block to convert.
 * @returns {Object} A meld, with the called tile first.
 */
function blockToMeld(block) {
    let tiles = block.tiles.slice().sort((a, b) => tileSortKey(a) - tileSortKey(b));
    let calledIndex = randomInt(tiles.length);
    let called = tiles.splice(calledIndex, 1)[0];

    return {
        tiles: [called].concat(tiles),
        called: 0,
        kind: block.kind === "triplet" ? "pon" : "chi"
    };
}

/**
 * Builds the plausible wrong answers for a generated value item. Each one is a
 * specific miscount the drill is trying to correct.
 * @param {Object} counted The result of countHan.
 * @param {Object[]} blocks The hand's blocks.
 * @param {Object} context The seat and round wind.
 * @returns {number[]} Candidate wrong han totals.
 */
function buildDistractors(counted, blocks, context) {
    let candidates = [];

    // Scoring the closed honitsu value on an open hand.
    candidates.push(counted.han + 1);

    // Counting a guest wind as though it were yakuhai.
    let guestWindTriplets = blocks.filter((block) =>
        block.kind === "triplet" &&
        WINDS.includes(normalize(block.tiles[0])) &&
        normalize(block.tiles[0]) !== context.seatWind &&
        normalize(block.tiles[0]) !== context.roundWind).length;
    if (guestWindTriplets > 0) {
        candidates.push(counted.han + guestWindTriplets);
    }

    // Counting an honor pair as though it were already a triplet.
    let honorPair = blocks.find((block) => block.kind === "pair" && isHonor(normalize(block.tiles[0])));
    if (honorPair) {
        candidates.push(counted.han + 1);
    }

    // Missing the dora or the red fives entirely.
    let doraSource = counted.sources.find((source) => source.startsWith("dora "));
    if (doraSource) {
        candidates.push(counted.han - parseInt(doraSource.split(" ")[1], 10));
    }

    let redSource = counted.sources.find((source) => source.startsWith("red five "));
    if (redSource) {
        candidates.push(counted.han - parseInt(redSource.split(" ")[1], 10));
    }

    candidates.push(counted.han - 1, counted.han + 2);

    return candidates;
}

/**
 * Generates a value gate item in the same shape as the authored ones.
 * @param {number} sequence A counter used to give the item a unique id.
 * @returns {Object} A generated item.
 */
export function generateValueItem(sequence) {
    let candidate = null;

    // Rejection sampling: most draws are fine, but the yaku guards and the
    // four-copies limit can both fail, so cap the attempts rather than looping.
    for (let attempt = 0; attempt < 200 && !candidate; attempt++) {
        candidate = buildCandidate();
    }

    if (!candidate) return null;

    let { blocks, suit, seatWind, roundWind, dora } = candidate;
    let counted = countHan(blocks, { seatWind, roundWind, dora });
    let valueClass = getValueClass(counted.han);

    let melds = blocks.filter((block) => block.open).map(blockToMeld);
    let closed = blocks
        .filter((block) => !block.open)
        .reduce((all, block) => all.concat(block.tiles), [])
        .sort((a, b) => tileSortKey(a) - tileSortKey(b));

    let wrongAnswers = [];
    for (let candidateHan of shuffleArray(buildDistractors(counted, blocks, { seatWind, roundWind }))) {
        if (candidateHan === counted.han || candidateHan < 1) continue;
        if (wrongAnswers.includes(candidateHan)) continue;
        wrongAnswers.push(candidateHan);
        if (wrongAnswers.length === 2) break;
    }

    let options = [counted.han].concat(wrongAnswers).map((han) => ({
        id: String(han),
        label: `${han} han`,
        correct: han === counted.han
    }));

    return {
        id: `generated-value-${sequence}`,
        type: "value_gate",
        generated: true,
        difficulty: Math.min(5, counted.sources.length),
        prompt: `Open ${SUIT_NAMES[suit]} honitsu, completed as shown. How many han?`,
        hand: { closed, melds },
        seatWind,
        roundWind,
        dora,
        options: shuffleArray(options),
        rule: "value-count",
        tags: ["value", "generated"],
        answer: {
            han: counted.han,
            sources: counted.sources,
            verdict: valueClass.label
        },
        rationale: `${counted.sources.join(" + ")} = ${counted.han} han (${valueClass.label}).` +
            ` Remember that only completed triplets score, and that a wind is worth nothing` +
            ` unless it is your seat wind or the round wind.`
    };
}
