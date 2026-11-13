/**
 * Round definitions. The game plays through an array of rounds in order; each
 * round's `type` decides what the gameplay loop does during that round.
 */

export enum RoundType {
    /** Catch up to a slower lead car and pass it on a dashed section. */
    Pass = "pass",
    /** Follow a winding stretch of road, keeping to the middle of the right lane. */
    Winding = "winding",
}

/** Shape of a winding stretch of road. */
export interface CurveParams {
    /** Largest sideways shift of the road, in px. */
    amplitude: number;
    /** World distance of one full left-and-right bend. */
    wavelength: number;
    /** World distance of the whole winding stretch (the length of the round). */
    length: number;
}

export interface Round {
    type: RoundType;
    /** World-distance range for each double yellow section, randomised per section. */
    doubleLength: [number, number];
    /** World-distance range for each dashed (passing) section, randomised per section. */
    dashedLength: [number, number];
    /** Speed of the car the player has to pass. Used by Pass rounds. */
    leadSpeed: number;
    /** Road shape. Required by Winding rounds, ignored by Pass rounds. */
    curve?: CurveParams;
}

/** Matches the original hard-coded tuning. */
export const DEFAULT_ROUND: Round = {
    type: RoundType.Pass,
    doubleLength: [400, 900],
    dashedLength: [900, 1500],
    leadSpeed: 1.2, // Slightly slower than BASE_SPEED so the player catches up
};

/** No passing on bends: dashed sections have zero length, so the centre line is all double yellow. */
export const WINDING_ROUND: Round = {
    type: RoundType.Winding,
    doubleLength: [400, 900],
    dashedLength: [0, 0],
    leadSpeed: 1.2,
    curve: { amplitude: 50, wavelength: 800, length: 2400 },
};

/** `count` rounds alternating Pass, Winding, Pass, ... */
export const buildRounds = (count: number): Round[] =>
    Array.from({ length: count }, (_, i) => ({ ...(i % 2 === 0 ? DEFAULT_ROUND : WINDING_ROUND) }));
