import { CATEGORIES, OptionSpec, parseTimeline } from "./actions";
import { ASSETS, BUTTON_COLOR_CLASS, SCENES } from "./registry";

/**
 * The editor protocol (v1): how a dashboard's activity editor talks to this
 * activity. Every message is namespaced under `lamp_editor`, which no dashboard
 * sends when launching an activity for a participant, so the normal launch
 * path never sees it.
 *
 *   editor → activity  { lamp_editor: { type: "describe", requestId } }
 *   activity → editor  JSON { lamp_editor: { type: "manifest", requestId, protocol, manifest } }
 *   editor → activity  { lamp_editor: { type: "preview", settings, target, configuration } }
 *   activity → editor  JSON { lamp_editor: { type: "preview_state", phase, warnings } }
 *
 * Replies are JSON strings, like the results a LAMP activity posts.
 */

export const EDITOR_PROTOCOL = 1;

/** Which option a preview plays: indexes into the previewed settings' categories. */
export interface PreviewTarget {
  categoryIndex: number;
  optionIndex: number;
}

/**
 * Everything an editor needs to author content for this activity. Built from
 * the registries, so adding an asset or scene here reaches the editor without
 * a dashboard change.
 */
export function buildManifest() {
  return {
    activity: "stop_time",
    settingsKey: "categories",
    scenes: Object.keys(SCENES),
    assets: Object.keys(ASSETS).reduce((out, name) => {
      out[name] = { states: ASSETS[name].states, initialState: ASSETS[name].initialState };
      return out;
    }, {} as Record<string, { states: string[]; initialState: string }>),
    buttonColors: Object.keys(BUTTON_COLOR_CLASS).map((c) => c[0].toUpperCase() + c.slice(1)),
    timeline: {
      actions: ["Load", "Animate", "Location", "Size", "Unload", "Scene", "End"],
    },
    defaults: { categories: CATEGORIES },
  };
}

/**
 * Everything wrong with one option that would show up during a session, in
 * words a researcher can act on. Reported alongside a preview.
 */
export function checkOption(option: OptionSpec): string[] {
  const warnings: string[] = [];
  if (option.buttons.length === 0) warnings.push("no buttons");
  else if (!option.buttons.some((b) => b.correct)) warnings.push("no button is marked correct");
  option.buttons.forEach((b) => {
    if (b.color && !BUTTON_COLOR_CLASS[b.color.toLowerCase()]) {
      warnings.push(`button "${b.text}" has unknown color "${b.color}"`);
    }
  });
  if (!SCENES[option.scene]) warnings.push(`unknown scene "${option.scene}"`);

  const { steps } = parseTimeline(option, warnings);
  steps.forEach((step) => {
    if (step.kind === "scene" && !SCENES[step.scene]) {
      warnings.push(`unknown scene "${step.scene}"`);
    } else if (step.kind !== "scene" && step.kind !== "end") {
      const def = ASSETS[step.asset];
      if (!def) warnings.push(`unknown asset "${step.asset}"`);
      else if (step.kind === "animate" && def.states.indexOf(step.state) < 0) {
        warnings.push(`${step.asset} has no state "${step.state}"`);
      }
    }
  });
  return warnings;
}

/** Post a protocol message back to whichever window sent `source`. */
export function reply(source: MessageEventSource | null, message: Record<string, any>) {
  const target: any = source ?? window.parent;
  target.postMessage(JSON.stringify({ lamp_editor: message }), "*");
}
