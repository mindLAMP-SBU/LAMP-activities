import React from "react";
import { depthScale, depthToY, laneHalfWidth, laneRightX } from "./roadGeometry";

/**
 * A work zone along the right-hand edge: a line of cones on the shoulder, a
 * ROAD WORK AHEAD sign, and a flagger at the edge of the lane holding a
 * STOP/SLOW paddle.
 *
 *   slow — paddle shows SLOW → SLOW DOWN
 *   stop — paddle shows STOP → STOP
 *
 * Changing state turns the paddle round on its pole: the face showing narrows
 * to edge-on, then the other face opens out, so the change is something the
 * participant sees happen rather than a swap between frames.
 *
 * Laid out against the single-lane geometry; in road-normal it sits on the
 * verge just outside the right-hand edge line.
 */
export type ConstructionState = "slow" | "stop";

const COLORS = {
  cone: "#F26A1B",
  coneDark: "#C24E0C",
  coneBand: "#F6F6F2",
  coneBase: "#2A2A2A",
  vest: "#C6E83A",
  vestStripe: "#F4F4EE",
  shirt: "#3E4A5C",
  trousers: "#2F3A4E",
  boot: "#3A2B1E",
  skin: "#C68B62",
  hat: "#FFC72C",
  hatDark: "#D89A00",
  pole: "#8A8F96",
  signOrange: "#F28C1B",
  stopRed: "#D62828",
  white: "#FFFFFF",
  black: "#1A1A1A",
};

/** Where the flagger stands: at the lane's right edge, a little way ahead. */
const FLAGGER_Y = 316;
const FLAGGER_X = laneRightX(FLAGGER_Y) + laneHalfWidth(FLAGGER_Y) * 0.32;
const FLAGGER_SCALE = 1.75 * depthScale(FLAGGER_Y);

const SIGN_Y = 234;
const SIGN_X = laneRightX(SIGN_Y) + laneHalfWidth(SIGN_Y) * 1.3;

// Cones spaced evenly in depth along the shoulder, just outside the edge line.
const CONES = Array.from({ length: 9 }, (_, i) => depthToY(0.2 + i * 0.1))
  .map((y) => ({ x: laneRightX(y) + laneHalfWidth(y) * 0.18, y }))
  .filter((c) => Math.abs(c.y - FLAGGER_Y) > 10);

interface Props {
  state: ConstructionState;
  /** True while the scene is still "in the distance", before the cue is shown. */
  approaching?: boolean;
}

