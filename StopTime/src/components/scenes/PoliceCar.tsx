import React from "react";

/**
 * Rear view of an American police SUV, drawn after the Ford Police Interceptor
 * Utility in a generic black-and-white scheme: no department name or crest,
 * just POLICE across the tailgate.
 *
 *   driving     — in the lane ahead, lights dark                → CONTINUE
 *   lights      — in the lane ahead, red/blue lights flashing   → STOP
 *   pulled-over — stopped on the shoulder, lights flashing      → SLOW DOWN (move over)
 *
 * The lights flash in the PoliceCarAsset prototype's double-burst, red and
 * blue out of phase (see .st-pc-* in StopTime.css). The car is drawn in a
 * 400 × 340 box and placed into the scene by a transform, which glides when
 * the car pulls over.
 */
export type PoliceState = "driving" | "lights" | "pulled-over";

const FONT = "Arial, Helvetica, sans-serif";

const COLORS = {
  black: "#17191D",
  blackHi: "#2A2D33",
  white: "#F4F5F7",
  whiteShade: "#D5DAE0",
  trim: "#0D0E10",
  tailLight: "#C8202C",
  tailLightHi: "#F0505A",
  reverse: "#E4E6EA",
  tyre: "#0B0C0F",
  chrome: "#9AA1AA",
};

// Car-space → scene placement. In the lane its wheels sit on the bus's road
// line; pulled over it is further ahead, mostly on the shoulder.
const IN_LANE = "translate(100px, 99px) scale(0.75)";
const ON_SHOULDER = "translate(313px, 161px) scale(0.36)";

interface Props {
  state: PoliceState;
  /** True while the scene is still "in the distance", before the cue is shown. */
  approaching?: boolean;
}

/** A warning lamp: a dim lens always, with the lit lens flashing over it when on. */
const Lamp: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: "red" | "blue";
  on: boolean;
  alt?: boolean;
  rx?: number;
}> = ({ x, y, w, h, color, on, alt, rx = 3 }) => (
  <>
    <rect x={x} y={y} width={w} height={h} rx={rx} fill={color === "red" ? "#5a1820" : "#1b2a57"} />
    {on && (
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={rx}
        className={`st-pc-${color}${alt ? " st-pc-alt" : ""}`}
      />
    )}
  </>
);

/** The slim LED light bar: three red segments, then three blue. */
const BAR = [0, 1, 2, 3, 4, 5].map((i) => ({
  x: 104 + i * 32.5,
  color: (i < 3 ? "red" : "blue") as "red" | "blue",
  alt: i % 2 === 1,
}));

