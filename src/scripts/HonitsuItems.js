import itemBank from '../data/honitsu-items.json';
import { shuffleArray } from './Utils';

/**
 * Loading, notation parsing and anti-memorisation transforms for the honitsu
 * drill item bank.
 *
 * The item bank is authored in its own tile notation ("3m", "5mr", "P") which
 * this module converts into the tile indexes the rest of the app uses.
 */

/** @readonly The tile index of each honor letter used by the item bank. */
const HONOR_INDEXES = { E: 31, S: 32, W: 33, N: 34, P: 35, F: 36, C: 37 };

/** @readonly The base tile index of each suit letter. Red fives live at the base itself. */
const SUIT_BASES = { m: 0, p: 10, s: 20 };

/** @readonly The suit letter of each suit base, for building mirror maps. */
const BASE_SUITS = { 0: "m", 10: "p", 20: "s" };

/** @readonly The name each suit goes by in the authored prose. */
const SUIT_WORDS = { m: "manzu", p: "pinzu", s: "souzu" };

/**
 * @readonly Items designed to teach the same rule from opposite sides. The
 * contrast is the lesson, so a session keeps each pair together rather than
 * scattering them. Authored order is preserved: each pair sets an expectation
 * up before subverting it.
 */
export const CONTRAST_PAIRS = [
    ["r-02-two-offsuit-ryanmen", "r-05-mangan-overrides-ryanmen"],
    ["r-09-cheap-honitsu-dont-pay", "r-10-cheap-honitsu-but-nothing-to-lose"],
    ["r-07-hedge", "r-08-hedge-cost"],
    ["c-01-kuinobashi-4556", "c-04-badcall-4556-pon"],
    ["c-03-kuinobashi-6789", "c-05-badcall-6789-chi5"],
    ["c-07-bakahon", "c-08-bakahon-exception"]
];

/**
 * Converts a tile in the item bank's notation into a tile index.
 * @param {string} tile A tile such as "3m", "5mr" (red five) or "C".
 * @returns {TileIndex} The tile index.
 */
export function parseTile(tile) {
    if (HONOR_INDEXES[tile] !== undefined) {
        return HONOR_INDEXES[tile];
    }

    let value = parseInt(tile.charAt(0), 10);
    let base = SUIT_BASES[tile.charAt(1)];

    if (isNaN(value) || base === undefined) {
        throw new Error(`Unrecognised tile in the honitsu item bank: "${tile}"`);
    }

    // A trailing "r" marks a red five, which the app stores at the suit's zero index.
    if (tile.charAt(2) === "r") {
        return base;
    }

    return base + value;
}

/**
 * Converts a hand in the item bank's notation into tile indexes.
 * @param {Object} hand The authored hand, with closed tiles and melds.
 * @returns {Object} The hand with every tile converted to an index.
 */
function parseHand(hand) {
    if (!hand) return hand;

    return {
        closed: (hand.closed || []).map(parseTile),
        melds: (hand.melds || []).map((meld) => ({
            ...meld,
            tiles: meld.tiles.map(parseTile)
        }))
    };
}

/**
 * Builds a random mapping from each suit base to another, used to disguise
 * items that the user has already seen.
 * @returns {Object} A map of suit base to suit base.
 */
function createSuitMirror() {
    let shuffled = shuffleArray([0, 10, 20]);
    return { 0: shuffled[0], 10: shuffled[1], 20: shuffled[2] };
}

/**
 * Applies a suit mirror to a tile index. Honors are unaffected.
 * @param {TileIndex} tile The tile to remap.
 * @param {Object} mirror A map of suit base to suit base.
 * @returns {TileIndex} The remapped tile.
 */
function mirrorTile(tile, mirror) {
    if (tile >= 30) return tile;

    let base = Math.floor(tile / 10) * 10;
    return mirror[base] + (tile % 10);
}

/**
 * Applies a suit mirror to a parsed hand.
 * @param {Object} hand A hand of tile indexes.
 * @param {Object} mirror A map of suit base to suit base.
 * @returns {Object} The remapped hand.
 */
function mirrorHand(hand, mirror) {
    if (!hand) return hand;

    return {
        closed: hand.closed.map((tile) => mirrorTile(tile, mirror)),
        melds: hand.melds.map((meld) => ({
            ...meld,
            tiles: meld.tiles.map((tile) => mirrorTile(tile, mirror))
        }))
    };
}

/**
 * Applies a suit mirror to authored prose, so the text keeps describing the
 * hand the user is actually looking at.
 *
 * Both tile references ("4p5p", "567m") and suit names ("manzu") are remapped.
 * Every replacement happens in a single pass so that an m -> p mapping cannot
 * cascade into a later p -> s one.
 * @param {string} text The authored text.
 * @param {Object} mirror A map of suit base to suit base.
 * @returns {string} The remapped text.
 */
