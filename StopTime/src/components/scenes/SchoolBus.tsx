import React from "react";

/**
 * Rear view of a school bus.
 *
 *   driving — nothing lit, stop arm folded in      → CONTINUE
 *   amber   — amber roof lights alternating        → SLOW DOWN
 *   sign    — red roof lights + stop arm swung out → STOP
 *
 * Adapted from the BusAsset prototype: the demo's internal toggle button and
 * setInterval flasher are gone, so the scene is driven entirely by `state` and
 * the flashing is handled by CSS keyframes (see StopTime.css).
 */
export type BusState = "driving" | "amber" | "sign";

const COLORS = {
  busBody: "#FFC72C",
  busBodyDark: "#D89A00",
  roofCap: "#E0AF00",
  stripe: "#1A1A1A",
  window: "#8ECBE8",
  windowFrame: "#1A1A1A",
  tire: "#222222",
  bumper: "#585858",
  tailLight: "#B31217",
  tailLightOff: "#7a1114",
  stopRed: "#D62828",
  stopWhite: "#FFFFFF",
  lightAmberOn: "#FFB703",
  lightAmberOff: "#8a6a1f",
  lightRedOn: "#E63946",
  lightRedOff: "#6e2226",
  mirror: "#555555",
};

interface Props {
  state: BusState;
  /** True while the scene is still "in the distance", before the cue is shown. */
  approaching?: boolean;
}

/**
 * One roof lamp. The lens and its housing are always drawn, with a faint
 * residual glow so the lamp is findable even when dark; only the bright lit
 * state blinks on top. Blinking the lamp itself would make it vanish from the
 * bus every half second.
 */
const RoofLamp: React.FC<{
  cx: number;
  on: boolean;
  onColor: string;
  offColor: string;
  /** Which half of the flash cycle this lamp lights in. */
  beat: "a" | "b";
}> = ({ cx, on, onColor, offColor, beat }) => (
  <g>
    <circle cx={cx} cy="64" r="8.5" fill="#3A3A3A" />
    <circle cx={cx} cy="64" r="7" fill={offColor} />
    <circle cx={cx} cy="64" r="7" fill={onColor} opacity="0.18" />
    {on && (
      <g className={beat === "a" ? "st-flash-a" : "st-flash-b"}>
        <circle cx={cx} cy="64" r="7" fill={onColor} />
        <circle cx={cx} cy="64" r="15" fill={onColor} opacity="0.3" />
      </g>
    )}
  </g>
);

export const SchoolBus: React.FC<Props> = ({ state, approaching }) => {
  const amberOn = state === "amber";
  const redOn = state === "sign";
  const signOut = state === "sign";

  return (
    <g className={approaching ? "st-subject st-subject-far" : "st-subject"}>
      {/* side mirrors */}
      <rect x="96" y="118" width="44" height="6" rx="3" fill={COLORS.mirror} />
      <rect x="88" y="112" width="14" height="24" rx="3" fill={COLORS.mirror} stroke="#333" strokeWidth="1" />
      <rect x="360" y="118" width="44" height="6" rx="3" fill={COLORS.mirror} />
      <rect x="398" y="112" width="14" height="24" rx="3" fill={COLORS.mirror} stroke="#333" strokeWidth="1" />

      {/* bus body */}
      <rect x="140" y="70" width="220" height="210" rx="16" fill={COLORS.busBody} stroke={COLORS.busBodyDark} strokeWidth="3" />
      <rect x="140" y="70" width="220" height="16" rx="8" fill={COLORS.roofCap} />

      {/* rear window */}
      <rect x="178" y="92" width="144" height="66" rx="6" fill={COLORS.window} stroke={COLORS.windowFrame} strokeWidth="2.5" />
      <line x1="250" y1="94" x2="250" y2="156" stroke={COLORS.windowFrame} strokeWidth="2.5" />

      {/* SCHOOL BUS placard */}
      <rect x="168" y="166" width="164" height="20" rx="3" fill="#111111" />
      <text x="250" y="181" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fill="#FFD34D" letterSpacing="1.5">
        SCHOOL BUS
      </text>

      {/* safety stripes */}
      <rect x="140" y="196" width="220" height="10" fill={COLORS.stripe} />
      <rect x="140" y="276" width="220" height="10" fill={COLORS.stripe} />

      {/* rear emergency door */}
      <rect x="222" y="212" width="56" height="56" rx="4" fill="none" stroke={COLORS.busBodyDark} strokeWidth="2" />
      <circle cx="266" cy="240" r="2.5" fill={COLORS.busBodyDark} />

      {/* tail lights — lit once the bus is actually stopped */}
      <rect x="146" y="238" width="16" height="34" rx="4" fill={signOut ? COLORS.tailLight : COLORS.tailLightOff} stroke="#3a0a0a" strokeWidth="1.5" />
      <rect x="338" y="238" width="16" height="34" rx="4" fill={signOut ? COLORS.tailLight : COLORS.tailLightOff} stroke="#3a0a0a" strokeWidth="1.5" />

      {/* bumper + plate */}
      <rect x="128" y="288" width="244" height="16" rx="5" fill={COLORS.bumper} />
      <rect x="228" y="290" width="44" height="20" rx="2" fill="#FFFFFF" stroke="#999" strokeWidth="1.5" />
      <text x="250" y="304" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="9" fill="#333" textLength="38" lengthAdjust="spacingAndGlyphs">
        DriveAssist
      </text>

      {/* wheels */}
      <rect x="163" y="284" width="44" height="46" rx="6" fill={COLORS.tire} />
      <rect x="293" y="284" width="44" height="46" rx="6" fill={COLORS.tire} />

      {/* roof lights: outer pair amber, inner pair red. All four lenses stay on
          the bus at all times; only the lit overlay blinks. */}
      <RoofLamp cx={168} on={amberOn} onColor={COLORS.lightAmberOn} offColor={COLORS.lightAmberOff} beat="a" />
      <RoofLamp cx={314} on={amberOn} onColor={COLORS.lightAmberOn} offColor={COLORS.lightAmberOff} beat="b" />
      <RoofLamp cx={186} on={redOn} onColor={COLORS.lightRedOn} offColor={COLORS.lightRedOff} beat="a" />
      <RoofLamp cx={332} on={redOn} onColor={COLORS.lightRedOn} offColor={COLORS.lightRedOff} beat="b" />

      {/* stop arm — swings out from the driver's side */}
      <g transform="translate(140, 195)">
        <rect x="-6" y="-12" width="10" height="24" rx="2" fill="#6f6f6f" stroke="#4a4a4a" strokeWidth="1" />
        <circle cx="0" cy="0" r="3" fill="#3a3a3a" />
        <g
          style={{
            transformOrigin: "0px 0px",
            transform: signOut ? "scaleX(1)" : "scaleX(0.05)",
            transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <rect x="-72" y="-4" width="72" height="8" rx="3" fill="#B0B0B0" stroke="#7a7a7a" strokeWidth="1" />
          <g transform="translate(-72, 0)">
            <polygon
              points="-20,-8 -8,-20 8,-20 20,-8 20,8 8,20 -8,20 -20,8"
              fill={COLORS.stopRed}
              stroke={COLORS.stopWhite}
              strokeWidth="2.5"
            />
            <text x="0" y="4" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700" fill={COLORS.stopWhite}>
              STOP
            </text>
          </g>
        </g>
      </g>
    </g>
  );
};
