import rawActions from "../actions.json";

/**
 * actions.json: the content of the activity, and the little animation language
 * its timelines are written in.
 *
 * The file is imported rather than fetched because a LAMP activity ships as a
 * single inlined HTML file, so there is nothing to fetch from at runtime.
 */

export interface ButtonSpec {
  text: string;
  /** "Green" | "Yellow" | "Red"; anything else falls back to a neutral grey. */
  color: string;
  /** Present and true on the button(s) that count as a correct answer. */
  correct?: boolean;
}

export interface OptionSpec {
  id: string;
  /** Human label for the option. Not shown anywhere yet. */
  display?: string;
  /** Key into the scene registry. */
  scene: string;
  buttons: ButtonSpec[];
  animations: string[];
}

export interface CategorySpec {
  category: string;
  options: OptionSpec[];
}

export const CATEGORIES: CategorySpec[] = rawActions as CategorySpec[];

// ── The animation language ────────────────────────────────────────────────
//
//   <seconds> Asset <Name> Load [Zoom]
//   <seconds> Asset <Name> Animate <state>
//   <seconds> Asset <Name> Unload
//   <seconds> Scene <name>
//   <seconds> End
//
// Seconds may be fractional. `Load` without `Zoom` puts the asset on screen at
// full size immediately. An unrecognised line is skipped with a warning rather
// than throwing, so one typo cannot freeze a trial mid-session.

export type Step =
  | { at: number; kind: "load"; asset: string; zoom: boolean }
  | { at: number; kind: "animate"; asset: string; state: string }
  | { at: number; kind: "unload"; asset: string }
  | { at: number; kind: "scene"; scene: string }
  | { at: number; kind: "end" };

function parseLine(line: string, optionId: string): Step | null {
  const t = line.trim().split(/\s+/).filter(Boolean);
  if (t.length === 0) return null;

  const at = Number(t[0]) * 1000;
  if (!Number.isFinite(at) || at < 0) {
    console.warn(`[StopTime] ${optionId}: bad timestamp in "${line}"`);
    return null;
  }

  const verb = (t[1] ?? "").toLowerCase();

  if (verb === "end") return { at, kind: "end" };

  if (verb === "scene") {
    if (!t[2]) {
      console.warn(`[StopTime] ${optionId}: Scene needs a name in "${line}"`);
      return null;
    }
    return { at, kind: "scene", scene: t[2] };
  }

  // `Unload <Name>` is accepted as a shorthand for `Asset <Name> Unload`.
  if (verb === "unload") {
    if (!t[2]) {
      console.warn(`[StopTime] ${optionId}: Unload needs an asset in "${line}"`);
      return null;
    }
    return { at, kind: "unload", asset: t[2] };
  }

  if (verb === "asset") {
    const asset = t[2];
    const op = (t[3] ?? "").toLowerCase();
    if (!asset || !op) {
      console.warn(`[StopTime] ${optionId}: incomplete Asset line "${line}"`);
      return null;
    }
    if (op === "load") {
      return { at, kind: "load", asset, zoom: t.slice(4).some((m) => m.toLowerCase() === "zoom") };
    }
    if (op === "animate") {
      if (!t[4]) {
        console.warn(`[StopTime] ${optionId}: Animate needs a state in "${line}"`);
        return null;
      }
      return { at, kind: "animate", asset, state: t[4] };
    }
    if (op === "unload") return { at, kind: "unload", asset };
    console.warn(`[StopTime] ${optionId}: unknown Asset operation in "${line}"`);
    return null;
  }

  console.warn(`[StopTime] ${optionId}: unknown action in "${line}"`);
  return null;
}

export interface Timeline {
  steps: Step[];
  /** When the response window opens, in ms from the start of the trial. */
  endAt: number;
}

export function parseTimeline(option: OptionSpec): Timeline {
  const steps = (option.animations ?? [])
    .map((line) => parseLine(line, option.id))
    .filter((s): s is Step => s !== null)
    .sort((a, b) => a.at - b.at);

  const end = steps.find((s) => s.kind === "end");
  // A timeline with no End line would never let the participant answer, so
  // fall back to opening the window once the last step has played.
  const endAt = end ? end.at : steps.length > 0 ? steps[steps.length - 1].at : 0;
  if (!end) {
    console.warn(`[StopTime] ${option.id}: no "End" line; opening answers at ${endAt}ms`);
  }

  return { steps, endAt };
}

/** The button(s) marked correct, as shown back to the participant. */
export function correctButtons(option: OptionSpec): ButtonSpec[] {
  return option.buttons.filter((b) => b.correct);
}

export function isCorrect(option: OptionSpec, chosen: ButtonSpec): boolean {
  return chosen.correct === true;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Draw `trials` options at random from a category. Dealt in shuffled blocks of
 * the whole category, so every option comes up a near-equal number of times
 * however many trials are configured while the order stays unpredictable. A
 * block is re-shuffled if it would repeat the previous block's last option
 * back to back.
 */
export function buildDeck(options: OptionSpec[], trials: number): OptionSpec[] {
  if (options.length === 0) return [];
  const deck: OptionSpec[] = [];
  while (deck.length < trials) {
    let block = shuffle(options);
    const prev = deck[deck.length - 1];
    for (let attempt = 0; attempt < 5 && prev && options.length > 1 && block[0].id === prev.id; attempt++) {
      block = shuffle(options);
    }
    deck.push(...block);
  }
  return deck.slice(0, trials);
}
