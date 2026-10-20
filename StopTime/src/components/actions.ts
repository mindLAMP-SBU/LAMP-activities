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
  /** "Green" | "Yellow" | "Red"; anything else falls back to a neutral gray. */
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

// ── Settings ──────────────────────────────────────────────────────────────
//
// A researcher can replace the bundled content by putting a `categories` array
// (same shape as actions.json) into the activity's settings. The activity is
// published under a spec other dashboards know by a different shape, so the
// settings object is read defensively: unknown keys are ignored, and anything
// malformed falls back to the bundled content rather than breaking a session.

export const DEFAULT_TRIALS = 16;
export const MAX_TRIALS = 90;

export interface ResolvedSettings {
  trials: number;
  categories: CategorySpec[];
  source: "custom" | "built-in";
}

const isText = (v: any): v is string => typeof v === "string" && v.trim() !== "";

function cleanButton(raw: any): ButtonSpec | null {
  if (!raw || typeof raw !== "object" || !isText(raw.text)) return null;
  return {
    text: raw.text,
    color: typeof raw.color === "string" ? raw.color : "",
    ...(raw.correct === true && { correct: true }),
  };
}

/**
 * Normalise one option from settings. `strict` (the default, used for real
 * sessions) drops an option that cannot be scored; the editor's preview passes
 * false so a half-written scenario still plays.
 */
export function cleanOption(raw: any, strict = true): OptionSpec | null {
  if (!raw || typeof raw !== "object" || (strict && !isText(raw.id))) return null;
  const buttons = (Array.isArray(raw.buttons) ? raw.buttons : [])
    .map(cleanButton)
    .filter((b: ButtonSpec | null): b is ButtonSpec => b !== null);
  // A trial with nothing to press, or nothing right to press, cannot be scored.
  if (strict && (buttons.length === 0 || !buttons.some((b: ButtonSpec) => b.correct))) {
    console.warn(`[StopTime] option "${raw.id}" has no usable correct button; skipped`);
    return null;
  }
  return {
    id: isText(raw.id) ? raw.id : "preview",
    ...(isText(raw.display) && { display: raw.display }),
    scene: isText(raw.scene) ? raw.scene : "road-normal",
    buttons,
    animations: (Array.isArray(raw.animations) ? raw.animations : []).filter(
      (l: any) => typeof l === "string"
    ),
  };
}

function cleanCategories(raw: any): CategorySpec[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c: any): CategorySpec | null => {
      if (!c || typeof c !== "object" || !isText(c.category)) return null;
      const options = (Array.isArray(c.options) ? c.options : [])
        .map((o: any) => cleanOption(o))
        .filter((o: OptionSpec | null): o is OptionSpec => o !== null);
      return options.length > 0 ? { category: c.category, options } : null;
    })
    .filter((c): c is CategorySpec => c !== null);
}

export function resolveSettings(raw: any): ResolvedSettings {
  const settings = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const n = settings.trials == null || settings.trials === "" ? NaN : Number(settings.trials);
  const trials = Number.isFinite(n) ? Math.max(1, Math.min(MAX_TRIALS, Math.round(n))) : DEFAULT_TRIALS;
  const custom = cleanCategories(settings.categories);
  return custom.length > 0
    ? { trials, categories: custom, source: "custom" }
    : { trials, categories: CATEGORIES, source: "built-in" };
}

// ── The animation language ────────────────────────────────────────────────
//
//   <seconds> Asset <Name> Load [Zoom] [Location <x> <y>] [Size <size>]
//   <seconds> Asset <Name> Animate <state>
//   <seconds> Asset <Name> Location <x> <y> <duration>
//   <seconds> Asset <Name> Size <size> <duration>
//   <seconds> Asset <Name> Unload
//   <seconds> Scene <name>
//   <seconds> End
//
// Seconds may be fractional. `Load` without `Zoom` puts the asset on screen at
// full size immediately. Location is an offset from where the asset is drawn,
// in scene units (the scene is 500 × 400), with positive y moving up; Size
// scales the asset around its anchor (see registry.ts). Both default to 0 0
// and 1. The Location and Size actions glide to their new value over
// <duration> seconds (0 = instantly). Anything moved past the scene's edge is
// clipped by the stage. An unrecognized line is skipped with a warning rather
// than throwing, so one typo cannot freeze a trial mid-session.

export interface Placement {
  x: number;
  y: number;
  size: number;
}

export const DEFAULT_PLACEMENT: Placement = { x: 0, y: 0, size: 1 };

