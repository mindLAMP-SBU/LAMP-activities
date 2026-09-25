import React from "react";

export type LightState = "green" | "yellow" | "red";

interface Props {
  state: LightState;
  small?: boolean;
  label?: string;
}

export const TrafficLight: React.FC<Props> = ({ state, small, label }) => (
  <div
    className={`rt-traffic-light${small ? " rt-traffic-light-small" : ""}`}
    role="img"
    aria-label={label ?? `Traffic light showing ${state}`}
  >
    <div className={`rt-lamp rt-lamp-red${state === "red" ? " rt-lamp-on" : ""}`} />
    <div className={`rt-lamp rt-lamp-yellow${state === "yellow" ? " rt-lamp-on" : ""}`} />
    <div className={`rt-lamp rt-lamp-green${state === "green" ? " rt-lamp-on" : ""}`} />
  </div>
);
