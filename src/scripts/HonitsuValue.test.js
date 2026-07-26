import { countHan, generateValueItem, getValueClass } from './HonitsuValue';

/**
 * The authored value gate items, decomposed into blocks by hand.
 *
 * These are the spec: the brief states that generated items must match the
 * authored arithmetic, so the counter is pinned to all six answers. The hands
 * are illustrative rather than strictly legal 14-tile hands, which does not
 * matter here because the drill asks for the han, not for a win.
 */
const AUTHORED = [
    {
        id: "v-01-honitsu-only",
        expected: 2,
        context: { seatWind: 31, roundWind: 31 },
        blocks: [
            { kind: "run", tiles: [3, 4, 5], open: false },
            { kind: "run", tiles: [1, 2, 3], open: true },
            { kind: "triplet", tiles: [34, 34, 34], open: true },
            { kind: "pair", tiles: [33, 33], open: false }
        ]
    },
    {
        id: "v-02-one-dragon",
        expected: 3,
        context: { seatWind: 32, roundWind: 31 },
        blocks: [
            { kind: "run", tiles: [3, 4, 5], open: false },
            { kind: "pair", tiles: [1, 1], open: false },
            { kind: "run", tiles: [7, 8, 9], open: true },
            { kind: "triplet", tiles: [37, 37, 37], open: true }
        ]
    },
    {
        id: "v-03-two-dragons",
        expected: 4,
        context: { seatWind: 32, roundWind: 32 },
        blocks: [
            { kind: "run", tiles: [4, 5, 6], open: false },
            { kind: "pair", tiles: [31], open: false },
            { kind: "triplet", tiles: [35, 35, 35], open: true },
            { kind: "triplet", tiles: [8, 8, 8], open: true },
            { kind: "triplet", tiles: [37, 37, 37], open: true }
        ]
    },
    {
        id: "v-04-seat-wind",
        expected: 3,
        context: { seatWind: 32, roundWind: 31 },
        blocks: [
            { kind: "run", tiles: [2, 3, 4], open: false },
            { kind: "pair", tiles: [7, 7], open: false },
            { kind: "triplet", tiles: [32, 32, 32], open: true },
            { kind: "run", tiles: [5, 6, 7], open: true }
        ]
    },
    {
        id: "v-05-pairs-are-not-han",
        expected: 2,
        context: { seatWind: 31, roundWind: 31 },
        blocks: [
            { kind: "run", tiles: [2, 3, 4], open: false },
            { kind: "run", tiles: [6, 7, 8], open: false },
            { kind: "pair", tiles: [35, 35], open: false },
            { kind: "pair", tiles: [37, 37], open: false },
            { kind: "run", tiles: [1, 2, 3], open: true }
        ]
    },
    {
        id: "v-06-dora-stack",
        expected: 6,
        context: { seatWind: 31, roundWind: 31, dora: 8 },
        blocks: [
            { kind: "run", tiles: [2, 3, 4], open: false },
            { kind: "pair", tiles: [8, 8], open: false },
            { kind: "triplet", tiles: [37, 37, 37], open: true },
            // The chi contains the red five, stored at the suit's zero index.
            { kind: "run", tiles: [6, 0, 7], open: true }
        ]
    }
];

it('reproduces the han of every authored value gate item', () => {
    for (let item of AUTHORED) {
        let counted = countHan(item.blocks, item.context);
        expect(`${item.id}: ${counted.han}`).toBe(`${item.id}: ${item.expected}`);
    }
});

it('scores a wind only for the player whose seat or round it is', () => {
    let blocks = [{ kind: "triplet", tiles: [33, 33, 33], open: true }];

    // West as a guest wind is worth nothing beyond the honitsu itself.
    expect(countHan(blocks, { seatWind: 31, roundWind: 31 }).han).toBe(2);
    // West as your seat wind adds a han.
    expect(countHan(blocks, { seatWind: 33, roundWind: 31 }).han).toBe(3);
    // A double wind scores both the seat and the round.
    expect(countHan(blocks, { seatWind: 33, roundWind: 33 }).han).toBe(4);
});

it('does not score a pair as a han', () => {
    let pairs = [
        { kind: "pair", tiles: [35, 35], open: false },
        { kind: "pair", tiles: [37, 37], open: false },
        { kind: "run", tiles: [1, 2, 3], open: true }
    ];

    expect(countHan(pairs, { seatWind: 31, roundWind: 31 }).han).toBe(2);
});

it('classifies han without needing fu', () => {
    expect(getValueClass(2).mangan).toBe(false);
    expect(getValueClass(3).mangan).toBe(false);
    expect(getValueClass(4).mangan).toBe(true);
    expect(getValueClass(6).label).toBe("haneman");
    expect(getValueClass(13).label).toBe("yakuman");
});

it('generates well-formed value items', () => {
    for (let i = 0; i < 300; i++) {
        let item = generateValueItem(i);
        expect(item).not.toBeNull();

        let correct = item.options.filter((option) => option.correct);
        expect(correct.length).toBe(1);
        expect(parseInt(correct[0].label, 10)).toBe(item.answer.han);

        // Distinct answers, or the question has more than one right response.
        let labels = item.options.map((option) => option.label);
        expect(new Set(labels).size).toBe(labels.length);

        // Open honitsu is worth two before anything is stacked on it.
        expect(item.answer.han).toBeGreaterThanOrEqual(2);

        // Opening at least two sets is what rules out sanankou, which this
        // drill does not count.
        expect(item.hand.melds.length).toBeGreaterThanOrEqual(2);
        expect(item.hand.melds.length).toBeLessThanOrEqual(3);
    }
});

it('generates hands that are actually honitsu', () => {
    for (let i = 0; i < 300; i++) {
        let item = generateValueItem(i);
        let tiles = item.hand.closed.concat(
            item.hand.melds.reduce((all, meld) => all.concat(meld.tiles), [])
        );

        let numbers = tiles.filter((tile) => tile < 30);
        let honors = tiles.filter((tile) => tile >= 31);

        // Honitsu needs honors, and chinitsu needs none, so both must be present.
        expect(numbers.length).toBeGreaterThan(0);
        expect(honors.length).toBeGreaterThan(0);

        // Exactly one number suit, or it is not a honitsu at all.
        let suits = new Set(numbers.map((tile) => Math.floor(tile / 10)));
        expect(suits.size).toBe(1);

        // Fourteen tiles, and no tile used more than four times.
        expect(tiles.length).toBe(14);
        let counts = {};
        for (let tile of tiles) {
            let normalized = (tile < 30 && tile % 10 === 0) ? tile + 5 : tile;
            counts[normalized] = (counts[normalized] || 0) + 1;
            expect(counts[normalized]).toBeLessThanOrEqual(4);
        }
    }
});

it('generates only legal melds', () => {
    for (let i = 0; i < 300; i++) {
        let item = generateValueItem(i);

        for (let meld of item.hand.melds) {
            expect(meld.tiles.length).toBe(3);
            expect(meld.called).toBe(0);

            let normalized = meld.tiles
                .map((tile) => (tile < 30 && tile % 10 === 0) ? tile + 5 : tile)
                .sort((a, b) => a - b);

            if (meld.kind === "pon") {
                expect(normalized[0]).toBe(normalized[1]);
                expect(normalized[1]).toBe(normalized[2]);
            } else {
                // A chi is three consecutive tiles, and never of honors.
                expect(normalized[0]).toBeLessThan(30);
                expect(normalized[1]).toBe(normalized[0] + 1);
                expect(normalized[2]).toBe(normalized[0] + 2);
            }
        }
    }
});
