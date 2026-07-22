import { removeRandomItem } from "./Utils";
import { convertHandToTileIndexArray } from "./HandConversions";
import { MAX_HAND_SHANTEN } from "../Constants";

/**
 * Generates a random hand of the specified number of tiles.
 * @param {TileCounts} remainingTiles The number of each tile in the wall.
 * @param {number} handSize The number of tiles in the hand (default: 14).
 */
export function generateHand(remainingTiles, handSize = 14) {
    let availableTiles = remainingTiles.slice();
    let tilePool = convertHandToTileIndexArray(availableTiles);

    if (tilePool.length < handSize) return { hand: undefined, availableTiles: undefined, tilePool: undefined };

    let hand = Array(38).fill(0);

    for (let i = 0; i < handSize; i++) {
        let tile = removeRandomItem(tilePool);
        hand[tile]++;
        availableTiles[tile]--;
    }

    for (let i = handSize, j = 0; i < 14; j++, i += 3) {
        hand[j + 31] += 3;
    }

    return {
        hand,
        availableTiles,
        tilePool
    };
}

/**
 * Generates a random hand whose shanten falls within the given range, by generating
 * hands until one qualifies (rejection sampling).
 *
 * Low targets (such as requiring tenpai) are rare enough that they may never be hit, so
 * the number of attempts is capped. When the cap is reached, the closest hand that was
 * seen is returned with `fellBack` set, rather than looping forever.
 *
 * @param {TileCounts} remainingTiles The number of each tile in the wall.
 * @param {number} handSize The number of tiles in the hand.
 * @param {number} minShanten The lowest acceptable shanten.
 * @param {number} maxShanten The highest acceptable shanten. At MAX_HAND_SHANTEN or above
 *                            there is no upper limit, which preserves the original behaviour.
 * @param {(hand: TileCounts) => number} shantenFunction The shanten function to filter with.
 * @param {number} maxAttempts How many hands to try before giving up.
 */
export function generateHandInShantenRange(remainingTiles, handSize, minShanten, maxShanten, shantenFunction, maxAttempts = 400) {
    let hasUpperLimit = maxShanten < MAX_HAND_SHANTEN;
    let closest;
    let closestDistance = Infinity;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let result = generateHand(remainingTiles, handSize);

        // Not enough tiles left in the wall - the caller handles this case.
        if (!result.hand) return { ...result, shanten: undefined, fellBack: false };

        let shanten = shantenFunction(result.hand);

        if (shanten >= minShanten && (!hasUpperLimit || shanten <= maxShanten)) {
            return { ...result, shanten, fellBack: false };
        }

        // Remember the near miss in case no hand in range turns up.
        let distance = shanten < minShanten ? minShanten - shanten : shanten - maxShanten;
        if (distance < closestDistance) {
            closestDistance = distance;
            closest = { ...result, shanten };
        }
    }

    return { ...closest, fellBack: true };
}

/**
 * Adds a number of tiles to the given hand.
 * @param {TileCounts} remainingTiles The number of each tile in the wall.
 * @param {TileCounts} hand The number of each tile in the player's hand.
 * @param {number} tilesToFill How many tiles to add.
 */
export function fillHand(remainingTiles, hand, tilesToFill) {
    let availableTiles = remainingTiles.slice();
    let tilePool = convertHandToTileIndexArray(availableTiles);

    if (tilePool.length < tilesToFill) return { hand: undefined, availableTiles: undefined, tilePool: undefined };

    for (let i = 0; i < tilesToFill; i++) {
        let tile = removeRandomItem(tilePool);
        hand[tile]++;
        availableTiles[tile]--;
    }

    return {
        hand,
        availableTiles,
        tilePool
    };
}