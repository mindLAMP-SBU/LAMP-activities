import React, { useState, useRef, useCallback, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faHome,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { InstructionModal } from "./InstructionModal";
import { Questionnaire } from "./Questionnaire";
import { SensorReadout } from "./SensorReadout";
import useDeviceMotion, { MotionSample } from "../hooks/useDeviceMotion";
import i18n from "../i18n";
import "./Board.css";
import Arrow from "src/icons/Arrow";


// Activity-specific phases go between "playing" and "questionnaire".
type Phase = "instructions" | "playing" | "questionnaire" | "done";

interface Props {
  data: any;
}

const Board: React.FC<Props> = ({ data }) => {
  const settings = useRef<any | null>(null);

  // The dashboard posts exactly one message, on iframe load. There is no
  // sensor channel -- accelerometer data comes from the browser `devicemotion`
  // event, not from postMessage.
  if (settings.current == null)
  {
    settings.current = data.activity?.settings ?? data.settings ?? {};
  }

  const language =
    settings.current.language ?? data.configuration?.language ?? data.language ?? "en-US";

  // state
  const [phase, setPhase] = useState<Phase>("instructions");

  // refs
  const startedAtRef = useRef(0);
  const theta = useRef(0);
  const lastSampleAtRef = useRef(0);

  // use rotation rate gamma to update the angle theta
  const integrateGamma = useCallback((s: MotionSample) => {
    const gamma = s.rotationRate.gamma;
    const prevT = lastSampleAtRef.current;
    // Prefer the device-reported interval; fall back to the sample gap.
    const dt = s.interval !== null ? s.interval : prevT > 0 ? s.t - prevT : 0;
    lastSampleAtRef.current = s.t;
    if (gamma === null || dt <= 0) return;
    // Wrap so a long session can't drift off into float noise.
    theta.current = (((theta.current + (gamma * dt) / 1000) % 360) + 360) % 360;
  }, []);

  // Only listen while the readout is on screen.
  const motion = useDeviceMotion({
    enabled: phase === "playing",
    onSample: integrateGamma,
  });

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
    motion.requestPermission();
    setPhase("playing");
  }, [motion.requestPermission]);

  // called when activity is done
  const finishActivity = useCallback(() => {
    setPhase("questionnaire");
  }, []);

  // send results via mindlamp api
  const sendResults = useCallback(
    (questionnaire: any) => {
      const duration = startedAtRef.current
        ? Date.now() - startedAtRef.current
        : 0;

      setPhase("done");
      post({
        duration,
        done: true,
        static_data: {
          duration,
          // Activity-specific scores go here.
          questionnaire,
        },
        temporal_slices: [
          // Activity-specific per-event entries go here.
          { item: "exit", type: "manual_exit", value: false, duration: 0 },
        ],
      });
    },
    [post]
  );

  
  return (
    <div className="game-shell">
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
        <div className="activity-area">
          <Arrow theta={theta.current}/>
          <SensorReadout motion={motion} />
          <button className="sensor-btn" onClick={finishActivity}>
            {i18n.t("Done")}
          </button>
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
