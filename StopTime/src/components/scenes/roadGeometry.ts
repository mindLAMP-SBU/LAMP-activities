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

// ── Single-lane POV ───────────────────────────────────────────────────────
//
// The "road-single-lane" scene puts the viewer in the middle of their own
// lane of an ordinary two-lane road, so that lane fills most of the view. Its
// edges share the vanishing point above. The oncoming lane lies beyond the
// centre line to the left, and a narrow paved shoulder to the right.

/** Half-width of the viewer's own lane at a given screen y, in viewBox units. */
export const laneHalfWidth = (y: number): number =>
  6 + ((y - HORIZON) / (ROAD_BOTTOM - HORIZON)) * 196;

/** Width of each paved shoulder, as a multiple of the lane half-width. */
export const SHOULDER = 0.9;

/** Screen x of the right-hand lane line at a given y. */
export const laneRightX = (y: number): number => ROAD_CENTER + laneHalfWidth(y);

/** Screen x of the outer edge of the right-hand shoulder at a given y. */
export const shoulderOuterX = (y: number): number => laneRightX(y) + SHOULDER * laneHalfWidth(y);

/** Screen x of the centre line, between our lane and the oncoming one. */
export const centerLineX = (y: number): number => ROAD_CENTER - laneHalfWidth(y);

/** Screen x of the oncoming lane's edge line, on the far left. */
export const farEdgeX = (y: number): number => ROAD_CENTER - 3 * laneHalfWidth(y);

/** Screen x of the outer edge of the far-left shoulder. */
export const farShoulderOuterX = (y: number): number => farEdgeX(y) - SHOULDER * laneHalfWidth(y);

/**
 * How large something standing at screen y is drawn, relative to the same
 * thing at the very bottom of the view. Lets an asset size a cone or a deer
 * for its depth.
 */
export const depthScale = (y: number): number => laneHalfWidth(y) / laneHalfWidth(ROAD_BOTTOM);

/** A quad between two lateral offsets from the road centre, given as functions of y. */
export const quad = (
  yFar: number,
  yNear: number,
  left: (y: number) => number,
  right: (y: number) => number
): string =>
  [
    [left(yFar), yFar],
    [right(yFar), yFar],
    [right(yNear), yNear],
    [left(yNear), yNear],
  ]
    .map((p) => p.join(","))
    .join(" ");
