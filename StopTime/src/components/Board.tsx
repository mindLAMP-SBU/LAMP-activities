import React, { useState, useRef, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faRedo } from "@fortawesome/free-solid-svg-icons";
import { InstructionModal } from "./InstructionModal";
import { Questionnaire } from "./Questionnaire";
import { SceneStage } from "./scenes/SceneStage";
import { SchoolBus, BusState } from "./scenes/SchoolBus";
import { SignalPole, SignalState } from "./scenes/TrafficSignal";
import { Pedestrian, PedestrianState } from "./scenes/Pedestrian";
import { TrafficLight } from "./TrafficLight";
import {
  Action,
  Cue,
  ScenarioId,
  ACTION_LABEL_KEY,
  BASELINE_STATE,
  CUES,
  LEAD_IN_MS,
  SCENARIO_LABEL_KEY,
  buildDeck,
} from "./scenarios";
import i18n from "../i18n";
import "./StopTime.css";

type Phase =
  | "instructions"
  | "approach"   // scene coming into view, buttons locked
  | "cue"        // situation revealed, waiting for a choice
  | "feedback"
  | "gameOver"
  | "questionnaire"
  | "done";

interface TrialResult {
  trial: number;            // 1-indexed
  cue_id: string;
  scenario: ScenarioId;
  cue_state: string;
  correct_action: Action;
  response: Action;
  correct: boolean;
  rt: number;               // ms from the cue landing to the button press
}

interface Props {
  data: any;
}

const ACTIONS: Action[] = ["continue", "slow", "stop"];

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

