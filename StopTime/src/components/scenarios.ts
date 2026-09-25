/**
 * The scenario / cue table for Stop Time.
 *
 * Every trial picks one cue. The cue decides which scene is drawn, what state
 * that scene animates into, and which of the three buttons is correct. Cues are
 * deliberately presented out of their natural order — a bus can swing its stop
 * arm out without the amber warning having come first — so the participant has
 * to read the situation in front of them rather than follow a script.
 */

export type Action = "continue" | "slow" | "stop";
export type ScenarioId = "bus" | "light" | "ped";

export interface Cue {
  /** Stable identifier written into the results payload. */
  id: string;
  scenario: ScenarioId;
  /** The state prop handed to that scenario's scene component. */
  state: string;
  answer: Action;
  /**
   * A transient state the scene passes through on its way to `state`, so a
   * change that happens in stages in real life is not shown as a jump. The
   * response window stays shut until the real cue lands.
   */
  leadIn?: string;
}

/** How long a cue's `leadIn` state is held before the cue itself lands. */
export const LEAD_IN_MS = 650;

export const CUES: Cue[] = [
  // School bus ahead
  { id: "bus_driving", scenario: "bus", state: "driving", answer: "continue" },
  { id: "bus_amber", scenario: "bus", state: "amber", answer: "slow" },
  { id: "bus_sign", scenario: "bus", state: "sign", answer: "stop" },
  // Traffic signal ahead
  { id: "light_green", scenario: "light", state: "green", answer: "continue" },
  { id: "light_yellow", scenario: "light", state: "yellow", answer: "stop" },
  { id: "light_red", scenario: "light", state: "red", answer: "stop", leadIn: "yellow" },
  // Pedestrian crossing ahead. Two states: someone waiting beside the crossing
  // is reason enough to slow down, and someone on it is reason to stop.
  { id: "ped_waiting", scenario: "ped", state: "waiting", answer: "slow" },
  { id: "ped_crossing", scenario: "ped", state: "crossing", answer: "stop" },
];

/** The state each scene sits in during the approach, before the cue lands. */
export const BASELINE_STATE: Record<ScenarioId, string> = {
  bus: "driving",
  light: "green",
  ped: "waiting",
};

export const SCENARIO_LABEL_KEY: Record<ScenarioId, string> = {
  bus: "SCENARIO_BUS",
  light: "SCENARIO_LIGHT",
  ped: "SCENARIO_PEDESTRIAN",
};

export const ACTION_LABEL_KEY: Record<Action, string> = {
  continue: "ACTION_CONTINUE",
  slow: "ACTION_SLOW",
  stop: "ACTION_STOP",
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Build a deck of `trials` cues. Cues are dealt in shuffled blocks of the full
 * set, which keeps the eight situations near-evenly represented however many
 * trials are configured, while the order stays unpredictable. A block is
 * re-shuffled if it would repeat the previous block's last cue back to back.
 */
export function buildDeck(trials: number): Cue[] {
  const deck: Cue[] = [];
  while (deck.length < trials) {
    let block = shuffle(CUES);
    const prev = deck[deck.length - 1];
    for (let attempt = 0; attempt < 5 && prev && block[0].id === prev.id; attempt++) {
      block = shuffle(CUES);
    }
    deck.push(...block);
  }
  return deck.slice(0, trials);
}
