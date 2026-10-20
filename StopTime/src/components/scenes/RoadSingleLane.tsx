import React from "react";
import {
  HORIZON,
  ROAD_BOTTOM,
  centerLineX,
  depthToY,
  farEdgeX,
  farShoulderOuterX,
  laneHalfWidth,
  laneRightX,
  quad,
  shoulderOuterX,
} from "./roadGeometry";
import { SceneProps } from "./RoadNormal";

/**
 * The "road-single-lane" scene: the view from behind the wheel on an ordinary
 * two-lane American road. The viewer's lane fills most of the frame. To the
 * left is a double yellow centre line and the oncoming lane; to the right a
 * white edge line and a narrow paved shoulder. Utility poles run along the far
 * side and a few trees stand well back on the right, so the verge stays clear
 * for assets that stand there.
 *
 * Like RoadNormal it owns only the backdrop; assets come in as children.
 */

const COLORS = {
  asphalt: "#55565B",
  asphaltNear: "#4A4B50",
  shoulder: "#626368",
  white: "#F4F3EE",
  yellow: "#F2C21B",
  grassFar: "#8DB06B",
  grassNear: "#A9C886",
  treeLine: "#5F8048",
  canopy: "#4E7A3A",
  canopyLight: "#629048",
  trunk: "#5B4632",
  pole: "#7A5F45",
  wire: "#2E2E2E",
};

const lane = laneHalfWidth;
const lineHalf = (y: number) => lane(y) * 0.03;
/** A painted line centred on `x`, from the horizon to the bottom of the view. */
const line = (x: (y: number) => number) =>
  quad(HORIZON, ROAD_BOTTOM, (y) => x(y) - lineHalf(y), (y) => x(y) + lineHalf(y));
// The two strokes of the double yellow, either side of the centre line.
const yellowOffset = (y: number) => lane(y) * 0.055;

/** Something `m` metres tall standing at screen y, in viewBox units. */
const metres = (y: number, m: number) => (m * lane(y)) / 1.8;

// Utility poles along the far side of the oncoming lane.
const POLES = [0.12, 0.2, 0.28, 0.36, 0.44, 0.52, 0.6].map((u) => {
  const y = depthToY(u);
  const x = farShoulderOuterX(y) - lane(y) * 0.6;
  const top = y - metres(y, 9);
  const arm = metres(y, 1.1);
  return { y, x, top, arm, w: Math.max(1, metres(y, 0.3)) };
});

// Trees set back from the right-hand side of the road, far to near. The left
// side is left to the poles.
const TREES = [
  { u: 0.14, off: 3.2, h: 10 },
  { u: 0.24, off: 3.6, h: 12 },
].map(({ u, off, h }) => {
  const y = depthToY(u);
  return { y, x: 250 + lane(y) * off, h: metres(y, h) };
});

const Tree: React.FC<{ x: number; y: number; h: number }> = ({ x, y, h }) => (
  <g>
    <rect x={x - h * 0.04} y={y - h * 0.45} width={h * 0.08} height={h * 0.45} fill={COLORS.trunk} />
    <circle cx={x - h * 0.16} cy={y - h * 0.58} r={h * 0.24} fill={COLORS.canopy} />
    <circle cx={x + h * 0.17} cy={y - h * 0.6} r={h * 0.22} fill={COLORS.canopy} />
    <circle cx={x} cy={y - h * 0.78} r={h * 0.26} fill={COLORS.canopyLight} />
  </g>
);

export const RoadSingleLane: React.FC<SceneProps> = ({ children, overlay, label }) => (
  <div className="st-stage">
    <svg viewBox="0 0 500 400" width="100%" height="100%" role="img" aria-label={label}>
      <defs>
        <linearGradient id="st-sl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9FCBEF" />
          <stop offset="100%" stopColor="#E3F0FA" />
        </linearGradient>
        <linearGradient id="st-sl-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.grassFar} />
          <stop offset="100%" stopColor={COLORS.grassNear} />
        </linearGradient>
        <linearGradient id="st-sl-asphalt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.asphalt} />
          <stop offset="100%" stopColor={COLORS.asphaltNear} />
        </linearGradient>
      </defs>

      {/* sky, a wooded horizon, and the ground */}
      <rect x="0" y="0" width="500" height={HORIZON} fill="url(#st-sl-sky)" />
      <path
        d={`M0 ${HORIZON} L0 184 Q14 174 30 180 Q44 168 62 177 Q80 170 96 179 Q114 166 134 176 Q152 170 168 180 Q186 172 204 182 Q222 178 238 190 L262 190 Q278 176 296 182 Q312 168 332 177 Q350 170 366 179 Q384 166 404 175 Q422 170 438 178 Q456 166 474 176 Q488 172 500 178 L500 ${HORIZON} Z`}
        fill={COLORS.treeLine}
      />
      <rect x="0" y={HORIZON} width="500" height={ROAD_BOTTOM - HORIZON} fill="url(#st-sl-ground)" />

      {TREES.map((t) => (
        <Tree key={`${t.x}-${t.y}`} x={t.x} y={t.y} h={t.h} />
      ))}

      {/* paved width: shoulders, then both travel lanes over them */}
      <polygon points={quad(HORIZON, ROAD_BOTTOM, farShoulderOuterX, shoulderOuterX)} fill={COLORS.shoulder} />
      <polygon points={quad(HORIZON, ROAD_BOTTOM, farEdgeX, laneRightX)} fill="url(#st-sl-asphalt)" />

      {/* white edge lines, double yellow centre line */}
      <polygon points={line(farEdgeX)} fill={COLORS.white} />
      <polygon points={line(laneRightX)} fill={COLORS.white} />
      <polygon points={line((y) => centerLineX(y) - yellowOffset(y))} fill={COLORS.yellow} />
      <polygon points={line((y) => centerLineX(y) + yellowOffset(y))} fill={COLORS.yellow} />

      {/* utility poles and the wires strung between them, far to near */}
      {POLES.map((p, i) => {
        const next = POLES[i + 1];
        return (
          <g key={p.y}>
            <rect x={p.x - p.w / 2} y={p.top} width={p.w} height={p.y - p.top} fill={COLORS.pole} />
            <rect x={p.x - p.arm} y={p.top + p.w * 2} width={p.arm * 2} height={Math.max(1, p.w * 0.6)} fill={COLORS.pole} />
            {next &&
              [-0.85, 0.85].map((f) => {
                const [x1, y1] = [p.x + f * p.arm, p.top + p.w * 2];
                const [x2, y2] = [next.x + f * next.arm, next.top + next.w * 2];
                const sag = (y2 - y1) * 0.1 + (x1 - x2) * 0.04;
                return (
                  <path
                    key={f}
                    d={`M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + sag} ${x2} ${y2}`}
                    stroke={COLORS.wire}
                    strokeWidth="0.8"
                    fill="none"
                  />
                );
              })}
          </g>
        );
      })}

      {children}
    </svg>

    {overlay && <div className="st-overlay">{overlay}</div>}
  </div>
);
