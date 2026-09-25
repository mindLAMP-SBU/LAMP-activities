import React from "react";
import { ROAD_CENTER, roadHalfWidth } from "./SceneStage";

/**
 * A marked crossing with someone beside it.
 *
 *   waiting  — waiting on the sidewalk beside the crossing → SLOW DOWN
 *   crossing — stepped out onto the crosswalk            → STOP
 *
 * Two states by design. Somebody standing by a crossing is reason enough to be
 * ready to slow, so there is no case here where continuing at speed is right.
 */
export type PedestrianState = "waiting" | "crossing";

const COLORS = {
  sidewalk: "#D9D5CC",
  sidewalkEdge: "#B6B1A6",
  curb: "#EFEDE7",
  stripe: "#F2F0EA",
  coat: "#C0392B",
  coatDark: "#9B2D22",
  trousers: "#33415C",
  shoe: "#242424",
  skin: "#E0A87E",
  hair: "#3A2A1E",
  bag: "#7D5A3C",
};

interface Props {
  state: PedestrianState;
  /** True while the scene is still "in the distance", before the cue is shown. */
  approaching?: boolean;
}

/** A quad spanning two lateral fractions of the road between two depths. */
const band = (f0: number, f1: number, yFar: number, yNear: number): string => {
  const far = roadHalfWidth(yFar);
  const near = roadHalfWidth(yNear);
  return [
    [ROAD_CENTER + f0 * far, yFar],
    [ROAD_CENTER + f1 * far, yFar],
    [ROAD_CENTER + f1 * near, yNear],
    [ROAD_CENTER + f0 * near, yNear],
  ]
    .map((p) => p.join(","))
    .join(" ");
};

const CROSSING_FAR = 298;
const CROSSING_NEAR = 358;

// Seven bars laid side by side across the carriageway. From behind the wheel a
// zebra crossing reads as a row of stripes receding, not as lines across.
const STRIPES = [-0.78, -0.52, -0.26, 0, 0.26, 0.52, 0.78];
const STRIPE_HALF = 0.085;

/** Sidewalk edge at a given depth, just outside the right-hand road edge. */
const curbX = (y: number) => ROAD_CENTER + roadHalfWidth(y);
const walkX = (y: number) => ROAD_CENTER + roadHalfWidth(y) * 1.32;

export const Pedestrian: React.FC<Props> = ({ state, approaching }) => {
  const crossing = state === "crossing";

  return (
    <g className={approaching ? "st-subject st-subject-far" : "st-subject"}>
      {/* sidewalk running back along the right-hand verge */}
      <polygon
        points={[
          [curbX(250), 250],
          [walkX(250), 250],
          [walkX(400), 400],
          [curbX(400), 400],
        ]
          .map((p) => p.join(","))
          .join(" ")}
        fill={COLORS.sidewalk}
        stroke={COLORS.sidewalkEdge}
        strokeWidth="1.5"
      />
      {/* curb face */}
      <polygon
        points={[
          [curbX(250), 250],
          [curbX(250) + 4, 250],
          [curbX(400) + 12, 400],
          [curbX(400), 400],
        ]
          .map((p) => p.join(","))
          .join(" ")}
        fill={COLORS.curb}
      />

      {/* crosswalk */}
      {STRIPES.map((f) => (
        <polygon
          key={f}
          points={band(f - STRIPE_HALF, f + STRIPE_HALF, CROSSING_FAR, CROSSING_NEAR)}
          fill={COLORS.stripe}
        />
      ))}

      {/* The figure translates from the sidewalk out onto the crossing, so the
          step into the road is something you watch happen. */}
      <g
        style={{
          transform: crossing ? "translate(348px, 340px)" : "translate(450px, 330px)",
          transition: "transform 0.7s cubic-bezier(0.34, 1.1, 0.64, 1)",
        }}
      >
        {/* legs */}
        {crossing ? (
          <>
            <rect x="-15" y="-36" width="11" height="34" rx="4" fill={COLORS.trousers} transform="rotate(16 -9 -36)" />
            <rect x="3" y="-36" width="11" height="34" rx="4" fill={COLORS.trousers} transform="rotate(-14 9 -36)" />
            <rect x="-24" y="-5" width="16" height="7" rx="3" fill={COLORS.shoe} />
            <rect x="9" y="-5" width="16" height="7" rx="3" fill={COLORS.shoe} />
          </>
        ) : (
          <>
            <rect x="-11" y="-36" width="10" height="34" rx="4" fill={COLORS.trousers} />
            <rect x="1" y="-36" width="10" height="34" rx="4" fill={COLORS.trousers} />
            <rect x="-13" y="-4" width="13" height="6" rx="3" fill={COLORS.shoe} />
            <rect x="0" y="-4" width="13" height="6" rx="3" fill={COLORS.shoe} />
          </>
        )}

        {/* torso */}
        <rect x="-14" y="-75" width="28" height="42" rx="9" fill={COLORS.coat} />
        <rect x="-14" y="-75" width="9" height="42" rx="5" fill={COLORS.coatDark} opacity="0.55" />

        {/* arms */}
        {crossing ? (
          <>
            <rect x="-22" y="-72" width="9" height="30" rx="4" fill={COLORS.coatDark} transform="rotate(-22 -17 -72)" />
            <rect x="13" y="-72" width="9" height="30" rx="4" fill={COLORS.coatDark} transform="rotate(20 17 -72)" />
          </>
        ) : (
          <>
            <rect x="-22" y="-72" width="9" height="32" rx="4" fill={COLORS.coatDark} />
            <rect x="13" y="-72" width="9" height="32" rx="4" fill={COLORS.coatDark} />
            {/* a bag, held while waiting */}
            <rect x="-30" y="-42" width="14" height="16" rx="3" fill={COLORS.bag} />
          </>
        )}

        {/* head */}
        <circle cx="0" cy="-88" r="11" fill={COLORS.skin} />
        <path d="M-11 -90 a11 11 0 0 1 22 0 a11 6 0 0 0 -22 0 z" fill={COLORS.hair} />
      </g>
    </g>
  );
};
