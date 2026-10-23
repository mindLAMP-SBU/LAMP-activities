export interface Point {
    x: number;
    y: number;
}

/** Corners of an axis-aligned rectangle, clockwise from the top-left. */
export const rectPoints = (x: number, y: number, w: number, h: number): Point[] => [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
];

const project = (poly: Point[], ax: number, ay: number): [number, number] => {
    let min = Infinity;
    let max = -Infinity;
    for (const p of poly) {
        const d = p.x * ax + p.y * ay;
        if (d < min) min = d;
        if (d > max) max = d;
    }
    return [min, max];
};

/** Separating-axis test: true if two convex polygons overlap. */
export function polygonsIntersect(a: Point[], b: Point[]): boolean {
    for (const poly of [a, b]) {
        for (let i = 0; i < poly.length; i++) {
            const p1 = poly[i];
            const p2 = poly[(i + 1) % poly.length];
            // Edge normal
            const ax = p1.y - p2.y;
            const ay = p2.x - p1.x;
            const [minA, maxA] = project(a, ax, ay);
            const [minB, maxB] = project(b, ax, ay);
            if (maxA < minB || maxB < minA) return false;
        }
    }
    return true;
}