const Board: React.FC<Props> = ({ data }) => {
  const settings = data.activity?.settings ?? data.settings ?? {};
  const trials = Math.max(1, Math.min(90, settings.trials ?? 16));
  const minApproach = Math.max(300, settings.min_approach_ms ?? 800);
  const maxApproach = Math.max(minApproach, settings.max_approach_ms ?? 1600);
  const language = data.configuration?.language ?? "en-US";
  const showForward = data.forward ?? false;
  const noBack = data.noBack ?? false;

  const [phase, setPhase] = useState<Phase>("instructions");
  const [trialIndex, setTrialIndex] = useState(0);
  const [cue, setCue] = useState<Cue>(CUES[0]);
  const [sceneState, setSceneState] = useState<string>(BASELINE_STATE.bus);
  const [approaching, setApproaching] = useState(true);
  const [chosen, setChosen] = useState<Action | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const deckRef = useRef<Cue[]>([]);
  const resultsRef = useRef<TrialResult[]>([]);
  const routesRef = useRef<any[]>([]);
  const startTimeRef = useRef(Date.now());
  const cueTimeRef = useRef(0);
  const respondedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => clearTimers, [clearTimers]);

  // ── Trial lifecycle ───────────────────────────────────
  // A trial opens with the scene small and far off, rolls it up to full size,
  // then drops the cue on it. The response clock starts at the cue, not at the
  // start of the approach, so travel time is never counted against the answer.
  const startTrial = useCallback(
    (index: number) => {
      clearTimers();
      const next = deckRef.current[index];
      respondedRef.current = false;
      setChosen(null);
      setTrialIndex(index);
      setCue(next);
      setSceneState(BASELINE_STATE[next.scenario]);
      setApproaching(true);
      setPhase("approach");

      // Let the far-away frame paint before releasing the approach transition.
      timersRef.current.push(setTimeout(() => setApproaching(false), 50));

      const delay = Math.round(minApproach + Math.random() * (maxApproach - minApproach));

      // A cue may declare a lead-in state it passes through first — a signal
      // shows yellow on its way to red rather than jumping straight there. The
      // lead-in plays out on top of the normal approach delay, so it is always
      // seen at full size, and the response window stays shut until the real
      // cue lands.
      if (next.leadIn) {
        timersRef.current.push(setTimeout(() => setSceneState(next.leadIn!), delay));
      }

      timersRef.current.push(
        setTimeout(
          () => {
            setSceneState(next.state);
            cueTimeRef.current = performance.now();
            setPhase("cue");
          },
          next.leadIn ? delay + LEAD_IN_MS : delay
        )
      );
    },
    [clearTimers, minApproach, maxApproach]
  );

  const handleAnswer = useCallback(
    (response: Action) => {
      if (respondedRef.current) return;
      respondedRef.current = true;
      clearTimers();

      const rt = Math.round(performance.now() - cueTimeRef.current);
      const correct = response === cue.answer;

      const result: TrialResult = {
        trial: resultsRef.current.length + 1,
        cue_id: cue.id,
        scenario: cue.scenario,
        cue_state: cue.state,
        correct_action: cue.answer,
        response,
        correct,
        rt,
      };
      resultsRef.current.push(result);
      routesRef.current.push({
        duration: rt,
        item: result.trial,
        level: cue.scenario,
        type: correct,
        value: response,
        cue: cue.id,
        correct_action: cue.answer,
      });

      if (correct) setCorrectCount((c) => c + 1);
      setChosen(response);
      setPhase("feedback");
    },
    [cue, clearTimers]
  );

  const handleNext = useCallback(() => {
    const next = trialIndex + 1;
    if (next >= trials) {
      setPhase("gameOver");
      timersRef.current.push(setTimeout(() => setPhase("questionnaire"), 1800));
    } else {
      startTrial(next);
    }
  }, [trialIndex, trials, startTrial]);

  // ── Results payload ───────────────────────────────────
  const buildPayload = useCallback(
    (qData?: any) => {
      const all = resultsRef.current;
      const correct = all.filter((r) => r.correct);
      const rts = correct.map((r) => r.rt);

      const byScenario: any = {};
      (["bus", "light", "ped"] as ScenarioId[]).forEach((s) => {
        const rows = all.filter((r) => r.scenario === s);
        byScenario[s + "_correct"] = rows.filter((r) => r.correct).length;
        byScenario[s + "_total"] = rows.length;
      });

      const byAction: any = {};
      ACTIONS.forEach((a) => {
        const rows = all.filter((r) => r.correct_action === a);
        byAction[a + "_correct"] = rows.filter((r) => r.correct).length;
        byAction[a + "_total"] = rows.length;
      });

      // How the wrong answers went wrong. A key of "stop>slow" means the
      // situation called for a stop but only a slow down was chosen.
      const confusions: Record<string, number> = {};
      all
        .filter((r) => !r.correct)
        .forEach((r) => {
          const key = r.correct_action + ">" + r.response;
          confusions[key] = (confusions[key] ?? 0) + 1;
        });

      const score = all.length > 0 ? Math.round((correct.length / all.length) * 100) : 0;

      return {
        duration: Date.now() - startTimeRef.current,
        timestamp: Date.now(),
        static_data: {
          // Primary outcome: how many situations were read correctly.
          correct_answers: correct.length,
          wrong_answers: all.length - correct.length,
          total_questions: all.length,
          score,
          point: score >= 80 ? 2 : 1,
          accuracy: score,
          // Per-scenario and per-action breakdowns
          ...byScenario,
          ...byAction,
          confusion_matrix: confusions,
          // Decision speed: reported for analysis, not folded into the score
          mean_decision_ms: mean(rts),
          median_decision_ms: median(rts),
          mean_decision_all_ms: mean(all.map((r) => r.rt)),
          // Settings echo
          trials,
          min_approach_ms: minApproach,
          max_approach_ms: maxApproach,
          ...(qData && { questionnaire: qData }),
        },
        temporal_slices: routesRef.current,
      };
    },
    [trials, minApproach, maxApproach]
  );

  const sendResult = useCallback(
    (isNav: boolean, isBack: boolean, qData?: any) => {
      const payload: any = {
        ...buildPayload(qData),
        ...(showForward && { forward: !isBack }),
        ...(isNav && isBack && { clickBack: true }),
        ...(!isNav && { done: true }),
      };
      parent.postMessage(JSON.stringify(payload), "*");
    },
    [buildPayload, showForward]
  );

  // ── Navigation ────────────────────────────────────────
  const handleBack = () => {
    clearTimers();
    routesRef.current.push({ type: "manual_exit", value: true });
    sendResult(true, true);
  };

  const handleForward = () => {
    clearTimers();
    routesRef.current.push({ type: "manual_exit", value: true });
    sendResult(true, false);
  };

  const handleInstructionClose = () => {
    startTimeRef.current = Date.now();
    deckRef.current = buildDeck(trials);
    resultsRef.current = [];
    routesRef.current = [];
    setCorrectCount(0);
    startTrial(0);
  };

  const handleQuestionnaireSubmit = (response: any) => {
    setPhase("done");
    routesRef.current.push({ type: "manual_exit", value: false });
    sendResult(false, false, response);
  };

  // ── Render ────────────────────────────────────────────
  const inTrial = phase === "approach" || phase === "cue" || phase === "feedback";
  const canAnswer = phase === "cue";
  const isCorrect = chosen !== null && chosen === cue.answer;

  const renderScene = (): React.ReactNode => {
    switch (cue.scenario) {
      case "bus":
        return <SchoolBus state={sceneState as BusState} approaching={approaching} />;
      case "light":
        return <SignalPole approaching={approaching} />;
      case "ped":
        return <Pedestrian state={sceneState as PedestrianState} approaching={approaching} />;
      default:
        return null;
    }
  };

  // The signal head is the SimpleRT traffic light, so it is a DOM node rather
  // than SVG and rides on top of the stage, hanging off the pole drawn above.
  const renderOverlay = (): React.ReactNode =>
    cue.scenario === "light" ? (
      <div className="st-signal-head">
        <TrafficLight state={sceneState as SignalState} />
      </div>
    ) : null;

  return (
    <div className="game-shell">
      {/* Header */}
      <div className="heading">
        {!noBack && (
          <nav className="back-link" onClick={handleBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </nav>
        )}
        {i18n.t("STOP_TIME")}
        {showForward && (
          <nav className="home-link-forward" onClick={handleForward}>
            <FontAwesomeIcon icon={faArrowRight} />
          </nav>
        )}
        <nav className="home-link" onClick={() => window.location.reload()}>
          <FontAwesomeIcon icon={faRedo} />
        </nav>
      </div>

      {/* Status Bar */}
      {inTrial && (
        <div className="status-bar">
          <div className="level-badge">
            {i18n.t("TRIAL_COUNT", { current: trialIndex + 1, total: trials })}
          </div>
          <div className="level-badge">{i18n.t("SCORE_BADGE", { correct: correctCount })}</div>
        </div>
      )}

      {/* Instruction Modal */}
      {phase === "instructions" && (
        <InstructionModal
          show={true}
          modalClose={handleInstructionClose}
          msg={i18n.t("INSTRUCTIONS_TEXT")}
          language={language}
        />
      )}

      {/* Trial */}
      {inTrial && (
        <div className="st-area">
          <SceneStage
            label={i18n.t(SCENARIO_LABEL_KEY[cue.scenario])}
            overlay={renderOverlay()}
            approaching={approaching}
          >
            {renderScene()}
          </SceneStage>

          <div className="st-prompt-row">
            {phase === "approach" && (
              <div className="st-prompt st-prompt-wait">{i18n.t("WATCH_ROAD")}</div>
            )}
            {phase === "cue" && <div className="st-prompt">{i18n.t("WHAT_SHOULD_YOU_DO")}</div>}
            {phase === "feedback" && (
              <div className={"st-prompt " + (isCorrect ? "st-prompt-right" : "st-prompt-wrong")}>
                {isCorrect
                  ? i18n.t("CORRECT")
                  : i18n.t("CORRECT_ANSWER_WAS", {
                      action: i18n.t(ACTION_LABEL_KEY[cue.answer]),
                    })}
              </div>
            )}
          </div>

          <div className="st-actions">
            {ACTIONS.map((action) => {
              const classes = ["st-btn", "st-btn-" + action];
              if (!canAnswer) classes.push("st-btn-locked");
              if (phase === "feedback") {
                if (action === cue.answer) classes.push("st-btn-answer");
                if (action === chosen && !isCorrect) classes.push("st-btn-wrong");
              }
              return (
                <button
                  key={action}
                  type="button"
                  className={classes.join(" ")}
                  disabled={!canAnswer}
                  onClick={() => handleAnswer(action)}
                >
                  {i18n.t(ACTION_LABEL_KEY[action])}
                </button>
              );
            })}
          </div>

          <div className="st-next-row">
            {phase === "feedback" && (
              <button className="st-btn-next" onClick={handleNext}>
                {i18n.t("NEXT")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="st-area st-area-center">
          <div className="st-overlay-text">{i18n.t("GAME_OVER")}</div>
          <div className="st-final-score">
            {i18n.t("FINAL_SCORE", { correct: correctCount, total: trials })}
          </div>
        </div>
      )}

      {/* Questionnaire */}
      {phase === "questionnaire" && (
        <Questionnaire show={true} language={language} setResponse={handleQuestionnaireSubmit} />
      )}
    </div>
  );
};

export default Board;
