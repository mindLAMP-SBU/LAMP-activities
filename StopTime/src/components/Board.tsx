import React, { useState, useRef, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faRedo } from "@fortawesome/free-solid-svg-icons";
import { InstructionModal } from "./InstructionModal";
import { Questionnaire } from "./Questionnaire";
import { CategorySelect } from "./CategorySelect";
import {
  ButtonSpec,
  CATEGORIES,
  CategorySpec,
  OptionSpec,
  buildDeck,
  correctButtons,
  isCorrect,
  parseTimeline,
} from "./actions";
import { ASSETS, BUTTON_COLOR_CLASS, DEFAULT_BUTTON_CLASS, SCENES } from "./registry";
import i18n from "../i18n";
import "./StopTime.css";

type Phase =
  | "instructions"
  | "category"
  | "script"    // timeline running, buttons locked
  | "answer"    // End has fired, waiting for a choice
  | "feedback"
  | "gameOver"
  | "questionnaire"
  | "done";

/** One asset currently on the stage. Order is draw order. */
interface LoadedAsset {
  name: string;
  state: string;
  zooming: boolean;
}

interface TrialResult {
  trial: number;            // 1-indexed
  option: string;
  category: string;
  response: string;         // the button text chosen
  correctAnswer: string;    // the button text(s) that would have been right
  correct: boolean;
  rt: number;               // ms from the End step to the button press
}

