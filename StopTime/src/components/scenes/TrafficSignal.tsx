import React from "react";

/**
 * The mast that the traffic signal hangs from.
 *
 * The signal head itself is not drawn here — it is the SimpleRT `TrafficLight`
 * component, rendered as a DOM overlay on top of the stage so both activities
 * show the participant the same light. This SVG only supplies the pole and arm
 * that put it over the road.
 */
export type SignalState = "green" | "yellow" | "red";

const POLE = "#6B6F76";
const POLE_DARK = "#4A4E55";

export const SignalPole: React.FC<{ approaching?: boolean }> = ({ approaching }) => (
  <g className={approaching ? "st-subject st-subject-far" : "st-subject"}>
    {/* upright, planted on the verge just off the right-hand edge */}
    <rect x="432" y="36" width="18" height="311" rx="5" fill={POLE} />
    <rect x="432" y="36" width="6" height="311" fill={POLE_DARK} opacity="0.45" />
    <rect x="422" y="340" width="38" height="11" rx="4" fill={POLE_DARK} />

    {/* arm reaching out over the carriageway */}
    <rect x="244" y="34" width="196" height="13" rx="6" fill={POLE} />
    <rect x="244" y="34" width="196" height="4" rx="2" fill="#8B8F96" opacity="0.6" />

    {/* hanger the signal head is bolted to */}
    <rect x="245" y="45" width="11" height="18" fill={POLE_DARK} />
  </g>
);
