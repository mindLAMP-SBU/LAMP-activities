import React, { useState, useRef, useCallback, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faHome,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { InstructionModal } from "./InstructionModal";
import { Questionnaire } from "./Questionnaire";
import useDeviceMotion, { MotionSample } from "../hooks/useDeviceMotion";
import i18n from "../i18n";
import "./Board.css";
import Arrow from "src/icons/Arrow";
import GameCanvas, { GameEvent, GameResult } from "./GameCanvas";
import useOrientationLock, { getScreenAngle, tryNativeLock } from "../hooks/useOrientationLock";


/** Largest gap between samples still treated as continuous motion, in ms. */
const MAX_STEP_MS = 250;

/** Smoothing factor for the gravity-based pitch (0..1, higher = more responsive). */
const PITCH_SMOOTHING = 0.15;
/** How long the phone's starting pitch is sampled to define "neutral", in ms. */
const PITCH_CALIBRATION_MS = 500;

/** Wrap an angle in degrees to [-180, 180). */
const wrap180 = (deg: number) => ((deg + 180) % 360 + 360) % 360 - 180;

/**
 * Integrate a rotation rate (deg/s) over dt (ms) into an angle in [-180, 180),
 * decaying toward 0 to counter gyro drift.
 */
const integrateAngle = (angle: number, rate: number, dt: number) => {
  let t = angle + (rate * dt) / 1000;
  t -= t * 0.5 * (dt / 1000);
  return ((t + 180) % 360 + 360) % 360 - 180;
};

// Activity-specific phases go between "playing" and "questionnaire".
type Phase = "instructions" | "playing" | "questionnaire" | "done";

interface Props {
  data: any;
}

const Board: React.FC<Props> = ({ data }) => {
  const settings = useRef<any | null>(null);
  if (settings.current == null)
  {
    settings.current = data.activity?.settings ?? data.settings ?? {};
  }

  const language =
    settings.current.language ?? data.configuration?.language ?? data.language ?? "en-US";

  // Number of successful passes that completes the game
  const rounds: number = settings.current.rounds ?? 3;

  // state
  const [phase, setPhase] = useState<Phase>("instructions");

  // refs
  const startedAtRef = useRef(0);
  const eventsRef = useRef<GameEvent[]>([]);
  const resultRef = useRef<GameResult | null>(null);
  const theta = useRef(0);
  // Forward/back tilt in degrees relative to how the phone was held at start
  // (positive = tilted forward). Derived from gravity, so it doesn't drift.
  const pitch = useRef(0);
  const pitchCalibRef = useRef({
    filtered: null as number | null,
    neutral: null as number | null,
    startedAt: 0,
    sign: 1,
  });
  const lastSampleAtRef = useRef(0);
  const seenRef = useRef(0);
  const appliedRef = useRef(0);
  const lastDtRef = useRef(0);

  // Low-pass filter the gravity vector into a pitch angle, relative to the calibrated neutral
  const updatePitch = useCallback((s: MotionSample) => {
    const g = s.accelerationIncludingGravity;
    if (g.x === null || g.z === null) return;

    // In landscape the long (y) axis is horizontal, so forward/back tilt moves gravity between x and z
    const raw = (Math.atan2(g.x, g.z) * 180) / Math.PI;
    const c = pitchCalibRef.current;
    c.filtered = c.filtered === null ? raw : wrap180(c.filtered + wrap180(raw - c.filtered) * PITCH_SMOOTHING);

    if (c.neutral === null) {
      if (c.startedAt === 0) {
        c.startedAt = s.t;
        // Make "forward" mean the same thing on either landscape side
        c.sign = getScreenAngle() === 270 ? 1 : -1;
      }
      if (s.t - c.startedAt < PITCH_CALIBRATION_MS) return;
      c.neutral = c.filtered;
    }
    pitch.current = wrap180(c.filtered - c.neutral) * c.sign;
  }, []);

  // use rotation rate to update the angle theta (gamma), and gravity to update pitch
  const integrateRotation = useCallback((s: MotionSample) => {
    updatePitch(s);

    const gamma = s.rotationRate.gamma;
    const prevT = lastSampleAtRef.current;
    lastSampleAtRef.current = s.t;
    seenRef.current += 1;

    let dt = prevT > 0 ? s.t - prevT : s.interval !== null ? s.interval : 0;
    if (dt > MAX_STEP_MS) dt = 0;

    lastDtRef.current = dt;
    if (gamma === null || dt <= 0) return;
    appliedRef.current += 1;

    theta.current = integrateAngle(theta.current, gamma, dt);
  }, [updatePitch]);

  // Only listen while the readout is on screen.
  const motion = useDeviceMotion({
    enabled: phase === "playing",
    onSample: integrateRotation,
  });

  // Keep the view fixed to the device if the OS rotates the screen mid-game
  const orientationLock = useOrientationLock(phase === "playing");

  // localization
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  // send mindlamp request
  const post = useCallback((payload: any) => {
    parent.postMessage(
      JSON.stringify({ timestamp: new Date().getTime(), ...payload }),
      "*"
    );
  }, []);

  // iOS 13+ requires requestPermission() to be reached synchronously from a user gesture
  const handleInstructionClose = useCallback(() => {
    startedAtRef.current = Date.now();
    pitch.current = 0;
    eventsRef.current = [];
    resultRef.current = null;
    pitchCalibRef.current = { filtered: null, neutral: null, startedAt: 0, sign: 1 };
    motion.requestPermission();
    tryNativeLock();
    setPhase("playing");
  }, [motion.requestPermission]);

  // called when activity is done
  const finishActivity = useCallback(() => {
    setPhase("questionnaire");
  }, []);

  const handleGameEvent = useCallback((event: GameEvent) => {
    eventsRef.current.push(event);
  }, []);

  const handleGameOver = useCallback((result: GameResult) => {
    resultRef.current = result;
    finishActivity();
  }, [finishActivity]);

  // send results via mindlamp api
  const sendResults = useCallback(
    (questionnaire: any) => {
      const duration = startedAtRef.current
        ? Date.now() - startedAtRef.current
        : 0;

      const result = resultRef.current;
      const crashWith = result && result.reason !== "complete" ? result.reason : null;

      // One slice per gameplay event; duration is the time since the previous event
      let prevT = startedAtRef.current;
      const slices = eventsRef.current.map((e) => {
        const slice = {
          item: e.type,
          type: e.detail ?? null,
          value: e.round,
          level: e.round,
          duration: prevT ? e.t - prevT : 0,
        };
        prevT = e.t;
        return slice;
      });

      setPhase("done");
      post({
        duration,
        done: true,
        static_data: {
          duration,
          rounds,
          passes: result?.passes ?? 0,
          illegal_crossings: result?.violations ?? 0,
          crashed: crashWith !== null,
          crash_with: crashWith,
          questionnaire,
        },
        temporal_slices: [
          ...slices,
          { item: "exit", type: "manual_exit", value: false, duration: 0 },
        ],
      });
    },
    [post, rounds]
  );

  
  return (
    <div className="game-shell" style={orientationLock.style}>
      {/* Header */}
      <div className="heading">
        <span className="back-link" onClick={() => post({ clickBack: true })}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </span>
        {i18n.t("GAME")}
        {data.forward === true && (
          <span
            className="home-link-forward"
            onClick={() => post({ forward: true })}
          >
            <FontAwesomeIcon icon={faArrowRight} />
          </span>
        )}
        <span className="home-link" onClick={() => post({ clickBack: true })}>
          <FontAwesomeIcon icon={faHome} />
        </span>
      </div>

      {/* Instructions */}
      {phase === "instructions" && (
        <InstructionModal
          show={true}
          modalClose={handleInstructionClose}
          msg={i18n.t("INSTRUCTIONS")}
          language={language}
        />
      )}

      {/* Playing — the activity's own UI goes here. */}
      {phase === "playing" && (
        // Tapping the game re-centres steering, clearing any accumulated gyro drift
        <div className="activity-area" onPointerDown={() => { theta.current = 0; }}>
          {orientationLock.size && (
            <GameCanvas
              rotation={theta}
              pitch={pitch}
              height={orientationLock.size.h - 52}
              width={orientationLock.size.w}
              rounds={rounds}
              warningText={i18n.t("WARNING_DOUBLE_YELLOW")}
              onEvent={handleGameEvent}
              onGameOver={handleGameOver}
            />
          )}
        </div>
      )}

      {/* Questionnaire */}
      {phase === "questionnaire" && (
        <div className="activity-area">
          <div className="activity-overlay-text">{i18n.t("GAME_OVER")}</div>
          <Questionnaire
            show={true}
            language={language}
            setResponse={sendResults}
          />
        </div>
      )}

      {/* Done */}
      {phase === "done" && (
        <div className="activity-area">
          <div className="activity-overlay-text">{i18n.t("GAME_OVER")}</div>
        </div>
      )}
    </div>
  );
};

export default Board;