export const PoliceCar: React.FC<Props> = ({ state, approaching }) => {
  const on = state !== "driving";

  return (
    <g className={approaching ? "st-subject st-subject-far" : "st-subject"}>
      <defs>
        <linearGradient id="st-pc-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#202a38" />
          <stop offset="1" stopColor="#080b11" />
        </linearGradient>
        <linearGradient id="st-pc-black" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.blackHi} />
          <stop offset="1" stopColor={COLORS.black} />
        </linearGradient>
        <linearGradient id="st-pc-white" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.white} />
          <stop offset="1" stopColor={COLORS.whiteShade} />
        </linearGradient>
        <radialGradient id="st-pc-gR">
          <stop offset="0" stopColor="#ff2a3d" stopOpacity=".6" />
          <stop offset="1" stopColor="#ff2a3d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="st-pc-gB">
          <stop offset="0" stopColor="#2f74ff" stopOpacity=".6" />
          <stop offset="1" stopColor="#2f74ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g
        style={{
          transformBox: "view-box",
          transformOrigin: "0px 0px",
          transform: state === "pulled-over" ? ON_SHOULDER : IN_LANE,
          transition: "transform 1.4s cubic-bezier(0.45, 0, 0.3, 1)",
        }}
      >
        {/* light spilling off the bar, only while it is flashing */}
        {on && (
          <>
            <ellipse className="st-pc-glow-red" cx="150" cy="20" rx="120" ry="48" fill="url(#st-pc-gR)" />
            <ellipse className="st-pc-glow-blue" cx="250" cy="20" rx="120" ry="48" fill="url(#st-pc-gB)" />
          </>
        )}

        <ellipse cx="200" cy="318" rx="192" ry="13" fill="#000" opacity=".4" />

        {/* tyres, showing under the bumper */}
        <rect x="50" y="268" width="56" height="50" rx="10" fill={COLORS.tyre} />
        <rect x="294" y="268" width="56" height="50" rx="10" fill={COLORS.tyre} />

        {/* body: wide at the hips, black tailgate between white rear quarters */}
        <path
          d="M84 142 L316 142 Q350 146 360 176 L368 258 Q368 272 354 272 L46 272 Q32 272 32 258 L40 176 Q50 146 84 142 Z"
          fill="url(#st-pc-black)"
        />
        <path d="M84 142 L96 142 L80 272 L46 272 Q32 272 32 258 L40 176 Q50 146 84 142 Z" fill="url(#st-pc-white)" />
        <path d="M316 142 L304 142 L320 272 L354 272 Q368 272 368 258 L360 176 Q350 146 316 142 Z" fill="url(#st-pc-white)" />

        {/* greenhouse: narrower than the body, rear glass raked forward */}
        <path d="M112 34 Q114 26 126 26 L274 26 Q286 26 288 34 L314 146 L86 146 Z" fill="url(#st-pc-black)" />
        <path d="M120 44 L280 44 L300 136 L100 136 Z" fill="url(#st-pc-glass)" />
        <path d="M120 44 L176 44 L136 136 L100 136 Z" fill="#fff" opacity=".07" />
        {/* rear-glass lightstick, mounted inside along the top of the window */}
        <rect x="126" y="48" width="148" height="9" rx="3" fill={COLORS.trim} />
        <Lamp x={130} y={50} w={34} h={5} color="red" on={on} rx={2} />
        <Lamp x={166} y={50} w={32} h={5} color="red" on={on} alt rx={2} />
        <Lamp x={202} y={50} w={32} h={5} color="blue" on={on} alt rx={2} />
        <Lamp x={236} y={50} w={34} h={5} color="blue" on={on} rx={2} />

        {/* roof spoiler with the high-mounted brake light */}
        <rect x="108" y="22" width="184" height="9" rx="4" fill={COLORS.trim} />
        <rect x="176" y="24.5" width="48" height="4" rx="2" fill={COLORS.tailLight} />

        {/* low-profile LED light bar on roof mounts */}
        <rect x="128" y="17" width="6" height="6" fill={COLORS.trim} />
        <rect x="266" y="17" width="6" height="6" fill={COLORS.trim} />
        <rect x="100" y="6" width="200" height="13" rx="6.5" fill={COLORS.trim} />
        {BAR.map((s) => (
          <Lamp key={s.x} x={s.x} y={8} w={29} h={9} color={s.color} on={on} alt={s.alt} rx={4} />
        ))}
        <rect x="270" y="0" width="2.5" height="8" fill={COLORS.trim} />

        {/* shoulder line where the tailgate meets the glass */}
        <path d="M86 146 L314 146" stroke={COLORS.trim} strokeWidth="2.5" />

        {/* tail lights: slim strips running from each corner into the tailgate,
            joined across the middle by a dark trim bar */}
        <path d="M44 168 Q50 154 84 152 L148 156 L148 174 L42 184 Z" fill={COLORS.tailLight} />
        <path d="M356 168 Q350 154 316 152 L252 156 L252 174 L358 184 Z" fill={COLORS.tailLight} />
        <path d="M54 162 Q60 157 84 156 L142 159 L142 163 L52 168 Z" fill={COLORS.tailLightHi} opacity=".7" />
        <path d="M346 162 Q340 157 316 156 L258 159 L258 163 L348 168 Z" fill={COLORS.tailLightHi} opacity=".7" />
        <rect x="112" y="162" width="20" height="8" rx="2" fill={COLORS.reverse} opacity=".85" />
        <rect x="268" y="162" width="20" height="8" rx="2" fill={COLORS.reverse} opacity=".85" />
        <rect x="148" y="158" width="104" height="14" rx="2" fill={COLORS.trim} />
        <rect x="148" y="158" width="104" height="2" fill={COLORS.chrome} opacity=".5" />
        {/* the tail-light strips double as wig-wag flashers */}
        {on && (
          <>
            <rect x="60" y="160" width="40" height="12" rx="3" className="st-pc-red st-pc-alt" />
            <rect x="300" y="160" width="40" height="12" rx="3" className="st-pc-blue st-pc-alt" />
          </>
        )}

        {/* POLICE across the tailgate */}
        <text x="200" y="214" textAnchor="middle" fontFamily={FONT} fontWeight="900" fontSize="34" letterSpacing="5" fill={COLORS.white}>
          POLICE
        </text>

        {/* plate in its recess */}
        <rect x="160" y="226" width="80" height="38" rx="4" fill={COLORS.trim} />
        <rect x="166" y="230" width="68" height="30" rx="3" fill="#F2F2EE" stroke="#9aa0a8" />
        <text x="200" y="250" textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="13" fill="#14171c">
          PD 4127
        </text>

        {/* bumper, step pad, reflectors, twin exhausts, grille flashers */}
        <path d="M38 264 L362 264 L356 296 Q354 304 344 304 L56 304 Q46 304 44 296 Z" fill={COLORS.trim} />
        <rect x="130" y="270" width="140" height="7" rx="3" fill="#24272c" />
        <rect x="52" y="272" width="16" height="5" rx="2" fill={COLORS.tailLight} />
        <rect x="332" y="272" width="16" height="5" rx="2" fill={COLORS.tailLight} />
        <Lamp x={76} y={282} w={38} h={8} color="red" on={on} />
        <Lamp x={286} y={282} w={38} h={8} color="blue" on={on} />
        <ellipse cx="86" cy="304" rx="9" ry="4" fill={COLORS.chrome} />
        <ellipse cx="314" cy="304" rx="9" ry="4" fill={COLORS.chrome} />
        <ellipse cx="86" cy="304" rx="5.5" ry="2.2" fill="#111" />
        <ellipse cx="314" cy="304" rx="5.5" ry="2.2" fill="#111" />
      </g>
    </g>
  );
};
