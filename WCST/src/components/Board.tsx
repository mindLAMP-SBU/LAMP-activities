import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faHome,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { InstructionModal } from "./InstructionModal";
import { Questionnaire } from "./Questionnaire";
import i18n from "../i18n";
import signsData from "./SignData";
import "./WCST.css";

// ── Types ──────────────────────────────────────────────
type Phase = "instruction" | "playing" | "questionnaire" | "done";
type PromptKind = "description" | "category";

interface Sign {
  image: string;
  description: string;
  category: string;
}

interface Trial {
  kind: PromptKind;
  prompt: string;        // the description or category shown to the participant
  options: Sign[];       // the four signs offered, in display order
  correctIdx: number;    // index into options of the sign that matches the prompt
}

interface TrialResult {
  item: string;
  type: string;
  trial_number: number;
  prompt_type: string;       // "description" | "category"
  prompt: string;
  options: string[];         // descriptions of the four signs shown
  correct_index: number;
  correct_answer: string;
  chosen_index: number;      // -1 on timeout
  chosen_answer: string;
  correct: boolean;
  rt_ms: number;
  duration: number;
}

interface Props {
  data: any;
}

// ── Constants ──────────────────────────────────────────
const OPTIONS_PER_TRIAL = 4;
const DEFAULT_QUESTIONS = 20;

// Signs come from signs.json, which may hold anywhere from 4 to many entries.
// Anything missing an image, description or category is dropped up front so the
// trial builder never has to defend against half-filled records.
const ALL_SIGNS: Sign[] = (signsData as any[])
  .filter((s) => s && typeof s === "object")
  .map((s) => ({
    image: String(s.image ?? "").trim(),
    description: String(s.description ?? "").trim(),
    category: String(s.category ?? "").trim(),
  }))
  .filter((s) => s.image !== "" && s.description !== "" && s.category !== "");

// ── Helpers ────────────────────────────────────────────
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Three distractors that differ from the target on the prompted field, so
// exactly one of the four options can ever satisfy the prompt. Returns null
// when the sign set cannot supply enough of them.
function pickDistractors(
  signs: Sign[],
  targetIdx: number,
  field: PromptKind
): number[] | null {
  const target = signs[targetIdx];
  const picked: number[] = [];
  const usedImages = new Set<string>([target.image]);

  for (const i of shuffle(signs.map((_, idx) => idx))) {
    if (picked.length >= OPTIONS_PER_TRIAL - 1) break;
    if (i === targetIdx) continue;
    if (signs[i][field] === target[field]) continue;
    if (usedImages.has(signs[i].image)) continue;
    usedImages.add(signs[i].image);
    picked.push(i);
  }

  return picked.length === OPTIONS_PER_TRIAL - 1 ? picked : null;
}

function buildTrial(
  signs: Sign[],
  targetIdx: number,
  kind: PromptKind
): Trial | null {
  const distractors = pickDistractors(signs, targetIdx, kind);
  if (!distractors) return null;

  const order = shuffle([targetIdx, ...distractors]);
  return {
    kind,
    prompt: signs[targetIdx][kind],
    options: order.map((i) => signs[i]),
    correctIdx: order.indexOf(targetIdx),
  };
}

function buildTrials(signs: Sign[], count: number): Trial[] {
  const trials: Trial[] = [];
  if (signs.length < OPTIONS_PER_TRIAL) return trials;

  // Roughly half description prompts, half category prompts, in random order.
  const kinds = shuffle(
    Array.from({ length: count }, (_, i): PromptKind =>
      i % 2 === 0 ? "description" : "category"
    )
  );

  // Cycle through a shuffled sign order so every sign is used as a target once
  // before any of them comes round a second time.
  let order = shuffle(signs.map((_, i) => i));
  let cursor = 0;

  for (let i = 0; i < count; i++) {
    let trial: Trial | null = null;

    for (let attempt = 0; attempt < signs.length && !trial; attempt++) {
      if (cursor >= order.length) {
        order = shuffle(order);
        cursor = 0;
      }
      const targetIdx = order[cursor++];
      // A category prompt needs three signs from other categories; when the set
      // cannot supply them for this target, ask about its description instead.
      trial =
        buildTrial(signs, targetIdx, kinds[i]) ??
        (kinds[i] === "category"
          ? buildTrial(signs, targetIdx, "description")
          : null);
    }

    if (!trial) break;
    trials.push(trial);
  }

  return trials;
}

