import React from "react";
import { Button, Modal } from "react-bootstrap";
import i18n from "../i18n";
import { GameOverReason } from "./GameCanvas";

interface Props {
  roundsCompleted: number;
  rounds: number;
  illegalCrossings: number;
  durationMs: number;
  reason: GameOverReason;
  onContinue(): void;
}

const OUTCOME_KEYS: Record<GameOverReason, string> = {
  complete: "SUMMARY_COMPLETE",
  lead: "SUMMARY_CRASH_LEAD",
  oncoming: "SUMMARY_CRASH_ONCOMING",
  tree: "SUMMARY_CRASH_TREE",
};

/** Formats milliseconds as m:ss. */
const formatDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/** End-of-game feedback shown before the questionnaire. */
export const Summary: React.FC<Props> = ({ roundsCompleted, rounds, illegalCrossings, durationMs, reason, onContinue }) => (
  <Modal
    show={true}
    animation={false}
    size="lg"
    aria-labelledby="contained-modal-title-vcenter"
    centered={true}
    backdrop="static"
  >
    <Modal.Header className="instruction-modal-header">
      <Modal.Title className="instruction-modal-title">
        {i18n.t("SUMMARY")}
      </Modal.Title>
    </Modal.Header>
    <Modal.Body className="instruction-modal-body">
      <div className="summary-outcome">{i18n.t(OUTCOME_KEYS[reason])}</div>
      <div className="summary-stats">
        <div className="summary-stat">
          <div className="summary-stat-value">{roundsCompleted} / {rounds}</div>
          <div className="summary-stat-label">{i18n.t("ROUNDS")}</div>
        </div>
        <div className="summary-stat">
          <div className="summary-stat-value">{illegalCrossings}</div>
          <div className="summary-stat-label">{i18n.t("ILLEGAL_CROSSINGS")}</div>
        </div>
        <div className="summary-stat">
          <div className="summary-stat-value">{formatDuration(durationMs)}</div>
          <div className="summary-stat-label">{i18n.t("DURATION")}</div>
        </div>
      </div>
      {illegalCrossings > 0 && (
        <div className="summary-tip">{i18n.t("SUMMARY_TIP_DOUBLE_YELLOW")}</div>
      )}
    </Modal.Body>
    <Modal.Footer className="instruction-modal-footer">
      <Button className="instruction-modal-btn" onClick={onContinue}>
        {i18n.t("Continue")}
      </Button>
    </Modal.Footer>
  </Modal>
);

export default Summary;
