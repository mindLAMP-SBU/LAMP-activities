import React from "react";
import { HORIZON, ROAD_BOTTOM, depthToY, roadBand, roadHalfWidth } from "./roadGeometry";

/**
 * The "road-normal" scene: an ordinary two-way road running away from the
 * viewer, with sky, verge and lane markings. Assets are drawn into it.
 *
 * A scene owns only the backdrop. It takes the assets' SVG as `children` and
 * their DOM layers as `overlay`, and knows nothing about which assets those
 * are, so any scene can host any asset.
 */

const edgeInset = (y: number) => roadHalfWidth(y) - roadHalfWidth(y) * 0.05;
const dashHalf = (y: number) => roadHalfWidth(y) * 0.035;

// Dashes are spaced by depth rather than by screen distance, so they bunch up
// toward the horizon the way real lane markings do.
const DASHES = Array.from({ length: 6 }, (_, i) => {
  const a = 0.12 + i * 0.155;
  return [depthToY(a), depthToY(a + 0.09)] as const;
});

export interface SceneProps {
  /** Asset SVG, drawn inside the scene's own viewBox. */
  children?: React.ReactNode;
  /** Asset DOM layers, drawn over the stage. */
  overlay?: React.ReactNode;
  label: string;
}

export const RoadNormal: React.FC<SceneProps> = ({ children, overlay, label }) => (
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

    {overlay && <div className="st-overlay">{overlay}</div>}
  </div>
);
