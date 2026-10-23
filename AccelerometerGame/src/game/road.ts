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

const DOUBLE_LENGTH: [number, number] = [400, 900];
const DASHED_LENGTH: [number, number] = [900, 1500];

const randBetween = ([min, max]: [number, number]) => min + Math.random() * (max - min);

/** Start with a double yellow section ending somewhere ahead of z0, so the player has to wait to pass. */
export const createZones = (z0: number): LineZone[] => [
    { start: -Infinity, end: z0 + randBetween(DOUBLE_LENGTH), type: "double" },
];

/** Append alternating sections until the markings reach `upTo`, and drop sections that end before `from`. */
export function updateZones(zones: LineZone[], from: number, upTo: number): void {
    while (zones[zones.length - 1].end < upTo) {
        const last = zones[zones.length - 1];
        const type: LineType = last.type === "double" ? "dashed" : "double";
        const length = randBetween(type === "double" ? DOUBLE_LENGTH : DASHED_LENGTH);
        zones.push({ start: last.end, end: last.end + length, type });
    }
    while (zones.length > 1 && zones[0].end < from) {
        zones.shift();
    }
}

/** True if any part of [from, to] is marked with a double yellow line. */
export const isDoubleBetween = (zones: LineZone[], from: number, to: number): boolean =>
    zones.some((z) => z.type === "double" && z.start < to && z.end > from);

/** Draw the centre line between world distances zBottom and zTop. */
export function drawCenterLine(
    ctx: CanvasRenderingContext2D,
    zones: LineZone[],
    centerX: number,
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
            const y = toScreenY(hi);
            ctx.fillRect(centerX - 3.5, y, 2, hi - lo);
            ctx.fillRect(centerX + 1.5, y, 2, hi - lo);
        } else {
            // Dashes are anchored to world distance so they scroll with the road
            for (let k = Math.ceil((lo - dashLength) / dashGap); k * dashGap < hi; k++) {
                const dLo = Math.max(k * dashGap, lo);
                const dHi = Math.min(k * dashGap + dashLength, hi);
                if (dHi > dLo) ctx.fillRect(centerX - 1.25, toScreenY(dHi), 2.5, dHi - dLo);
            }
        }
    }
}
