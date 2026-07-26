import itemBank from '../data/honitsu-items.json';
import { parseTile, prepareItem, buildDeck, getRuleKey, CONTRAST_PAIRS, DRILL_TYPES } from './HonitsuItems';

/**
 * Converts a tile index back into the item bank's notation, so mirrored prose
 * can be checked against the mirrored hand.
 */
function toNotation(index) {
    const honors = { 31: "E", 32: "S", 33: "W", 34: "N", 35: "P", 36: "F", 37: "C" };
    if (index >= 31) return honors[index];

    let suit = ["m", "p", "s"][Math.floor(index / 10)];
    let value = index % 10;
    return value === 0 ? `5${suit}r` : `${value}${suit}`;
}

/** Collects every tile index in a prepared hand. */
function allTiles(hand) {
    return hand.closed.concat(
        hand.melds.reduce((tiles, meld) => tiles.concat(meld.tiles), [])
    );
}

it('parses every notation the item bank uses', () => {
    expect(parseTile("3m")).toBe(3);
    expect(parseTile("9s")).toBe(29);
    expect(parseTile("1p")).toBe(11);
    expect(parseTile("E")).toBe(31);
    expect(parseTile("C")).toBe(37);
    // Red fives live at the suit's zero index.
    expect(parseTile("5mr")).toBe(0);
    expect(parseTile("5pr")).toBe(10);
    expect(parseTile("5sr")).toBe(20);
});

it('rejects notation it does not understand', () => {
    expect(() => parseTile("3x")).toThrow();
    expect(() => parseTile("Q")).toThrow();
});

it('gives every item exactly one correct option', () => {
    for (let item of itemBank.items) {
        let correct = item.options.filter((option) => option.correct);
        expect(`${item.id}: ${correct.length}`).toBe(`${item.id}: 1`);
    }
});

it('parses every item into valid tile indexes', () => {
    for (let item of itemBank.items) {
        let prepared = prepareItem(item, false);

        for (let tile of allTiles(prepared.hand)) {
            expect(tile).toBeGreaterThanOrEqual(0);
            expect(tile).toBeLessThanOrEqual(37);
        }
    }
});

it('keeps honors and tile values intact when mirroring suits', () => {
    for (let item of itemBank.items) {
        let plain = prepareItem(item, false);

        // Mirroring is random, so repeat to cover every permutation.
        for (let attempt = 0; attempt < 20; attempt++) {
            let mirrored = prepareItem(item, true);
            let before = allTiles(plain.hand);
            let after = allTiles(mirrored.hand);

            expect(after.length).toBe(before.length);

            for (let i = 0; i < before.length; i++) {
                // An honor is never remapped, and a number tile keeps its value.
                if (before[i] >= 30) {
                    expect(after[i]).toBe(before[i]);
                } else {
                    expect(after[i] % 10).toBe(before[i] % 10);
                    expect(after[i]).toBeLessThan(30);
                }
            }
        }
    }
});

it('rewrites tile references in the prose to match the mirrored hand', () => {
    let checked = 0;

    for (let item of itemBank.items) {
        // Only items whose prompt names the offered tile can be cross-checked.
        if (!item.offered || item.offered.length > 2) continue;
        if (!item.prompt.includes(item.offered)) continue;

        for (let attempt = 0; attempt < 20; attempt++) {
            let mirrored = prepareItem(item, true);
            let expected = toNotation(mirrored.offered);

            expect(mirrored.prompt).toContain(expected);
            checked++;
        }
    }

    expect(checked).toBeGreaterThan(0);
});

it('renames the suit in the prose to match the mirrored hand', () => {
    const suitWords = { 0: "manzu", 10: "pinzu", 20: "souzu" };
    let checked = 0;

    for (let item of itemBank.items) {
        if (!item.prompt.includes("manzu") && !item.rationale.includes("manzu")) continue;

        for (let attempt = 0; attempt < 20; attempt++) {
            let mirrored = prepareItem(item, true);
            let numberTiles = allTiles(mirrored.hand).filter((tile) => tile < 30);
            if (numberTiles.length === 0) continue;

            let suit = Math.floor(numberTiles[0] / 10) * 10;
            let text = `${mirrored.prompt} ${mirrored.rationale}`;

            expect(text).toContain(suitWords[suit]);
            checked++;
        }
    }

    expect(checked).toBeGreaterThan(0);
});

it('never leaves an item without a rule to track it under', () => {
    for (let item of itemBank.items) {
        expect(getRuleKey(item)).toBeTruthy();
    }
});

it('keeps contrast pairs adjacent in a deck', () => {
    for (let type of DRILL_TYPES) {
        for (let attempt = 0; attempt < 50; attempt++) {
            let deck = buildDeck(type);
            let ids = deck.map((item) => item.id);

            for (let [first, second] of CONTRAST_PAIRS) {
                let firstIndex = ids.indexOf(first);
                let secondIndex = ids.indexOf(second);

                // A pair only groups when both halves are in this deck.
                if (firstIndex < 0 || secondIndex < 0) continue;
                expect(secondIndex - firstIndex).toBe(1);
            }
        }
    }
});

it('deals every authored item of a type exactly once per deck', () => {
    for (let type of DRILL_TYPES) {
        let expected = itemBank.items.filter((item) => item.type === type);
        let deck = buildDeck(type);

        expect(deck.length).toBe(expected.length);
        expect(new Set(deck.map((item) => item.id)).size).toBe(expected.length);
    }
});
