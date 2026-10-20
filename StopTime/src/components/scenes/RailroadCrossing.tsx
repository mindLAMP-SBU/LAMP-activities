import React from "react";
import { centerLineX, farShoulderOuterX, laneRightX, quad, shoulderOuterX } from "./roadGeometry";

/**
 * A level crossing: tracks across the road, and on the right-hand shoulder a
 * signal mast with a crossbuck, twin flashing lamps and a gate arm.
 *
 *   idle     — lamps dark, gate raised                      → CONTINUE
 *   flashing — lamps alternating, gate still raised         → STOP
 *   gates    — lamps alternating, gate lowered across lane  → STOP
 *
 * The gate pivots down from upright when it moves to `gates`, so a trial can
 * show the warning start and then the arm come down.
 */
export type RailroadState = "idle" | "flashing" | "gates";

const COLORS = {
  mast: "#9AA0A8",
  mastDark: "#6E747C",
  black: "#1A1A1A",
  white: "#F6F6F2",
  red: "#D62828",
  lampOff: "#5E1A1E",
  lampOn: "#FF3B30",
  ballast: "#8A8178",
  tie: "#5B4636",
  panel: "#9D9890",
  rail: "#3D3D42",
  railTop: "#C8C8CC",
};

/** Foot of the mast; the gate pivots from partway up it. */
const MAST_X = 425;
const MAST_FOOT = 330;
const PIVOT: [number, number] = [416, 250];
const ARM_LENGTH = 300;

/** The crossing itself, a little further ahead than the gate. */
const TRACK_FAR = 286;
const TRACK_NEAR = 310;
const RAILS = [292, 304];
const TIES = Array.from({ length: 37 }, (_, i) => i * 14);

const STOP_LINE: [number, number] = [340, 347];

interface Props {
  state: RailroadState;
  /** True while the scene is still "in the distance", before the cue is shown. */
  approaching?: boolean;
}

/** One signal lamp with its black backplate and hood. */
const SignalLamp: React.FC<{ cx: number; cy: number; on: boolean; beat: "a" | "b" }> = ({ cx, cy, on, beat }) => (
  <g>
    <circle cx={cx} cy={cy} r="17" fill={COLORS.black} />
    <circle cx={cx} cy={cy} r="17" fill="none" stroke={COLORS.white} strokeWidth="1.5" />
    <circle cx={cx} cy={cy} r="10" fill={COLORS.lampOff} />
    <circle cx={cx} cy={cy} r="10" fill={COLORS.lampOn} opacity="0.15" />
    <path d={`M${cx - 12} ${cy - 10} Q${cx} ${cy - 20} ${cx + 12} ${cy - 10}`} stroke={COLORS.black} strokeWidth="4" fill="none" />
    {on && (
      <g className={beat === "a" ? "st-flash-a" : "st-flash-b"}>
        <circle cx={cx} cy={cy} r="10" fill={COLORS.lampOn} />
        <circle cx={cx} cy={cy} r="20" fill={COLORS.lampOn} opacity="0.3" />
      </g>
    )}
  </g>
);

/** One crossbuck board, rotated about the crossbuck's centre. */
const CrossbuckBoard: React.FC<{ angle: number; text: string }> = ({ angle, text }) => (
  <g transform={`rotate(${angle} ${MAST_X} 92)`}>
    <rect x={MAST_X - 48} y={83} width="96" height="18" rx="2" fill={COLORS.white} stroke={COLORS.black} strokeWidth="1.5" />
    <text x={MAST_X} y={96} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10.5" fontWeight="700" fill={COLORS.black} letterSpacing="0.5">
      {text}
    </text>
  </g>
);

export const RailroadCrossing: React.FC<Props> = ({ state, approaching }) => {
  const warning = state !== "idle";
  const down = state === "gates";

  return (
    <g className={approaching ? "st-subject st-subject-far" : "st-subject"}>
      {/* the tracks: ballast and ties across the whole view, a smooth crossing
          panel where they meet the road, then the two rails */}
      <rect x="-20" y={TRACK_FAR} width="540" height={TRACK_NEAR - TRACK_FAR} fill={COLORS.ballast} />
      {TIES.map((x) => (
        <rect key={x} x={x} y={TRACK_FAR + 2} width="7" height={TRACK_NEAR - TRACK_FAR - 4} fill={COLORS.tie} />
      ))}
      <polygon
        points={quad(TRACK_FAR, TRACK_NEAR, farShoulderOuterX, shoulderOuterX)}
        fill={COLORS.panel}
      />
      {RAILS.map((y) => (
        <g key={y}>
          <rect x="-20" y={y - 1.5} width="540" height="3.5" fill={COLORS.rail} />
          <rect x="-20" y={y - 1.5} width="540" height="1.2" fill={COLORS.railTop} />
        </g>
      ))}

      {/* stop line across our lane, short of the gate */}
      <polygon points={quad(STOP_LINE[0], STOP_LINE[1], centerLineX, laneRightX)} fill={COLORS.white} />

      {/* mast */}
      <rect x={MAST_X - 5} y="70" width="10" height={MAST_FOOT - 70} fill={COLORS.mast} />
      <rect x={MAST_X - 5} y="70" width="3" height={MAST_FOOT - 70} fill={COLORS.mastDark} opacity="0.5" />
      <rect x={MAST_X - 16} y={MAST_FOOT - 8} width="32" height="12" rx="2" fill={COLORS.mastDark} />

      {/* crossbuck */}
      <CrossbuckBoard angle={35} text="RAILROAD" />
      <CrossbuckBoard angle={-35} text="CROSSING" />

      {/* lamp crossarm */}
      <rect x={MAST_X - 44} y="148" width="88" height="6" rx="2" fill={COLORS.black} />
      <SignalLamp cx={MAST_X - 30} cy={151} on={warning} beat="a" />
      <SignalLamp cx={MAST_X + 30} cy={151} on={warning} beat="b" />

      {/* gate mechanism */}
      <rect x={MAST_X - 13} y={PIVOT[1] - 14} width="26" height="34" rx="3" fill={COLORS.mastDark} />

      {/* gate arm: upright when raised, swung down across the lane when lowered */}
      <g transform={`translate(${PIVOT[0]} ${PIVOT[1]})`}>
        <g
          style={{
            transformOrigin: "0px 0px",
            transform: down ? "rotate(0deg)" : "rotate(84deg)",
            transition: "transform 1.6s cubic-bezier(0.45, 0, 0.35, 1)",
          }}
        >
          <rect x={-ARM_LENGTH} y="-4" width={ARM_LENGTH} height="8" rx="2" fill={COLORS.white} stroke="#8a8a8a" strokeWidth="0.75" />
          {Array.from({ length: 6 }, (_, i) => (
            <polygon
              key={i}
              points={`${-30 - i * 48},-4 ${-6 - i * 48},-4 ${-14 - i * 48},4 ${-38 - i * 48},4`}
              fill={COLORS.red}
            />
          ))}
          {/* counterweight */}
          <rect x="4" y="-7" width="22" height="14" rx="2" fill={COLORS.black} />
          {/* arm lamps, lit while the warning is on */}
          {[-90, -190, -290].map((x, i) => (
            <g key={x}>
              <circle cx={x} cy="-7" r="3.5" fill={COLORS.lampOff} />
              {warning && (
                <circle cx={x} cy="-7" r="3.5" fill={COLORS.lampOn} className={i % 2 ? "st-flash-b" : "st-flash-a"} />
              )}
            </g>
          ))}
        </g>
      </g>
    </g>
  );
};
