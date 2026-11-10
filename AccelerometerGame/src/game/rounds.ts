/**
 * Round definitions. The game plays through an array of rounds in order; each
 * round's `type` decides what the gameplay loop does during that round.
 */

export enum RoundType {
    /** Catch up to a slower lead car and pass it on a dashed section. */
    Pass = "pass",
}

export interface Round {
    type: RoundType;
    /** World-distance range for each double yellow section, randomised per section. */
    doubleLength: [number, number];
    /** World-distance range for each dashed (passing) section, randomised per section. */
    dashedLength: [number, number];
    /** Speed of the car the player has to pass. */
    leadSpeed: number;
}

/** Matches the original hard-coded tuning. */
export const DEFAULT_ROUND: Round = {
    type: RoundType.Pass,
    doubleLength: [400, 900],
    dashedLength: [900, 1500],
    leadSpeed: 1.2, // Slightly slower than BASE_SPEED so the player catches up
};

/** `count` copies of the default round. */
export const buildRounds = (count: number): Round[] =>
    Array.from({ length: count }, () => ({ ...DEFAULT_ROUND }));