export type Step =
  | ({ at: number; kind: "load"; asset: string; zoom: boolean } & Placement)
  | { at: number; kind: "animate"; asset: string; state: string }
  | { at: number; kind: "location"; asset: string; x: number; y: number; duration: number }
  | { at: number; kind: "size"; asset: string; size: number; duration: number }
  | { at: number; kind: "unload"; asset: string }
  | { at: number; kind: "scene"; scene: string }
  | { at: number; kind: "end" };

type Warn = (message: string) => void;

function parseLine(line: string, warn: Warn): Step | null {
  const t = line.trim().split(/\s+/).filter(Boolean);
  if (t.length === 0) return null;

  const at = Number(t[0]) * 1000;
  if (!Number.isFinite(at) || at < 0) {
    warn(`bad timestamp in "${line}"`);
    return null;
  }

  const verb = (t[1] ?? "").toLowerCase();

  if (verb === "end") return { at, kind: "end" };

  if (verb === "scene") {
    if (!t[2]) {
      warn(`Scene needs a name in "${line}"`);
      return null;
    }
    return { at, kind: "scene", scene: t[2] };
  }

  // `Unload <Name>` is accepted as a shorthand for `Asset <Name> Unload`.
  if (verb === "unload") {
    if (!t[2]) {
      warn(`Unload needs an asset in "${line}"`);
      return null;
    }
    return { at, kind: "unload", asset: t[2] };
  }

  if (verb === "asset") {
    const asset = t[2];
    const op = (t[3] ?? "").toLowerCase();
    if (!asset || !op) {
      warn(`incomplete Asset line "${line}"`);
      return null;
    }
    const num = (i: number) => (t[i] === undefined ? NaN : Number(t[i]));
    // A missing duration means "instantly"; a bad one is a typo worth flagging.
    const duration = (i: number) => {
      const d = t[i] === undefined ? 0 : num(i);
      return Number.isFinite(d) && d >= 0 ? d * 1000 : NaN;
    };

    if (op === "load") {
      const step: Step = { at, kind: "load", asset, zoom: false, ...DEFAULT_PLACEMENT };
      for (let i = 4; i < t.length; i++) {
        const word = t[i].toLowerCase();
        if (word === "zoom") step.zoom = true;
        else if (word === "location" && Number.isFinite(num(i + 1)) && Number.isFinite(num(i + 2))) {
          step.x = num(i + 1);
          step.y = num(i + 2);
          i += 2;
        } else if (word === "size" && num(i + 1) > 0) {
          step.size = num(i + 1);
          i += 1;
        } else {
          warn(`ignoring "${t[i]}" in Load line "${line}"`);
        }
      }
      return step;
    }
    if (op === "location") {
      const [x, y, d] = [num(4), num(5), duration(6)];
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(d)) {
        warn(`Location needs <x> <y> <duration> in "${line}"`);
        return null;
      }
      return { at, kind: "location", asset, x, y, duration: d };
    }
    if (op === "size") {
      const [size, d] = [num(4), duration(5)];
      if (!(size > 0) || !Number.isFinite(d)) {
        warn(`Size needs a size above 0 and a <duration> in "${line}"`);
        return null;
      }
      return { at, kind: "size", asset, size, duration: d };
    }
    if (op === "animate") {
      if (!t[4]) {
        warn(`Animate needs a state in "${line}"`);
        return null;
      }
      return { at, kind: "animate", asset, state: t[4] };
    }
    if (op === "unload") return { at, kind: "unload", asset };
    warn(`unknown Asset operation in "${line}"`);
    return null;
  }

  warn(`unknown action in "${line}"`);
  return null;
}

export interface Timeline {
  steps: Step[];
  /** When the response window opens, in ms from the start of the trial. */
  endAt: number;
}

/**
 * `warnings`, when given, collects every problem found in the timeline as well
 * as logging it, so the editor's preview can show them to the researcher.
 */
export function parseTimeline(option: OptionSpec, warnings?: string[]): Timeline {
  const warn: Warn = (message) => {
    console.warn(`[StopTime] ${option.id}: ${message}`);
    warnings?.push(message);
  };
  const steps = (option.animations ?? [])
    .map((line) => parseLine(line, warn))
    .filter((s): s is Step => s !== null)
    .sort((a, b) => a.at - b.at);

  const end = steps.find((s) => s.kind === "end");
  // A timeline with no End line would never let the participant answer, so
  // fall back to opening the window once the last step has played.
  const endAt = end ? end.at : steps.length > 0 ? steps[steps.length - 1].at : 0;
  if (!end) {
    warn(`no "End" line; opening answers at ${endAt}ms`);
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