interface Props {
  data: any;
}

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
  const language = data.configuration?.language ?? "en-US";
  const showForward = data.forward ?? false;
  const noBack = data.noBack ?? false;

  const [phase, setPhase] = useState<Phase>("instructions");
  const [category, setCategory] = useState<CategorySpec | null>(null);
  const [trialIndex, setTrialIndex] = useState(0);
  const [option, setOption] = useState<OptionSpec | null>(null);
  const [scene, setScene] = useState<string>("road-normal");
  const [loaded, setLoaded] = useState<LoadedAsset[]>([]);
  const [chosen, setChosen] = useState<ButtonSpec | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const deckRef = useRef<OptionSpec[]>([]);
  const resultsRef = useRef<TrialResult[]>([]);
  const routesRef = useRef<any[]>([]);
  const startTimeRef = useRef(Date.now());
  const openedAtRef = useRef(0);
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
  // A trial is its option's timeline, played out on timers. Every step mutates
  // the stage; the End step opens the response window and starts the decision
  // clock, so time spent watching the animation is never counted against the
  // answer.
  const startTrial = useCallback(
    (index: number) => {
      clearTimers();
      const next = deckRef.current[index];
      if (!next) return;

      respondedRef.current = false;
      setChosen(null);
      setTrialIndex(index);
      setOption(next);
      setScene(next.scene);
      setLoaded([]);
      setPhase("script");

      const { steps, endAt } = parseTimeline(next);

      steps.forEach((step) => {
        timersRef.current.push(
          setTimeout(() => {
            switch (step.kind) {
              case "load": {
                const def = ASSETS[step.asset];
                if (!def) {
                  console.warn(`[StopTime] ${next.id}: unknown asset "${step.asset}"`);
                  return;
                }
                setLoaded((prev) =>
                  prev.some((a) => a.name === step.asset)
                    ? prev
                    : [...prev, { name: step.asset, state: def.initialState, zooming: step.zoom }]
                );
                // Let the far-away frame paint before releasing the zoom.
                if (step.zoom) {
                  timersRef.current.push(
                    setTimeout(
                      () =>
                        setLoaded((prev) =>
                          prev.map((a) => (a.name === step.asset ? { ...a, zooming: false } : a))
                        ),
                      50
                    )
                  );
                }
                return;
              }
              case "animate":
                setLoaded((prev) =>
                  prev.map((a) => (a.name === step.asset ? { ...a, state: step.state } : a))
                );
                return;
              case "unload":
                setLoaded((prev) => prev.filter((a) => a.name !== step.asset));
                return;
              case "scene":
                setScene(step.scene);
                return;
              case "end":
                openedAtRef.current = performance.now();
                setPhase("answer");
                return;
            }
          }, step.at)
        );
      });

      // Guard for a timeline whose End is missing or out of order.
      if (!steps.some((s) => s.kind === "end")) {
        timersRef.current.push(
          setTimeout(() => {
            openedAtRef.current = performance.now();
            setPhase("answer");
          }, endAt)
        );
      }
    },
    [clearTimers]
  );

  const handleAnswer = useCallback(
    (button: ButtonSpec) => {
      if (respondedRef.current || !option || !category) return;
      respondedRef.current = true;
      clearTimers();

      const rt = Math.round(performance.now() - openedAtRef.current);
      const correct = isCorrect(option, button);
      const correctAnswer = correctButtons(option)
        .map((b) => b.text)
        .join(" / ");

      const result: TrialResult = {
        trial: resultsRef.current.length + 1,
        option: option.id,
        category: category.category,
        response: button.text,
        correctAnswer,
        correct,
        rt,
      };
      resultsRef.current.push(result);
      routesRef.current.push({
        duration: rt,
        item: result.trial,
        level: category.category,
        type: correct,
        value: button.text,
        option: option.id,
        correct_answer: correctAnswer,
      });

      if (correct) setCorrectCount((c) => c + 1);
      setChosen(button);
      setPhase("feedback");
    },
    [option, category, clearTimers]
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

      // Breakdowns are derived from whatever is actually in actions.json, so
      // the payload keeps up with the content file on its own.
      const byOption: Record<string, { correct: number; total: number }> = {};
      all.forEach((r) => {
        const row = byOption[r.option] ?? { correct: 0, total: 0 };
        row.total += 1;
        if (r.correct) row.correct += 1;
        byOption[r.option] = row;
      });

      // How the wrong answers went wrong, keyed "<right button>><chosen button>".
      // Derived from the button text in actions.json, so it needs no knowledge
      // of what the buttons happen to say.
      const confusions: Record<string, number> = {};
      all
        .filter((r) => !r.correct)
        .forEach((r) => {
          const key = r.correctAnswer + ">" + r.response;
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
          category: category?.category ?? null,
          by_option: byOption,
          confusion_matrix: confusions,
          // Decision speed: reported for analysis, not folded into the score
          mean_decision_ms: mean(rts),
          median_decision_ms: median(rts),
          mean_decision_all_ms: mean(all.map((r) => r.rt)),
          trials,
          ...(qData && { questionnaire: qData }),
        },
        temporal_slices: routesRef.current,
      };
    },
    [trials, category]
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
    setPhase("category");
  };

  const handleCategorySelect = (picked: CategorySpec) => {
    startTimeRef.current = Date.now();
    deckRef.current = buildDeck(picked.options, trials);
    resultsRef.current = [];
    routesRef.current = [];
    setCorrectCount(0);
    setCategory(picked);
    // startTrial reads deckRef, which is already filled.
    startTrial(0);
  };

  const handleQuestionnaireSubmit = (response: any) => {
    setPhase("done");
    routesRef.current.push({ type: "manual_exit", value: false });
    sendResult(false, false, response);
  };

  // ── Render ────────────────────────────────────────────
  const inTrial = phase === "script" || phase === "answer" || phase === "feedback";
  const canAnswer = phase === "answer";
  const answeredCorrectly = chosen !== null && chosen.correct === true;

  const Scene = SCENES[scene];

  const sceneSvg = loaded.map((a) => {
    const def = ASSETS[a.name];
    if (!def) return null;
    return <def.Svg key={a.name} state={a.state} zooming={a.zooming} />;
  });

  // Assets that are not purely SVG contribute a DOM layer over the stage. Each
  // gets its own wrapper so it can zoom independently of the others.
  const sceneOverlay = loaded
    .filter((a) => ASSETS[a.name]?.Overlay)
    .map((a) => {
      const Overlay = ASSETS[a.name].Overlay!;
      return (
        <div
          key={a.name}
          className={"st-overlay-item" + (a.zooming ? " st-overlay-far" : "")}
        >
          <Overlay state={a.state} zooming={a.zooming} />
        </div>
      );
    });

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

      {/* Category picker */}
      {phase === "category" && (
        <CategorySelect categories={CATEGORIES} onSelect={handleCategorySelect} />
      )}

      {/* Trial */}
      {inTrial && option && (
        <div className="st-area">
          {Scene ? (
            <Scene label={i18n.t("ROAD_SCENE")} overlay={sceneOverlay.length ? sceneOverlay : undefined}>
              {sceneSvg}
            </Scene>
          ) : (
            <div className="st-stage st-stage-missing">{`Unknown scene "${scene}"`}</div>
          )}

          <div className="st-prompt-row">
            {phase === "script" && (
              <div className="st-prompt st-prompt-wait">{i18n.t("WATCH_ROAD")}</div>
            )}
            {phase === "answer" && <div className="st-prompt">{i18n.t("WHAT_SHOULD_YOU_DO")}</div>}
            {phase === "feedback" && (
              <div
                className={"st-prompt " + (answeredCorrectly ? "st-prompt-right" : "st-prompt-wrong")}
              >
                {answeredCorrectly
                  ? i18n.t("CORRECT")
                  : i18n.t("CORRECT_ANSWER_WAS", {
                      action: correctButtons(option)
                        .map((b) => b.text)
                        .join(" / "),
                    })}
              </div>
            )}
          </div>

          <div className="st-actions">
            {option.buttons.map((button, i) => {
              const classes = [
                "st-btn",
                BUTTON_COLOR_CLASS[button.color?.toLowerCase()] ?? DEFAULT_BUTTON_CLASS,
              ];
              if (!canAnswer) classes.push("st-btn-locked");
              if (phase === "feedback") {
                if (button.correct) classes.push("st-btn-answer");
                if (button === chosen && !answeredCorrectly) classes.push("st-btn-wrong");
              }
              return (
                <button
                  key={`${button.text}-${i}`}
                  type="button"
                  className={classes.join(" ")}
                  disabled={!canAnswer}
                  onClick={() => handleAnswer(button)}
                >
                  {button.text}
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