// ── Sign Image ─────────────────────────────────────────
// Alt text is deliberately empty: the description would give the answer away.
function SignImage({ sign }: { sign: Sign }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className="sign-image-fallback">{i18n.t("IMAGE_UNAVAILABLE")}</div>;
  }
  return (
    <img
      className="sign-image"
      src={sign.image}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

// ── Board Component ────────────────────────────────────
const Board: React.FC<Props> = ({ data }) => {
  const settings = data.activity?.settings ?? data.settings ?? {};

  const requestedQuestions = Number(
    settings.total_questions ?? settings.question_count ?? DEFAULT_QUESTIONS
  );
  const totalQuestions = Math.max(
    1,
    Math.min(100, Math.round(requestedQuestions) || DEFAULT_QUESTIONS)
  );

  const timeLimitMs =
    settings.time_limit_per_trial_s && settings.time_limit_per_trial_s > 0
      ? Math.max(5, Math.min(120, settings.time_limit_per_trial_s)) * 1000
      : 0; // 0 = untimed

  const language =
    settings.language ?? data.configuration?.language ?? data.language ?? "en-US";

  // ── State ────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("instruction");
  const [trialIdx, setTrialIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // ── Refs ─────────────────────────────────────────────
  const trialStartRef = useRef(0);
  const resultsRef = useRef<TrialResult[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Set synchronously the moment a trial is answered. The `disabled` state
  // lands a render later, so two taps in the same frame — or a tap racing the
  // timeout — would both get past it and record the trial twice.
  const answeredRef = useRef(false);

  // ── i18n ─────────────────────────────────────────────
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  // ── Build the trial list ─────────────────────────────
  const trials = useMemo(
    () => buildTrials(ALL_SIGNS, totalQuestions),
    [totalQuestions]
  );

  const currentTrial = trials[trialIdx];

  // ── Start a trial ────────────────────────────────────
  const startTrial = useCallback(
    (idx: number) => {
      if (idx >= trials.length) {
        setPhase("questionnaire");
        return;
      }
      answeredRef.current = false;
      setTrialIdx(idx);
      setElapsed(0);
      setFeedback(null);
      setChosenIdx(null);
      setDisabled(false);
      trialStartRef.current = Date.now();
      setPhase("playing");
    },
    [trials]
  );

  // ── Record a response and move on ────────────────────
  const recordTrial = useCallback(
    (chosen: number, rt: number, type: "response" | "timeout") => {
      const trial = trials[trialIdx];
      if (!trial || answeredRef.current) return;
      answeredRef.current = true;

      const correct = chosen >= 0 && chosen === trial.correctIdx;

      resultsRef.current.push({
        item: `question_${trialIdx + 1}`,
        type,
        trial_number: trialIdx + 1,
        prompt_type: trial.kind,
        prompt: trial.prompt,
        options: trial.options.map((o) => o.description),
        correct_index: trial.correctIdx,
        correct_answer: trial.options[trial.correctIdx].description,
        chosen_index: chosen,
        chosen_answer: chosen >= 0 ? trial.options[chosen].description : "",
        correct,
        rt_ms: rt,
        duration: rt,
      });

      if (correct) setCorrectCount((c) => c + 1);
      setFeedback(correct ? "correct" : "incorrect");
      setChosenIdx(chosen >= 0 ? chosen : null);
      setDisabled(true);

      const isLast = trialIdx + 1 >= trials.length;
      setTimeout(
        () => (isLast ? setPhase("questionnaire") : startTrial(trialIdx + 1)),
        isLast ? 800 : 700
      );
    },
    [trials, trialIdx, startTrial]
  );

  // ── Timer (only if a time limit is set) ──────────────
  useEffect(() => {
    if (phase === "playing" && !disabled && timeLimitMs > 0) {
      timerRef.current = setInterval(() => {
        const el = Date.now() - trialStartRef.current;
        setElapsed(el);
        if (el >= timeLimitMs) {
          if (timerRef.current) clearInterval(timerRef.current);
          recordTrial(-1, timeLimitMs, "timeout");
        }
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, disabled, timeLimitMs, recordTrial]);

  // ── Preload the next trial's images ──────────────────
  // Keeps image fetch latency out of the next trial's reaction time.
  useEffect(() => {
    const next = trials[trialIdx + 1];
    if (phase !== "playing" || !next) return;
    next.options.forEach((sign) => {
      const img = new Image();
      img.src = sign.image;
    });
  }, [phase, trialIdx, trials]);

  // ── Handle option selection ──────────────────────────
  const handleOptionClick = useCallback(
    (optionIdx: number) => {
      if (phase !== "playing" || disabled) return;
      if (timerRef.current) clearInterval(timerRef.current);
      recordTrial(optionIdx, Date.now() - trialStartRef.current, "response");
    },
    [phase, disabled, recordTrial]
  );

  // ── Send results ─────────────────────────────────────
  const sendResults = useCallback(
    (questionnaire: any) => {
      const results = resultsRef.current;
      const correct = results.filter((r) => r.correct);

      const correctRTs = correct.map((r) => r.rt_ms);
      const meanRtCorrectMs =
        correctRTs.length > 0
          ? Math.round(correctRTs.reduce((a, b) => a + b, 0) / correctRTs.length)
          : 0;

      const duration = results.reduce((s, r) => s + r.duration, 0);

      const finalSlices = [
        ...results,
        {
          item: "exit",
          type: "exit",
          trial_number: 0,
          prompt_type: "",
          prompt: "",
          options: [],
          correct_index: -1,
          correct_answer: "",
          chosen_index: -1,
          chosen_answer: "",
          correct: false,
          rt_ms: 0,
          duration: 0,
        },
      ];

      const payload = {
        timestamp: new Date().getTime(),
        duration,
        static_data: {
          duration,
          score: Math.round((correct.length / Math.max(1, results.length)) * 100),
          correct_answers: correct.length,
          total_questions: results.length,
          total_signs: ALL_SIGNS.length,
          mean_rt_correct_ms: meanRtCorrectMs,

          questionnaire,
        },
        temporal_slices: finalSlices,
      };

      setPhase("done");
      parent.postMessage(JSON.stringify(payload), "*");
    },
    []
  );

  // ── Instruction close ────────────────────────────────
  const handleInstructionClose = useCallback(() => {
    startTrial(0);
  }, [startTrial]);

  // ── Render ───────────────────────────────────────────
  const remaining = timeLimitMs > 0 ? Math.max(0, timeLimitMs - elapsed) : 0;
  const remainingSec = Math.ceil(remaining / 1000);
  const isWarning = timeLimitMs > 0 && remaining < 5000;

  return (
    <div className="game-shell">
      {/* Header */}
      <div className="heading">
        <span
          className="back-link"
          onClick={() => parent.postMessage(JSON.stringify({ timestamp: new Date().getTime(), clickBack: true }), "*")}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </span>
        {i18n.t("SIGNS")}
        <span className="home-link-forward">
          <FontAwesomeIcon icon={faArrowRight} />
        </span>
        <span
          className="home-link"
          onClick={() => parent.postMessage(JSON.stringify({ timestamp: new Date().getTime(), clickBack: true }), "*")}
        >
          <FontAwesomeIcon icon={faHome} />
        </span>
      </div>

      {/* Status bar */}
      {phase === "playing" && currentTrial && (
        <div className="status-bar">
          <span className="level-badge">
            {i18n.t("QUESTION_COUNT", {
              current: trialIdx + 1,
              total: trials.length,
            })}
          </span>
          <span className="level-badge">
            {i18n.t("SCORE", { correct: correctCount })}
          </span>
          {timeLimitMs > 0 && (
            <span className={`timer-badge${isWarning ? " warning" : ""}`}>
              {remainingSec}s
            </span>
          )}
        </div>
      )}

      {/* Instruction */}
      {phase === "instruction" && (
        <InstructionModal
          show={true}
          modalClose={handleInstructionClose}
          msg={i18n.t("INSTRUCTIONS")}
          language={language}
        />
      )}

      {/* Nothing to play — signs.json is too small or unusable */}
      {phase !== "instruction" && trials.length === 0 && (
        <div className="wcst-area">
          <div className="wcst-overlay-text">{i18n.t("NO_SIGNS")}</div>
        </div>
      )}

      {/* Playing */}
      {phase === "playing" && currentTrial && (
        <div className="wcst-area">
          {/* Prompt */}
          <div className="sign-prompt">
            <div className="sign-prompt-label">
              {currentTrial.kind === "description"
                ? i18n.t("PROMPT_DESCRIPTION")
                : i18n.t("PROMPT_CATEGORY")}
            </div>
            <div className="sign-prompt-text">{currentTrial.prompt}</div>
          </div>

          {/* Feedback text */}
          <div className={`wcst-feedback${feedback ? ` ${feedback}` : ""}`}>
            {feedback === "correct" && i18n.t("CORRECT")}
            {feedback === "incorrect" && i18n.t("INCORRECT")}
          </div>

          {/* The four signs to choose from */}
          <div className="sign-options">
            {currentTrial.options.map((sign, idx) => {
              let feedbackClass = "";
              if (feedback) {
                if (idx === currentTrial.correctIdx) {
                  feedbackClass = " option-correct";
                } else if (idx === chosenIdx) {
                  feedbackClass = " option-incorrect";
                }
              }
              return (
                <button
                  key={`${trialIdx}-${idx}`}
                  type="button"
                  className={`sign-option${feedbackClass}`}
                  onClick={() => handleOptionClick(idx)}
                  disabled={disabled}
                >
                  <SignImage sign={sign} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Questionnaire */}
      {phase === "questionnaire" && (
        <div className="wcst-area">
          <div className="wcst-overlay-text">{i18n.t("GAME_OVER")}</div>
          <Questionnaire
            show={true}
            language={language}
            setResponse={sendResults}
          />
        </div>
      )}

      {/* Done */}
      {phase === "done" && (
        <div className="wcst-area">
          <div className="wcst-overlay-text">{i18n.t("GAME_OVER")}</div>
        </div>
      )}
    </div>
  );
};

export default Board;
