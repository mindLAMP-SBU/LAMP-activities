import React from "react";

/**
 * The shared backdrop every scenario is drawn onto.
 *
 * The road recedes away from the viewer toward a vanishing point on the
 * horizon, because the participant is sitting behind the wheel looking down
 * the road at whatever is ahead of them. Everything else in a scene is
 * positioned against the helpers exported here, so a crosswalk or a signal
 * pole lands on the tarmac at the right width for its depth.
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

const edgeInset = (y: number) => roadHalfWidth(y) - roadHalfWidth(y) * 0.05;
const dashHalf = (y: number) => roadHalfWidth(y) * 0.035;

// Dashes are spaced by depth rather than by screen distance, so they bunch up
// toward the horizon the way real lane markings do.
const DASHES = Array.from({ length: 6 }, (_, i) => {
  const a = 0.12 + i * 0.155;
  return [depthToY(a), depthToY(a + 0.09)] as const;
});

interface Props {
  children: React.ReactNode;
  label: string;
  /** DOM overlay drawn on top of the SVG, used for the traffic signal head. */
  overlay?: React.ReactNode;
  /** True while the scene is still in the distance, before the cue lands. */
  approaching?: boolean;
}

export const SceneStage: React.FC<Props> = ({ children, label, overlay, approaching }) => (
  <div className="st-stage">
    <svg viewBox="0 0 500 400" width="100%" height="100%" role="img" aria-label={label}>
      <defs>
        <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BFDFF5" />
          <stop offset="100%" stopColor="#EAF4FB" />
        </linearGradient>
        <linearGradient id="st-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A8C489" />
          <stop offset="100%" stopColor="#C3D8A6" />
        </linearGradient>
      </defs>

      {/* sky and the ground it meets at the horizon */}
      <rect x="0" y="0" width="500" height={HORIZON} fill="url(#st-sky)" />
      <rect x="0" y={HORIZON} width="500" height={ROAD_BOTTOM - HORIZON} fill="url(#st-ground)" />

      {/* carriageway: white first, then asphalt inset over it, which leaves the
          two edge lines converging on the vanishing point */}
      <polygon points={roadBand(HORIZON, ROAD_BOTTOM)} fill="#F2F0EA" />
      <polygon points={roadBand(HORIZON, ROAD_BOTTOM, edgeInset)} fill="#5A5A5F" />

      {/* centre line */}
      {DASHES.map(([yFar, yNear]) => (
        <polygon key={yFar} points={roadBand(yFar, yNear, dashHalf)} fill="#F2E9A0" />
      ))}

      {children}
    </svg>

    {overlay && (
      <div className={"st-overlay" + (approaching ? " st-overlay-far" : "")}>{overlay}</div>
    )}
  </div>
);