/** A traffic cone, standing at (x, y), drawn at a size for its depth. */
const Cone: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y}) scale(${depthScale(y)})`}>
    <ellipse cx="0" cy="0" rx="30" ry="5" fill="#000" opacity="0.18" />
    <rect x="-26" y="-7" width="52" height="8" rx="2" fill={COLORS.coneBase} />
    <polygon points="-18,-7 18,-7 5,-70 -5,-70" fill={COLORS.cone} />
    <polygon points="-18,-7 -6,-7 -2,-70 -5,-70" fill={COLORS.coneDark} opacity="0.5" />
    <polygon points="-13.5,-28 13.5,-28 11.4,-38 -11.4,-38" fill={COLORS.coneBand} />
    <polygon points="-9,-48 9,-48 7.3,-56 -7.3,-56" fill={COLORS.coneBand} />
  </g>
);

/** One face of the paddle, centred on (0, 0). */
const PaddleFace: React.FC<{ face: ConstructionState; shown: boolean }> = ({ face, shown }) => (
  <g
    style={{
      transformOrigin: "0px 0px",
      transform: shown ? "scaleX(1)" : "scaleX(0)",
      // The outgoing face closes first; the incoming one opens once it has.
      transition: shown ? "transform 0.22s ease-out 0.22s" : "transform 0.22s ease-in",
    }}
  >
    {face === "stop" ? (
      <>
        <polygon
          points="-22,-9 -9,-22 9,-22 22,-9 22,9 9,22 -9,22 -22,9"
          fill={COLORS.stopRed}
          stroke={COLORS.white}
          strokeWidth="2.5"
        />
        <text x="0" y="4.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700" fill={COLORS.white}>
          STOP
        </text>
      </>
    ) : (
      <>
        <polygon points="0,-24 24,0 0,24 -24,0" fill={COLORS.signOrange} stroke={COLORS.black} strokeWidth="2" />
        <text x="0" y="4.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill={COLORS.black}>
          SLOW
        </text>
      </>
    )}
  </g>
);

const Flagger: React.FC<{ state: ConstructionState }> = ({ state }) => (
  <g transform={`translate(${FLAGGER_X} ${FLAGGER_Y}) scale(${FLAGGER_SCALE})`}>
    <ellipse cx="0" cy="0" rx="22" ry="4" fill="#000" opacity="0.2" />

    {/* legs and boots, with reflective bands */}
    <rect x="-11" y="-38" width="10" height="36" rx="4" fill={COLORS.trousers} />
    <rect x="1" y="-38" width="10" height="36" rx="4" fill={COLORS.trousers} />
    <rect x="-13" y="-5" width="13" height="7" rx="3" fill={COLORS.boot} />
    <rect x="0" y="-5" width="13" height="7" rx="3" fill={COLORS.boot} />
    <rect x="-11" y="-20" width="10" height="3" fill={COLORS.vestStripe} />
    <rect x="1" y="-20" width="10" height="3" fill={COLORS.vestStripe} />

    {/* shirt, then the hi-vis vest over it */}
    <rect x="-15" y="-78" width="30" height="44" rx="9" fill={COLORS.shirt} />
    <rect x="-14" y="-76" width="28" height="40" rx="7" fill={COLORS.vest} />
    <rect x="-14" y="-58" width="28" height="4" fill={COLORS.vestStripe} />
    <rect x="-14" y="-48" width="28" height="4" fill={COLORS.vestStripe} />
    <rect x="-8" y="-76" width="4" height="22" fill={COLORS.vestStripe} />
    <rect x="4" y="-76" width="4" height="22" fill={COLORS.vestStripe} />

    {/* left arm (viewer's right) down at the side */}
    <rect x="13" y="-74" width="9" height="32" rx="4" fill={COLORS.vest} />
    <circle cx="17.5" cy="-41" r="4.5" fill={COLORS.skin} />

    {/* right arm (viewer's left) holding the paddle pole out toward the lane */}
    <rect x="-34" y="-66" width="22" height="9" rx="4" fill={COLORS.vest} transform="rotate(-20 -14 -66)" />
    <rect x="-36.5" y="-120" width="3" height="118" fill={COLORS.pole} />
    <circle cx="-35" cy="-60" r="4.5" fill={COLORS.skin} />

    {/* the paddle, both faces, at the top of the pole */}
    <g transform="translate(-35 -128)">
      <PaddleFace face="slow" shown={state === "slow"} />
      <PaddleFace face="stop" shown={state === "stop"} />
    </g>

    {/* head and hard hat */}
    <circle cx="0" cy="-90" r="11" fill={COLORS.skin} />
    <path d="M-13 -94 a13 12 0 0 1 26 0 z" fill={COLORS.hat} />
    <rect x="-16" y="-96" width="32" height="4" rx="2" fill={COLORS.hatDark} />
  </g>
);

export const ConstructionZone: React.FC<Props> = ({ state, approaching }) => {
  const far = CONES.filter((c) => c.y < FLAGGER_Y);
  const near = CONES.filter((c) => c.y >= FLAGGER_Y);

  return (
    <g className={approaching ? "st-subject st-subject-far" : "st-subject"}>
      {/* ROAD WORK AHEAD sign, further up the shoulder */}
      <g transform={`translate(${SIGN_X} ${SIGN_Y}) scale(${1.6 * depthScale(SIGN_Y)})`}>
        <rect x="-2" y="-62" width="4" height="62" fill={COLORS.pole} />
        <g transform="translate(0 -78)">
          <polygon points="0,-30 30,0 0,30 -30,0" fill={COLORS.signOrange} stroke={COLORS.black} strokeWidth="2" />
          <text textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="700" fill={COLORS.black}>
            <tspan x="0" y="-6">ROAD</tspan>
            <tspan x="0" y="3">WORK</tspan>
            <tspan x="0" y="12">AHEAD</tspan>
          </text>
        </g>
      </g>

      {/* drawn far to near so nearer cones overlap the ones behind them */}
      {far.map((c) => (
        <Cone key={c.y} x={c.x} y={c.y} />
      ))}
      <Flagger state={state} />
      {near.map((c) => (
        <Cone key={c.y} x={c.x} y={c.y} />
      ))}
    </g>
  );
};
