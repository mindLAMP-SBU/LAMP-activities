/**
 * Shared road geometry for the road scenes.
 *
 * The road recedes away from the viewer toward a vanishing point on the
 * horizon, because the participant is sitting behind the wheel looking down
 * the road at whatever is ahead of them. Assets position themselves against
 * these helpers, so a crosswalk or a signal pole lands on the tarmac at the
 * right width for its depth.
 *
 * This lives apart from any one scene so that assets can be placed on the road
 * without importing the scene they happen to be drawn in.
 */

export const HORIZON = 200;
export const ROAD_BOTTOM = 400;
export const ROAD_CENTER = 250;

/** Half-width of the carriageway at a given screen y, in viewBox units. */
export const roadHalfWidth = (y: number): number =>
  14 + ((y - HORIZON) / (ROAD_BOTTOM - HORIZON)) * 240;

/** Maps a 0..1 depth (0 = at the horizon, 1 = at the viewer) to a screen y. */
export const depthToY = (u: number): number =>
  HORIZON + (ROAD_BOTTOM - HORIZON) * Math.pow(u, 1.9);

/** A band across the road between two depths, as an SVG points string. */
export const roadBand = (
  yFar: number,
  yNear: number,
  halfAt: (y: number) => number = roadHalfWidth
): string =>
  [
    [ROAD_CENTER - halfAt(yFar), yFar],
    [ROAD_CENTER + halfAt(yFar), yFar],
    [ROAD_CENTER + halfAt(yNear), yNear],
    [ROAD_CENTER - halfAt(yNear), yNear],
  ]
    .map((p) => p.join(","))
    .join(" ");
