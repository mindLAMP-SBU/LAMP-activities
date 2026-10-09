import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Live accelerometer / gyroscope readout from the browser `devicemotion` event.
 *
 * The event fires at ~30-60 Hz. The handler only writes to refs; a separate
 * low-frequency timer publishes one snapshot into React state, so the component
 * tree re-renders at a fixed cadence no matter how fast the sensor runs.
 */

/** "unsupported" = the browser has no DeviceMotionEvent at all. */
export type MotionPermission = "unsupported" | "prompt" | "granted" | "denied";

export interface Vector3 {
  x: number | null;
  y: number | null;
  z: number | null;
}

export interface Rotation3 {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

export interface MotionSample {
  /** Date.now() at the moment the event was delivered. */
  t: number;
  /** m/s^2, gravity excluded. null on devices with no linear-acceleration sensor. */
  acceleration: Vector3;
  /** m/s^2, gravity included. The most widely supported field. */
  accelerationIncludingGravity: Vector3;
  /** deg/s. */
  rotationRate: Rotation3;
  /** Device-reported sampling interval, normalised to ms (see toIntervalMs). */
  interval: number | null;
}

export interface UseDeviceMotionOptions {
  /** Attach the listener only while true. Detaches (and stops the timer) when false. */
  enabled?: boolean;
  /** How often the snapshot is pushed into React state. Default 100ms = 10 Hz. */
  uiIntervalMs?: number;
  /** Rolling buffer length. Default 50 samples (~1s at 50 Hz). */
  bufferSize?: number;
  /** Called for every event, before any throttling. Use this for anything that must see the whole stream. */
  onSample?: (sample: MotionSample) => void;
}

export interface DeviceMotionState {
  permission: MotionPermission;
  /** True on iOS 13+, where DeviceMotionEvent.requestPermission() exists. */
  needsPermission: boolean;
  /** True while the devicemotion listener is attached. */
  listening: boolean;
  latest: MotionSample | null;
  /** Oldest -> newest, capped at bufferSize. */
  samples: MotionSample[];
  /** Total events seen since the listener was attached. */
  sampleCount: number;
  /** Effective sample rate measured over the last UI tick. */
  hz: number;
  /** True once any finite numeric field has been observed. Stays true. */
  hasData: boolean;
  /**
   * Must be invoked synchronously from a user gesture handler on iOS: Safari
   * drops user activation across a task boundary, and the promise then resolves
   * "denied" without ever showing a prompt.
   */
  requestPermission: () => Promise<MotionPermission>;
}

const EMPTY_VECTOR: Vector3 = { x: null, y: null, z: null };
const EMPTY_ROTATION: Rotation3 = { alpha: null, beta: null, gamma: null };

// Read the constructors off `window` rather than referencing the bare globals:
// `DeviceMotionEvent` is undeclared on some desktop browsers and a bare
// reference would throw a ReferenceError at module scope.
const DME: any =
  typeof window !== "undefined" ? (window as any).DeviceMotionEvent : undefined;
const DOE: any =
  typeof window !== "undefined" ? (window as any).DeviceOrientationEvent : undefined;

/**
 * iOS 13+ gates motion behind an explicit permission call. Feature-detect the
 * function instead of sniffing the user agent -- this is a capability question,
 * not a device question.
 */
function detectNeedsPermission(): boolean {
  return !!DME && typeof DME.requestPermission === "function";
}

function num(v: number | null | undefined): number | null {
  // typeof guard first: isFinite(null) is true, because Number(null) === 0.
  return typeof v === "number" && isFinite(v) ? v : null;
}

/**
 * The spec says `interval` is in milliseconds, but iOS reports it in seconds
 * (~0.016). A sub-millisecond interval would mean a >1000Hz sensor, which no
 * browser delivers, so treat anything under 1 as seconds and normalise to ms.
 */
function toIntervalMs(v: number | null | undefined): number | null {
  const n = num(v);
  if (n === null || n <= 0) return n;
  return n < 1 ? n * 1000 : n;
}

function toVector(v: DeviceMotionEventAcceleration | null | undefined): Vector3 {
  if (!v) return EMPTY_VECTOR;
  return { x: num(v.x), y: num(v.y), z: num(v.z) };
}

function toRotation(
  r: DeviceMotionEventRotationRate | null | undefined
): Rotation3 {
  if (!r) return EMPTY_ROTATION;
  return { alpha: num(r.alpha), beta: num(r.beta), gamma: num(r.gamma) };
}

/**
 * Desktop browsers and locked-down devices can fire `devicemotion` with every
 * field null. Distinguish "the event fired but carries nothing" from "the event
 * fired with real numbers" so the UI can say so instead of showing a dead zero.
 */
function sampleHasData(s: MotionSample): boolean {
  const a = s.acceleration;
  const g = s.accelerationIncludingGravity;
  const r = s.rotationRate;
  return (
    a.x !== null || a.y !== null || a.z !== null ||
    g.x !== null || g.y !== null || g.z !== null ||
    r.alpha !== null || r.beta !== null || r.gamma !== null
  );
}

interface Snapshot {
  latest: MotionSample | null;
  samples: MotionSample[];
  sampleCount: number;
  hz: number;
  hasData: boolean;
}

const EMPTY_SNAPSHOT: Snapshot = {
  latest: null,
  samples: [],
  sampleCount: 0,
  hz: 0,
  hasData: false,
};

export function useDeviceMotion(
  options: UseDeviceMotionOptions = {}
): DeviceMotionState {
  const { enabled = true, uiIntervalMs = 100, bufferSize = 50, onSample } = options;

  // Held in a ref so a caller passing an inline closure does not re-subscribe
  // the listener on every render.
  const onSampleRef = useRef(onSample);
  onSampleRef.current = onSample;

  const needsPermission = detectNeedsPermission();

  const [permission, setPermission] = useState<MotionPermission>(() => {
    if (!DME) return "unsupported";
    return detectNeedsPermission() ? "prompt" : "granted";
  });

  // --- hot path: refs only, never state ---------------------------------
  const latestRef = useRef<MotionSample | null>(null);
  const bufferRef = useRef<MotionSample[]>([]);
  const countRef = useRef(0);
  const hasDataRef = useRef(false);
  const tickCountRef = useRef(0);
  const tickAtRef = useRef(0);
  const idleRef = useRef(false);

  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);

  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      const sample: MotionSample = {
        t: Date.now(),
        acceleration: toVector(event.acceleration),
        accelerationIncludingGravity: toVector(
          event.accelerationIncludingGravity
        ),
        rotationRate: toRotation(event.rotationRate),
        interval: toIntervalMs(event.interval),
      };
      if (onSampleRef.current) {
        onSampleRef.current(sample);
      }
      latestRef.current = sample;
      countRef.current += 1;
      if (!hasDataRef.current && sampleHasData(sample)) {
        hasDataRef.current = true;
      }
      // Bounded ring buffer: splice from the front so memory never grows.
      const buffer = bufferRef.current;
      buffer.push(sample);
      if (buffer.length > bufferSize) {
        buffer.splice(0, buffer.length - bufferSize);
      }
    },
    [bufferSize]
  );

  const listening = enabled && permission === "granted";

  // --- listener lifecycle -----------------------------------------------
  useEffect(() => {
    // tsconfig sets noImplicitReturns, so the early exit must return a value.
    if (!listening) return undefined;

    latestRef.current = null;
    bufferRef.current = [];
    countRef.current = 0;
    hasDataRef.current = false;
    tickCountRef.current = 0;
    tickAtRef.current = Date.now();
    idleRef.current = false;
    setSnapshot(EMPTY_SNAPSHOT);

    window.addEventListener("devicemotion", handleMotion);
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [listening, handleMotion]);

  // --- throttled publish into React -------------------------------------
  useEffect(() => {
    if (!listening) return undefined;
    const id = window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - tickAtRef.current;
      const delta = countRef.current - tickCountRef.current;
      tickAtRef.current = now;
      tickCountRef.current = countRef.current;

      if (delta === 0) {
        // Nothing arrived. Publish one zeroed-rate snapshot, then go quiet so a
        // stalled or absent sensor costs no renders at all.
        if (idleRef.current) return;
        idleRef.current = true;
      } else {
        idleRef.current = false;
      }

      const hz = elapsed > 0 ? (delta * 1000) / elapsed : 0;
      setSnapshot({
        latest: latestRef.current,
        samples: bufferRef.current.slice(),
        sampleCount: countRef.current,
        hz: Math.round(hz * 10) / 10,
        hasData: hasDataRef.current,
      });
    }, uiIntervalMs);

    return () => {
      window.clearInterval(id);
    };
  }, [listening, uiIntervalMs]);

  // iOS 13+ permission 
  const requestPermission = useCallback((): Promise<MotionPermission> => {
    if (!DME) {
      setPermission("unsupported");
      return Promise.resolve<MotionPermission>("unsupported");
    }
    const request: null | (() => Promise<string>) =
      typeof DME.requestPermission === "function"
        ? DME.requestPermission.bind(DME)
        : DOE && typeof DOE.requestPermission === "function"
        ? DOE.requestPermission.bind(DOE)
        : null;

    if (!request) {
      setPermission("granted");
      return Promise.resolve<MotionPermission>("granted");
    }

    return request()
      .then((result: string) => {
        const next: MotionPermission =
          result === "granted" ? "granted" : "denied";
        setPermission(next);
        return next;
      })
      .catch(() => {
        setPermission("denied");
        return "denied" as MotionPermission;
      });
  }, []);

  return {
    permission,
    needsPermission,
    listening,
    latest: snapshot.latest,
    samples: snapshot.samples,
    sampleCount: snapshot.sampleCount,
    hz: snapshot.hz,
    hasData: snapshot.hasData,
    requestPermission,
  };
}

export default useDeviceMotion;
