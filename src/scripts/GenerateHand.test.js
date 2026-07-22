import { generateHandInShantenRange } from "./GenerateHand";
import { calculateMinimumShanten } from "./ShantenCalculator";
import { ALL_TILES_REMAINING, MAX_HAND_SHANTEN } from "../Constants";

const wall = () => ALL_TILES_REMAINING.slice();

describe("generateHandInShantenRange", () => {
    it("only deals hands at the exact shanten when min and max match", () => {
        for (let i = 0; i < 30; i++) {
            let result = generateHandInShantenRange(wall(), 14, 2, 2, calculateMinimumShanten);

            expect(result.hand).toBeDefined();
            expect(result.fellBack).toBe(false);
            expect(result.shanten).toBe(2);
            // The reported shanten must match a fresh calculation on the hand itself.
            expect(calculateMinimumShanten(result.hand)).toBe(2);
        }
    });

    it("respects a range spanning several shanten values", () => {
        for (let i = 0; i < 30; i++) {
            let result = generateHandInShantenRange(wall(), 14, 2, 3, calculateMinimumShanten);

            expect(result.fellBack).toBe(false);
            expect(result.shanten).toBeGreaterThanOrEqual(2);
            expect(result.shanten).toBeLessThanOrEqual(3);
        }
    });

    it("applies no upper limit at the sentinel, preserving the minimum-only behaviour", () => {
        for (let i = 0; i < 30; i++) {
            let result = generateHandInShantenRange(wall(), 14, 3, MAX_HAND_SHANTEN, calculateMinimumShanten);

            expect(result.fellBack).toBe(false);
            expect(result.shanten).toBeGreaterThanOrEqual(3);
        }
    });

    it("falls back to the closest hand instead of looping forever on an unreachable range", () => {
        // Shanten is never negative, so this range can never be satisfied.
        let result = generateHandInShantenRange(wall(), 14, -5, -3, calculateMinimumShanten, 25);

        expect(result.hand).toBeDefined();
        expect(result.fellBack).toBe(true);
        expect(result.shanten).toBeGreaterThanOrEqual(0);
    });

    it("reports no hand when the wall is too small", () => {
        let result = generateHandInShantenRange(Array(38).fill(0), 14, 0, MAX_HAND_SHANTEN, calculateMinimumShanten);

        expect(result.hand).toBeUndefined();
        expect(result.fellBack).toBe(false);
    });
});
