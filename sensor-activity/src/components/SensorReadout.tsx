import React, { useEffect, useState } from "react";
import i18n from "../i18n";
import { DeviceMotionState, Vector3, Rotation3 } from "../hooks/useDeviceMotion";

// Desktop browsers and locked-down WebViews never fire `devicemotion` at all,
// so "waiting" has to time out into "unavailable" rather than hang forever.
const WAIT_TIMEOUT_MS = 3000;

// Rendered as literals, not i18n keys: these are symbols, not prose.
const MS2 = "m/s\u00B2";
const DEG_S = "\u00B0/s";

function fmt(v: number | null, digits: number): string {
  return v === null ? "—" : v.toFixed(digits);
}

interface AxisProps {
  label: string;
  value: number | null;
  unit: string;
  digits: number;
}

const Axis: React.FC<AxisProps> = ({ label, value, unit, digits }) => (
  <div className="sensor-row">
    <span className="sensor-axis">{label}</span>
    <span className="sensor-value">{fmt(value, digits)}</span>
    <span className="sensor-unit">{unit}</span>
  </div>
);

const VectorCard: React.FC<{ title: string; v: Vector3 }> = ({ title, v }) => (
  <div className="sensor-card">
    <div className="sensor-card-title">{title}</div>
    <Axis label="X" value={v.x} unit={MS2} digits={2} />
    <Axis label="Y" value={v.y} unit={MS2} digits={2} />
    <Axis label="Z" value={v.z} unit={MS2} digits={2} />
  </div>
);

const RotationCard: React.FC<{ title: string; r: Rotation3 }> = ({ title, r }) => (
  <div className="sensor-card">
    <div className="sensor-card-title">{title}</div>
    <Axis label={"\u03B1"} value={r.alpha} unit={DEG_S} digits={1} />
    <Axis label={"\u03B2"} value={r.beta} unit={DEG_S} digits={1} />
    <Axis label={"\u03B3"} value={r.gamma} unit={DEG_S} digits={1} />
  </div>
);

interface Props {
  motion: DeviceMotionState;
}

export const SensorReadout: React.FC<Props> = ({ motion }) => {
  const { permission, latest, sampleCount, hz, hasData, requestPermission } = motion;
  const [waitedTooLong, setWaitedTooLong] = useState(false);

  useEffect(() => {
    if (sampleCount > 0) return undefined;
    const id = window.setTimeout(() => setWaitedTooLong(true), WAIT_TIMEOUT_MS);
    return () => {
      window.clearTimeout(id);
    };
  }, [sampleCount]);

  if (permission === "unsupported") {
    return <div className="sensor-message">{i18n.t("MOTION_UNAVAILABLE")}</div>;
  }

  if (permission === "denied") {
    return (
      <div className="sensor-message">
        {i18n.t("PERMISSION_DENIED")}
        <button className="sensor-btn" onClick={() => requestPermission()}>
          {i18n.t("PERMISSION")}
        </button>
      </div>
    );
  }

  if (permission === "prompt") {
    // Fallback only: the Start button normally requests permission already.
    return (
      <div className="sensor-message">
        <button className="sensor-btn" onClick={() => requestPermission()}>
          {i18n.t("PERMISSION")}
        </button>
      </div>
    );
  }

  if (sampleCount === 0) {
    return (
      <div className="sensor-message">
        {waitedTooLong ? i18n.t("MOTION_UNAVAILABLE") : i18n.t("MOTION_WAITING")}
      </div>
    );
  }

  if (!hasData) {
    return <div className="sensor-message">{i18n.t("MOTION_NO_DATA")}</div>;
  }

  // Only `latest` is rendered. The hook's rolling buffer stays available for a
  // future sparkline, but 50 rows replaced 10x/s is real DOM churn on a phone.
  return (
    <div className="sensor-readout">
      <VectorCard
        title={i18n.t("ACCELERATION")}
        v={latest ? latest.acceleration : { x: null, y: null, z: null }}
      />
      <VectorCard
        title={i18n.t("ACCELERATION_WITH_GRAVITY")}
        v={
          latest
            ? latest.accelerationIncludingGravity
            : { x: null, y: null, z: null }
        }
      />
      <RotationCard
        title={i18n.t("ROTATION_RATE")}
        r={latest ? latest.rotationRate : { alpha: null, beta: null, gamma: null }}
      />
      <div className="sensor-card sensor-stats">
        <div className="sensor-stat">
          <div className="sensor-stat-label">{i18n.t("SAMPLES")}</div>
          <div className="sensor-stat-value">{sampleCount}</div>
        </div>
        <div className="sensor-stat">
          <div className="sensor-stat-label">{i18n.t("RATE")}</div>
          <div className="sensor-stat-value">{hz.toFixed(1)} Hz</div>
        </div>
        <div className="sensor-stat">
          <div className="sensor-stat-label">{i18n.t("INTERVAL")}</div>
          <div className="sensor-stat-value">
            {latest ? fmt(latest.interval, 0) : "—"} ms
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorReadout;
