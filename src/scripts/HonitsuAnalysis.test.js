import itemBank from '../data/honitsu-items.json';
import { parseTile } from './HonitsuItems';
import {
    maskToSuit, doraFromIndicator, isInHonitsu, findCalls, takeTile,
    estimateHonitsuValue, estimateSpeedValue, analyzeHand
} from './HonitsuAnalysis';

/** Builds a counts array from tiles in the item bank's notation. */
function toCounts(tiles) {
    let counts = Array(38).fill(0);
    for (let tile of tiles) counts[parseTile(tile)]++;
    return counts;
}

/** A full wall minus the given hand, which is what the player cannot see. */
function remainingAfter(hand) {
    let remaining = Array(38).fill(0);
    for (let i = 1; i < 30; i++) remaining[i] = 4;
    for (let i = 31; i < 38; i++) remaining[i] = 4;
    for (let i = 0; i < hand.length; i++) remaining[i] = Math.max(0, remaining[i] - hand[i]);
    return remaining;
}

it('masks a hand down to one suit plus the honors', () => {
    let hand = toCounts(["1m", "5m", "3p", "9s", "E", "C"]);
    let masked = maskToSuit(hand, 0);

    expect(masked[1]).toBe(1);
    expect(masked[5]).toBe(1);
    expect(masked[31]).toBe(1);
    expect(masked[37]).toBe(1);
    // Everything outside the suit is gone.
    expect(masked[13]).toBe(0);
    expect(masked[29]).toBe(0);
});

it('resolves dora indicators, including the wraps', () => {
    expect(doraFromIndicator(1)).toBe(2);
    expect(doraFromIndicator(9)).toBe(1);
    expect(doraFromIndicator(19)).toBe(11);
    // A red five indicates whatever a normal five would.
    expect(doraFromIndicator(0)).toBe(6);
    // Winds cycle, and so do dragons, each within their own group.
    expect(doraFromIndicator(31)).toBe(32);
    expect(doraFromIndicator(34)).toBe(31);
    expect(doraFromIndicator(35)).toBe(36);
    expect(doraFromIndicator(37)).toBe(35);
});

it('counts honors as part of every honitsu', () => {
    expect(isInHonitsu(31, 0)).toBe(true);
    expect(isInHonitsu(37, 20)).toBe(true);
    expect(isInHonitsu(3, 0)).toBe(true);
    expect(isInHonitsu(3, 10)).toBe(false);
});

it('finds pon and chi calls, and only chi from the left', () => {
    let hand = toCounts(["4m", "5m", "6m", "7m", "W", "W"]);

    // Pon needs two in hand and can come from anyone.
    expect(findCalls(hand, 33, false).map((call) => call.kind)).toEqual(["pon"]);

    // Chi is left-player only.
    expect(findCalls(hand, 3, false)).toEqual([]);

    let chis = findCalls(hand, 3, true);
    expect(chis.length).toBe(1);
    expect(chis[0].uses).toEqual([4, 5]);

    // A 7m can be chi'd two ways here: with 5m6m or with 6m and the 8m we lack.
    let sevenCalls = findCalls(hand, 7, true).map((call) => call.uses);
    expect(sevenCalls).toContainEqual([5, 6]);
});

it('never builds a chi across a suit boundary', () => {
    // 8m 9m plus a 1p must not become a "9m 1p 2p" run.
    let hand = toCounts(["8m", "9m", "2p", "3p"]);
    let calls = findCalls(hand, 11, true);

    for (let call of calls) {
        for (let tile of call.uses) {
            expect(Math.floor(tile / 10)).toBe(1);
        }
    }
});

it('can call using a red five, but spends the normal five first', () => {
    // A hand holding only a red five still counts as holding a five.
    let redOnly = toCounts(["5mr", "6m"]);
    let calls = findCalls(redOnly, 7, true);
    expect(calls.map((call) => call.uses)).toContainEqual([5, 6]);

    // With both, the normal five is the one that leaves the hand.
    let both = toCounts(["5m", "5mr"]);
    expect(takeTile(both, 5)).toBe(5);
    expect(takeTile(both, 5)).toBe(0);
    expect(takeTile(both, 5)).toBe(-1);
});

it('treats an honor pair as a ceiling, not a han', () => {
    let hand = toCounts(["1m", "2m", "3m", "P", "P", "C", "C"]);
    let value = estimateHonitsuValue(hand, [], 0, { seatWind: 31, roundWind: 31 });

    // Closed honitsu is 3, and neither dragon pair has scored yet.
    expect(value.han).toBe(3);
    expect(value.ceiling).toBe(5);
    expect(value.pending.length).toBe(2);
});

it('scores winds only for the player whose seat or round they are', () => {
    let hand = toCounts(["1m", "2m", "3m", "W", "W", "W"]);

    expect(estimateHonitsuValue(hand, [], 0, { seatWind: 31, roundWind: 31 }).han).toBe(3);
    expect(estimateHonitsuValue(hand, [], 0, { seatWind: 33, roundWind: 31 }).han).toBe(4);
    // A double wind scores twice.
    expect(estimateHonitsuValue(hand, [], 0, { seatWind: 33, roundWind: 33 }).han).toBe(5);
});