function mirrorText(text, mirror) {
    if (!text) return text;

    let suitMap = {};
    for (let base of [0, 10, 20]) {
        suitMap[BASE_SUITS[base]] = BASE_SUITS[mirror[base]];
    }

    // Digits followed by a suit letter, e.g. "3m" or "4p5p". The lookahead stops
    // us from rewriting the "m" of a word that merely starts with a digit.
    let tileReferences = /(\d+)([mps])(?![a-zA-Z])/g;
    let suitNames = /(manzu|pinzu|souzu)/gi;

    return text
        .replace(tileReferences, (match, values, suit) => values + suitMap[suit])
        .replace(suitNames, (match) => {
            let word = SUIT_WORDS[suitMap[match.toLowerCase().charAt(0)]];
            // Preserve the capitalisation of the word we replaced.
            return match.charAt(0) === match.charAt(0).toUpperCase()
                ? word.charAt(0).toUpperCase() + word.slice(1)
                : word;
        });
}

/**
 * Converts one authored item into the form the trainer renders, optionally
 * disguising it by permuting the suits.
 * @param {Object} item The raw item from the bank.
 * @param {boolean} mirrorSuits Whether to permute the suits.
 * @returns {Object} The prepared item.
 */
export function prepareItem(item, mirrorSuits) {
    let mirror = mirrorSuits ? createSuitMirror() : null;
    let remapTile = (tile) => {
        if (tile === undefined || tile === null) return undefined;
        let parsed = parseTile(tile);
        return mirror ? mirrorTile(parsed, mirror) : parsed;
    };
    let remapText = (text) => (mirror ? mirrorText(text, mirror) : text);
    let remapHand = (hand) => {
        let parsed = parseHand(hand);
        return mirror ? mirrorHand(parsed, mirror) : parsed;
    };

    let prepared = {
        ...item,
        prompt: remapText(item.prompt),
        rationale: remapText(item.rationale),
        note: remapText(item.note),
        hand: remapHand(item.hand),
        result: item.result ? remapHand(item.result) : undefined,
        resultIfWrong: item.result_if_wrong ? remapHand(item.result_if_wrong) : undefined,
        offered: remapTile(item.offered),
        drawn: remapTile(item.drawn),
        dora: remapTile(item.dora),
        seatWind: item.seat_wind ? parseTile(item.seat_wind) : undefined,
        roundWind: item.round_wind ? parseTile(item.round_wind) : undefined,
        // The answer position is shuffled so that recognising an item by the
        // shape of its option list stops working.
        options: shuffleArray(
            item.options.map((option) => ({ ...option, label: remapText(option.label) }))
        )
    };

    if (item.answer) {
        prepared.answer = {
            ...item.answer,
            sources: (item.answer.sources || []).map(remapText),
            verdict: remapText(item.answer.verdict)
        };
    }

    if (item.han_if_completed) {
        prepared.hanIfCompleted = {
            ...item.han_if_completed,
            sources: (item.han_if_completed.sources || []).map(remapText),
            value: remapText(item.han_if_completed.value)
        };
    }

    return prepared;
}

/**
 * Gets the key an item's accuracy is tracked under.
 *
 * Most items name the rule they teach, but the authored value gate items only
 * carry tags, so the first tag past the generic "value" stands in for one.
 * @param {Object} item The item, raw or prepared.
 * @returns {string} The rule key.
 */
export function getRuleKey(item) {
    if (item.rule) return item.rule;

    let specificTag = (item.tags || []).filter((tag) => tag !== "value")[0];
    return specificTag || item.type;
}

/**
 * Gets every authored item of a given drill type, in authored order.
 * @param {string} type One of "routing", "calling" or "value_gate".
 * @returns {Object[]} The raw items.
 */
export function getItemsOfType(type) {
    return itemBank.items.filter((item) => item.type === type);
}

/**
 * Builds a shuffled session deck for a drill type, keeping contrast pairs
 * together so both halves of a rule are seen in the same session.
 * @param {string} type One of "routing", "calling" or "value_gate".
 * @returns {Object[]} The raw items, in the order they should be asked.
 */
export function buildDeck(type) {
    let items = getItemsOfType(type);
    let byId = {};
    for (let item of items) {
        byId[item.id] = item;
    }

    let units = [];
    let claimed = new Set();

    for (let [first, second] of CONTRAST_PAIRS) {
        // A pair only groups if both halves are in this deck; r-07 and r-08 are
        // deliberately split across the routing and calling decks.
        if (byId[first] && byId[second]) {
            units.push([byId[first], byId[second]]);
            claimed.add(first);
            claimed.add(second);
        }
    }

    for (let item of items) {
        if (!claimed.has(item.id)) {
            units.push([item]);
        }
    }

    return shuffleArray(units).reduce((deck, unit) => deck.concat(unit), []);
}

/** @readonly The drill types, in the order they are offered. */
export const DRILL_TYPES = ["routing", "calling", "value_gate"];
