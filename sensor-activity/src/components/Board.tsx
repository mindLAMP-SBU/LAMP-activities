import React, { useState, useRef, useCallback, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faHome,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { InstructionModal } from "./InstructionModal";
import { Questionnaire } from "./Questionnaire";
import i18n from "../i18n";
import "./Board.css";


// Activity-specific phases go between "playing" and "questionnaire".
type Phase = "instructions" | "playing" | "questionnaire" | "done";

interface Props {
  data: any;
}

const Board: React.FC<Props> = ({ data }) => {
  const settings = data.activity?.settings ?? data.settings ?? {};

  const language =
    settings.language ?? data.configuration?.language ?? data.language ?? "en-US";

  // state
  const [phase, setPhase] = useState<Phase>("instructions");

  // refs
  const startedAtRef = useRef(0);

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

  const handleInstructionClose = useCallback(() => {
    startedAtRef.current = Date.now();
    setPhase("playing");
  }, []);

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

      {/* Playing — the activity's own UI goes here. The placeholder below
          ends the activity on a tap so the full flow stays testable. */}
      {phase === "playing" && (
        <div className="activity-area"> 
        <h1>Hello World</h1>
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