it('ignores dora that the honitsu would have to discard', () => {
    // The lone chun keeps this a honitsu rather than a chinitsu; the single
    // tile is not a triplet, so it adds no han of its own.
    let hand = toCounts(["1m", "2m", "3m", "5p", "5p", "C"]);

    // A pinzu dora cannot survive in a manzu honitsu.
    expect(estimateHonitsuValue(hand, [], 0, { seatWind: 31, roundWind: 31, dora: 15 }).han).toBe(3);
    // The same hand played straight keeps it: riichi 1 plus two dora.
    expect(estimateSpeedValue(hand, [], { seatWind: 31, roundWind: 31, dora: 15 }).han).toBe(3);
});

it('scores a one-suit hand with no honors as chinitsu', () => {
    let hand = toCounts(["1m", "2m", "3m", "5m", "6m", "7m"]);

    expect(estimateHonitsuValue(hand, [], 0, { seatWind: 31, roundWind: 31 }).han).toBe(6);

    let melds = [{ tiles: [1, 2, 3], called: 0, kind: "chi" }];
    expect(estimateHonitsuValue(hand, melds, 0, { seatWind: 31, roundWind: 31 }).han).toBe(5);

    // A single honor drops it back to honitsu.
    let withHonor = toCounts(["1m", "2m", "3m", "5m", "6m", "7m", "C"]);
    expect(estimateHonitsuValue(withHonor, [], 0, { seatWind: 31, roundWind: 31 }).han).toBe(3);
});

it('keeps the closed-to-open gap at one han for both flushes', () => {
    // The road classifier converts a closed ceiling to an open one by
    // subtracting one, which only holds if both flushes have that same gap.
    let honitsu = toCounts(["1m", "2m", "3m", "C"]);
    let chinitsu = toCounts(["1m", "2m", "3m", "5m"]);
    let context = { seatWind: 31, roundWind: 31 };
    let meld = [{ tiles: [1, 2, 3], called: 0, kind: "chi" }];

    expect(estimateHonitsuValue(honitsu, [], 0, context).han
        - estimateHonitsuValue(honitsu, meld, 0, context).han).toBe(1);
    expect(estimateHonitsuValue(chinitsu, [], 0, context).han
        - estimateHonitsuValue(chinitsu, meld, 0, context).han).toBe(1);
});

it('knows an open hand with no yaku cannot win', () => {
    let melds = [{ tiles: [1, 2, 3], called: 0, kind: "chi" }];
    let hand = toCounts(["5m", "6m", "7m", "2p", "3p"]);

    expect(estimateSpeedValue(hand, melds, { seatWind: 31, roundWind: 31 }).yakuless).toBe(true);

    // A dragon triplet is a yaku, so the same shape can win.
    let withDragon = toCounts(["5m", "6m", "7m", "C", "C", "C"]);
    expect(estimateSpeedValue(withDragon, melds, { seatWind: 31, roundWind: 31 }).yakuless).toBe(false);
});

it('makes the honitsu line ignore off-suit discards', () => {
    let hand = toCounts(["1m", "1m", "3m", "7m", "9m", "5p", "8p", "4s", "8s", "E", "S", "W", "C", "C"]);
    let analysis = analyzeHand(hand, [], remainingAfter(hand), { seatWind: 31, roundWind: 31 });

    // Cutting any tile the honitsu never wanted leaves its acceptance unchanged.
    let honitsuSuit = analysis.honitsu.suit;
    let offSuit = [11, 18, 24, 28].filter((tile) => hand[tile] > 0 && !isInHonitsu(tile, honitsuSuit));

    expect(offSuit.length).toBeGreaterThan(0);
    for (let tile of offSuit) {
        expect(analysis.honitsu.ukeire[tile].value).toBe(analysis.honitsu.ukeire[offSuit[0]].value);
    }
});

it('agrees with the authored routing answers on dealt hands', () => {
    // The routing items are a pro's own rulings, so they are the best available
    // check that the classifier reproduces the decision order in the rules.
    let dealt = itemBank.items.filter((item) => item.type === "routing" && item.turn === "deal");
    expect(dealt.length).toBeGreaterThan(5);

    let mismatches = [];

    for (let item of dealt) {
        let hand = toCounts(item.hand.closed);
        let analysis = analyzeHand(hand, [], remainingAfter(hand), {
            seatWind: parseTile(item.seat_wind),
            roundWind: parseTile(item.round_wind)
        });

        let expected = item.options.find((option) => option.correct).id;
        if (analysis.road.road !== expected) {
            mismatches.push(`${item.id}: expected ${expected}, got ${analysis.road.road} (${analysis.road.reason})`);
        }
    }

    expect(mismatches).toEqual([]);
});
