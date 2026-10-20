import React from "react";
import { depthScale, laneHalfWidth, shoulderOuterX } from "./roadGeometry";

/**
 * A deer, seen side-on.
 *
 *   roadside — standing on the verge at the road's edge, head up → SLOW DOWN
 *   crossing — bounding out across the lane ahead               → STOP
 *
 * On `crossing` the deer travels from the verge into the middle of the lane,
 * then keeps running in place there, the same way the pedestrian keeps
 * walking on the crossing.
 */
export type DeerState = "roadside" | "crossing";

const COLORS = {
  coat: "#8B5A2B",
  coatLight: "#A8723E",
  coatDark: "#6B4320",
  belly: "#E8D6B8",
  tail: "#F4EEE2",
  hoof: "#2A1E14",
  nose: "#1E1712",
  eye: "#120C08",
};

/** The depth the deer stands and crosses at. */
const DEER_Y = 268;
const DEER_SCALE = 1.45 * depthScale(DEER_Y);
const VERGE_X = shoulderOuterX(DEER_Y) + 12;
const LANE_X = 250 - laneHalfWidth(DEER_Y) * 0.2;

interface Props {
  state: DeerState;
  /** True while the scene is still "in the distance", before the cue is shown. */
  approaching?: boolean;
}

/** One leg, hanging from the body down to the ground. */
const Leg: React.FC<{ x: number; phase: "a" | "b"; running: boolean; far?: boolean }> = ({
  x,
  phase,
  running,
  far,
}) => (
  <g className={running ? `st-walk-limb st-gallop st-walk-${phase}` : undefined}>
    <rect x={x - 2.75} y={-46} width="5.5" height="42" rx="2.5" fill={far ? COLORS.coatDark : COLORS.coat} />
    <rect x={x - 3} y={-6} width="6" height="6" rx="1.5" fill={COLORS.hoof} />
  </g>
);

export const Deer: React.FC<Props> = ({ state, approaching }) => {
  const running = state === "crossing";

  return (
    <g className={approaching ? "st-subject st-subject-far" : "st-subject"}>
      <g
        style={{
          transformBox: "view-box",
          transformOrigin: "0px 0px",
          transform: `translate(${running ? LANE_X : VERGE_X}px, ${DEER_Y}px) scale(${DEER_SCALE})`,
          transition: "transform 1.1s cubic-bezier(0.3, 0.1, 0.4, 1)",
        }}
      >
        <ellipse cx="0" cy="0" rx="46" ry="5" fill="#000" opacity="0.18" />

        <g className={running ? "st-walk-body st-gallop-body" : undefined}>
          {/* far-side legs, darker, behind the body */}
          <Leg x={-22} phase="b" running={running} far />
          <Leg x={30} phase="a" running={running} far />

          {/* body */}
          <ellipse cx="2" cy="-56" rx="42" ry="17" fill={COLORS.coat} />
          <ellipse cx="2" cy="-46" rx="34" ry="7" fill={COLORS.belly} />
          <ellipse cx="-4" cy="-64" rx="30" ry="6" fill={COLORS.coatLight} opacity="0.6" />

          {/* tail, white underside flagged up */}
          <ellipse cx="44" cy="-64" rx="5" ry="8" fill={COLORS.tail} transform="rotate(25 44 -64)" />
          <ellipse cx="45" cy="-67" rx="3" ry="6" fill={COLORS.coatDark} transform="rotate(25 45 -67)" />

          {/* near-side legs, in front of the body */}
          <Leg x={-30} phase="a" running={running} />
          <Leg x={22} phase="b" running={running} />

          {/* neck and head, facing left toward the road */}
          <polygon points="-26,-66 -40,-66 -52,-100 -40,-104" fill={COLORS.coat} />
          <polygon points="-36,-70 -42,-70 -50,-96 -46,-98" fill={COLORS.belly} opacity="0.7" />
          <ellipse cx="-54" cy="-104" rx="13" ry="8" fill={COLORS.coat} transform="rotate(12 -54 -104)" />
          <ellipse cx="-66" cy="-101" rx="5" ry="4" fill={COLORS.coatLight} />
          <circle cx="-70" cy="-101" r="2.4" fill={COLORS.nose} />
          <circle cx="-52" cy="-107" r="1.8" fill={COLORS.eye} />
          {/* ears */}
          <ellipse cx="-44" cy="-116" rx="4" ry="9" fill={COLORS.coatDark} transform="rotate(25 -44 -116)" />
          <ellipse cx="-50" cy="-117" rx="4" ry="9" fill={COLORS.coat} transform="rotate(-10 -50 -117)" />
          <ellipse cx="-50" cy="-117" rx="2" ry="6" fill={COLORS.belly} transform="rotate(-10 -50 -117)" />
        </g>
      </g>
    </g>
  );
};
