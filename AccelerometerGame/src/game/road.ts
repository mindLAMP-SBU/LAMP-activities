/**
 * Centre-line markings along the road. Positions are world distances (z), where
 * larger z is further ahead of the player.
 */

export type LineType = "double" | "dashed";

export interface LineZone {
    start: number;
    end: number;
    type: LineType;
}

/** Length ranges (world distance) for each kind of section. */
export interface ZoneLengths {
    doubleLength: [number, number];
    dashedLength: [number, number];
}

const randBetween = ([min, max]: [number, number]) => min + Math.random() * (max - min);

/** Start with a double yellow section ending somewhere ahead of z0, so the player has to wait to pass. */
export const createZones = (z0: number, doubleLength: [number, number]): LineZone[] => [
    { start: -Infinity, end: z0 + randBetween(doubleLength), type: "double" },
];

/**
 * Append alternating sections until the markings reach `upTo`, and drop sections that end before `from`.
 * New sections use `lengths`; sections already generated keep the lengths they were made with.
 */
export function updateZones(zones: LineZone[], from: number, upTo: number, lengths: ZoneLengths): void {
    while (zones[zones.length - 1].end < upTo) {
        const last = zones[zones.length - 1];
        const type: LineType = last.type === "double" ? "dashed" : "double";
        const length = randBetween(type === "double" ? lengths.doubleLength : lengths.dashedLength);
        zones.push({ start: last.end, end: last.end + length, type });
    }
    while (zones.length > 1 && zones[0].end < from) {
        zones.shift();
    }
}

/** True if any part of [from, to] is marked with a double yellow line. */
export const isDoubleBetween = (zones: LineZone[], from: number, to: number): boolean =>
    zones.some((z) => z.type === "double" && z.start < to && z.end > from);

/** A winding stretch of road between world distances `start` and `end`. */
export interface Curve {
    start: number;
    end: number;
    amplitude: number;
    wavelength: number;
}

/**
 * Sideways shift of the road centre at world distance z. The sin(pi*u) envelope
 * eases each bend in and out, so the road is exactly straight at both ends.
 */
export function roadOffset(curves: Curve[], z: number): number {
    let offset = 0;
    for (const c of curves) {
        if (z <= c.start || z >= c.end) continue;
        const u = (z - c.start) / (c.end - c.start);
        offset += c.amplitude * Math.sin(Math.PI * u) * Math.sin((2 * Math.PI * (z - c.start)) / c.wavelength);
    }
    return offset;
}

/** World distance covered by each strip when drawing something that bends with the road. */
export const SLICE = 3;

/**
 * Fill a strip that follows the road between world distances lo and hi, drawn as
 * short rects so it can bend. `dx` is the strip's left edge relative to the road centre.
 */
export function fillAlongRoad(
    ctx: CanvasRenderingContext2D,
    lo: number,
    hi: number,
    dx: number,
    w: number,
    centreAt: (z: number) => number,
    toScreenY: (z: number) => number,
): void {
    for (let z = lo; z < hi; z += SLICE) {
        const z2 = Math.min(z + SLICE, hi);
        // Half a pixel of overlap hides seams between neighbouring slices
        ctx.fillRect(centreAt((z + z2) / 2) + dx, toScreenY(z2), w, z2 - z + 0.5);
    }
}

/** Draw the centre line between world distances zBottom and zTop, following the road centre. */
export function drawCenterLine(
    ctx: CanvasRenderingContext2D,
    zones: LineZone[],
    centreAt: (z: number) => number,
    zBottom: number,
    zTop: number,
    toScreenY: (z: number) => number,
    color: string,
    dashGap: number,
    dashLength: number,
): void {
    ctx.fillStyle = color;
    for (const zone of zones) {
        const lo = Math.max(zone.start, zBottom);
        const hi = Math.min(zone.end, zTop);
        if (hi <= lo) continue;

        if (zone.type === "double") {
            fillAlongRoad(ctx, lo, hi, -3.5, 2, centreAt, toScreenY);
            fillAlongRoad(ctx, lo, hi, 1.5, 2, centreAt, toScreenY);
        } else {
            // Dashes are anchored to world distance so they scroll with the road
            for (let k = Math.ceil((lo - dashLength) / dashGap); k * dashGap < hi; k++) {
                const dLo = Math.max(k * dashGap, lo);
                const dHi = Math.min(k * dashGap + dashLength, hi);
                if (dHi > dLo) fillAlongRoad(ctx, dLo, dHi, -1.25, 2.5, centreAt, toScreenY);
            }
        }
    }
}
