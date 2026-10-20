# Stop Time — Data Dictionary

## Cognitive Test Background

Stop Time is a **situation-appraisal** task built on a road-hazard frame. The participant picks a category, and then on each trial a scene plays out in front of them — a school bus pulling up, a signal changing, somebody stepping into a crossing — and answers one question: *what should you do?*

Unlike a reaction-time task, the dependent variable here is **accuracy, not latency**. There is no deadline and no penalty for a slow answer. What the task measures is whether the participant can watch a familiar road situation develop, identify what has changed, and map it onto the correct action.

Three processes are engaged:

- **Cue discrimination.** The situations within a category differ only in which lamps are lit, whether the bus's stop arm is extended, or whether the pedestrian has left the sidewalk. The scene, the bodywork and the framing are identical, so the participant has to find the one feature that changed.
- **Rule retrieval.** Each situation maps onto an action through an overlearned traffic rule (amber flashers mean slow; an extended stop arm means stop). This is crystallized semantic knowledge, relatively preserved in normal aging and in many clinical populations, which makes departures from it informative.
- **Graded response selection.** With the default content the three responses are ordered rather than arbitrary: *continue → slow down → stop* is a scale of caution. This means errors carry direction, and the `confusion_matrix` field preserves that.

The response window stays shut until the situation has finished developing, so the participant cannot answer from a partial view, and the decision clock starts only at that point.

### Related Tests and Constructs

| Construct | How Measured | Related Standardized Test |
|-----------|-------------|--------------------------|
| **Hazard appraisal / situation awareness** | `accuracy` | Hazard Perception Test (Horswill & McKenna, 2004); Endsley's Level 2 situation awareness |
| **Response selection among graded alternatives** | `confusion_matrix` | Choice RT paradigms; Hick's law (1952) |
| **Failure to inhibit a default action** | Errors toward the least cautious button in `confusion_matrix` | Go/No-Go commission errors |
| **Over-cautious responding** | Errors toward the most cautious button in `confusion_matrix` | False alarm rate in signal-detection terms |
| **Visual cue discrimination** | `by_option` accuracy spread | Feature-difference visual search |
| **Decision latency (secondary)** | `median_decision_ms` | Reported for context only; not part of the score |

Key references:

> Endsley, M. R. (1995). Toward a theory of situation awareness in dynamic systems. *Human Factors, 37*(1), 32–64.

> Horswill, M. S., & McKenna, F. P. (2004). Drivers' hazard perception ability: Situation awareness on the road. In S. Banbury & S. Tremblay (Eds.), *A Cognitive Approach to Situation Awareness: Theory and Application*. Ashgate.

> Anstey, K. J., Wood, J., Lord, S., & Walker, J. G. (2005). Cognitive, sensory and physical factors enabling driving safety in older adults. *Clinical Psychology Review, 25*(1), 45–65.

> Hick, W. E. (1952). On the rate of gain of information. *Quarterly Journal of Experimental Psychology, 4*(1), 11–26.

---

## The content file: `src/actions.json`

**All of the activity's content lives in `src/actions.json`.** The code contains no situations of its own. The file is imported at build time rather than fetched, because a LAMP activity ships as a single inlined HTML file with nothing to fetch from.

Changing what the activity asks means editing that file. Adding a new backdrop or a new object on the road means writing a component and adding one line to `src/components/registry.ts`.

### Structure

```jsonc
[
  {
    "category": "Vehicles",          // what the participant picks from
    "options": [
      {
        "id": "bus_stopping",        // written into the results payload
        "display": "Bus (Stopping)", // human label; not shown anywhere yet
        "scene": "road-normal",      // key into the scene registry
        "buttons": [
          { "text": "Continue",  "color": "Green" },
          { "text": "Slow Down", "color": "Yellow" },
          { "text": "Stop",      "color": "Red", "correct": true }
        ],
        "animations": [
          "0 Asset SchoolBus Load Zoom",
          "1 Asset SchoolBus Animate amber",
          "3 Asset SchoolBus Animate sign",
          "5 End"
        ]
      }
    ]
  }
]
```

| Field | Notes |
|-------|-------|
| `category` | Shown on the picker. One category is chosen per session and every trial is drawn from it. |
| `id` | Must be unique. Appears as `option` in `temporal_slices` and as a key in `by_option`. |
| `display` | Reserved for a future per-option picker. Currently unused. |
| `scene` | Must be a key in `SCENES`. An unknown scene renders a visible placeholder rather than a blank stage. |
| `buttons` | Rendered left to right, exactly as written. `text` is used verbatim — it is **not** run through i18n, so button labels are whatever language the file is written in. |
| `color` | `Green` (#1E8E4E), `Yellow` (#E8A200) or `Red` (#D52027) — the activity's existing palette. Any other value falls back to a neutral gray. |
| `correct` | Put it on the button(s) that count as a correct answer. More than one may be marked; any of them scores as correct. An option with none marked can never be answered correctly. |

### The animation language

Each line is `<seconds> <Action> [<Action Data>]`. Seconds may be fractional and are measured from the start of the trial. Lines may be written in any order; they are sorted by timestamp on load, and lines with the same timestamp keep their written order. The dashboard's scenario editor always keeps them in time order.

| Line | Effect |
|------|--------|
| `<t> Asset <Name> Load` | Put `<Name>` on the stage at full size, in its registered initial state. |
| `<t> Asset <Name> Load Zoom` | Same, but the asset zooms in from the distance over ~620ms, as though you were driving up to it. |
| `<t> Asset <Name> Animate <state>` | Change an already-loaded asset's state. The state string is passed straight to the component. |
| `<t> Asset <Name> Load … Location <x> <y> Size <s>` | Optional placement on Load (either part may be left out; any order after `Load`). Defaults are `Location 0 0` and `Size 1`. |
| `<t> Asset <Name> Location <x> <y> <d>` | Glide an on-screen asset to a new location over `<d>` seconds (`0` = jump). |
| `<t> Asset <Name> Size <s> <d>` | Resize an on-screen asset to `<s>` over `<d>` seconds (`0` = jump). `<s>` must be above 0. |
| `<t> Asset <Name> Unload` | Take the asset off the stage. `<t> Unload <Name>` is accepted as a shorthand. |
| `<t> Scene <name>` | Swap the backdrop mid-trial. |
| `<t> End` | Open the response window. The buttons unlock, the prompt changes, and the decision clock starts. |

**Location and size.**
- **Location** is an offset from where the asset is normally drawn, in scene units. The scene is 500 × 400, so `x = 1` moves the asset 1/500 of the width right, and `y = 1` moves it 1/400 of the height **up**.
- **Size** scales the whole asset (the Pedestrian's sidewalk and crossing included) around its anchor, the point where it meets the road (`anchor` in `registry.ts`), so a resized asset stays on the tarmac.
- Anything moved or grown past the edge of the scene is clipped.
- Location and Size glide at a constant speed and run independently of each other, of state changes, and of a Load's zoom. A Location step can move a pedestrian across the road while they walk.
- Unloading an asset forgets its placement; loading it again starts from the Load line's values.

A line that cannot be parsed — an unknown action, a missing argument, a non-numeric timestamp, an asset that is not in the registry — is skipped with a `console.warn` naming the option and the offending line. The rest of the timeline still plays, so a typo costs one step rather than the session.

An option with **no `End` line** would leave the participant unable to answer. Rather than hang, the window opens once the last step has played, and a warning is logged.

### Registry

`src/components/registry.ts` maps the names used in the file onto components.

| Registry | Keys at present |
|----------|-----------------|
| `SCENES` | `road-normal` → `scenes/RoadNormal.tsx` (two-way road); `road-single-lane` → `scenes/RoadSingleLane.tsx` (driver's POV centred in their own lane of an ordinary two-lane US road: double yellow centre line and the oncoming lane to the left, white edge line and a narrow shoulder to the right, utility poles along the far side) |
| `ASSETS` | `SchoolBus` (states `driving`, `amber`, `sign`), `TrafficSignal` (`green`, `yellow`, `red`), `Pedestrian` (`waiting`; `crossing`, which steps onto the crosswalk and keeps walking in place), `PoliceCar` (a generic black-and-white Ford Police Interceptor Utility; `driving`; `lights`, flashing in the lane ahead; `pulled-over`, glides onto the shoulder with lights flashing), `ConstructionZone` (`slow`, `stop` — the flagger's paddle turns over between them), `Deer` (`roadside`; `crossing`, which bounds into the lane and keeps running in place), `RailroadCrossing` (`idle`; `flashing`; `gates`, which lowers the arm across the lane) |

An asset entry declares its `initialState` and may supply an `Overlay` as well as `Svg`, for assets that are not purely SVG — `TrafficSignal` draws its mast in SVG and its signal head as SimpleRT's `TrafficLight` component on a DOM layer above the stage.

---

This document describes the data emitted by the Stop Time activity via `postMessage` when the game ends. The payload is a JSON string with the following top-level structure.

## Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `duration` | number | Elapsed time in milliseconds from the category being chosen to result submission |
| `static_data` | object | Summary scores and metadata (see below) |
| `temporal_slices` | array | Per-trial event log (see below) |
| `timestamp` | number | Unix timestamp (ms) when the result was sent |
| `forward` | boolean | *(optional)* If the activity was configured with a forward nav button, indicates whether the user advanced forward (`true`) or clicked back (`false`) |
| `done` | boolean | *(optional)* `true` when the game ended normally (not via back/forward navigation) |
| `clickBack` | boolean | *(optional)* `true` when the user exited via the back arrow |

---

## static_data — Accuracy Metrics

Every breakdown below is **derived from whatever scenarios were played**, either the activity's custom `settings.categories` or the bundled `actions.json`. The payload keeps up with the content on its own. There are no hardcoded scenario or action fields.

### Primary Outcome

| Field | Type | Description |
|-------|------|-------------|
| `correct_answers` | number | **Number of situations answered correctly.** The primary outcome. |
| `total_questions` | number | Number of situations presented. Equals `trials` unless the participant exited early. |
| `wrong_answers` | number | `total_questions − correct_answers`. |
| `accuracy` | number | Percentage correct (0–100). Identical to `score`. |
| `score` | number | Accuracy percentage (0–100). Duplicated under the standard LAMP field name. |
| `point` | number | `2` if `score ≥ 80`, else `1`. Standard LAMP field. |

### Session Context

| Field | Type | Description |
|-------|------|-------------|
| `category` | string | The category the participant chose. `null` if they exited before choosing. |
| `trials` | number | Configured number of situations. |
| `scenario_source` | string | `"custom"` if the session played scenarios from `settings.categories`, `"built-in"` if it played the bundled `actions.json`. Option ids are only comparable between sessions that used the same scenario set. |

Because the category is chosen by the participant, **it is not a randomised condition.** Comparing accuracy across categories between participants compares self-selected groups. Within a participant, repeated sessions on the same category are the comparable unit.

### By Option

| Field | Type | Description |
|-------|------|-------------|
| `by_option` | object | `{ "<option id>": { "correct": n, "total": n } }` for every option that came up. Options the deck never dealt are absent rather than zero. |

The deck is dealt in shuffled blocks of the whole category, so with `trials` set to a multiple of the category size every option appears an equal number of times. A category with three options and 9 trials gives exactly 3 of each.

An option-specific deficit is usually a perceptual finding rather than a cognitive one — for example, selectively poor performance on `light_yellow` and `light_green` in a participant with color vision deficiency, since those are the only situations where the cue is carried by hue alone.

### Confusion Matrix

| Field | Type | Description |
|-------|------|-------------|
| `confusion_matrix` | object | Counts of each error type, keyed `"<correct button text>><chosen button text>"`. For example `{"Stop>Slow Down": 3}` means three situations called for *Stop* but *Slow Down* was chosen. Correct answers are not represented. |

Keys use the button text from `actions.json` verbatim, so they change if the buttons are reworded. Where an option marks several buttons correct, the key's left-hand side is those texts joined with `" / "`.

With the default content, grouping the keys by direction gives two interpretable tendencies:

- **Under-reacting** (`Stop>Slow Down`, `Stop>Continue`, `Slow Down>Continue`) — a less cautious action than the situation required. In a driving frame these are the consequential errors.
- **Over-reacting** (`Continue>Slow Down`, `Continue>Stop`, `Slow Down>Stop`) — a more cautious action than required. Often a response bias toward stopping rather than a failure to read the scene.

### Decision Speed

Reported for context. **These fields do not contribute to the score.** The task is untimed, so a long latency may reflect deliberation, distraction, or simply that the participant set the device down.

| Field | Type | Description |
|-------|------|-------------|
| `mean_decision_ms` | number | Mean time in ms from the `End` step to the button press, over correct responses only. |
| `median_decision_ms` | number | Median of the same. Preferred over the mean, since untimed latencies are heavily right-skewed. |
| `mean_decision_all_ms` | number | Mean over all responses, correct and incorrect. |

The clock starts when the `End` step fires, **not** when the trial begins. Time spent watching the situation develop is excluded, and because different options have different `End` times, that excluded span varies by option.

### Questionnaire

| Field | Type | Description |
|-------|------|-------------|
| `questionnaire` | object | *(optional)* Post-game self-report. Contains `clarity` (1–5) and `happiness` (1–5) ratings. Only present when the game ends normally. |

---

## temporal_slices — Event Log

An array of event objects, one per situation plus a final exit event.

### Trial Entry

| Field | Type | Description |
|-------|------|-------------|
| `duration` | number | Decision time in milliseconds, from the `End` step to the button press. |
| `item` | number | Sequential situation number (1-indexed). |
| `level` | string | The chosen category, e.g. `"Vehicles"`. |
| `type` | boolean | `true` if the chosen button was marked `correct`. |
| `value` | string | The text of the button chosen. |
| `option` | string | The `id` of the option shown. |
| `correct_answer` | string | The text of the correct button(s), joined with `" / "` if more than one. |

### Exit Entry

The final entry in `temporal_slices` is always:

```json
{ "type": "manual_exit", "value": true }
```

`value` is `true` if the user exited via navigation (back/forward), `false` for normal game completion.

---

## Game Logic Summary

1. **Instructions** modal.
2. **Category picker.** Every category in the scenario set (custom `settings.categories`, or else `actions.json`) is listed. The participant picks one; the deck for the whole session is dealt from that category's options.
3. **Trials.** Each trial plays its option's timeline. The buttons are on screen but locked, with the prompt "Watch the road...", until the `End` step fires; then they unlock, the prompt becomes "What should you do?", and the decision clock starts. There is no time limit and no timeout.
4. **Feedback.** "Correct!" or "The right choice was …". The correct button is outlined and a wrong pick is struck through. The scene stays on screen in its final state so the situation and the answer can be seen together. The participant taps **Next**.
5. **Completion.** A "Game Over" overlay shows the final tally, then the questionnaire, then results are sent via `postMessage`.

### Configurable Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `trials` | number | `16` | Number of situations (clamped to 1–90). A multiple of the chosen category's option count keeps those options exactly balanced. |
| `categories` | array | *(absent)* | Custom scenarios, in exactly the shape of `actions.json`. When present and usable they **replace** the bundled scenarios. When absent, empty or malformed, the bundled `actions.json` plays. Options with no correct button are skipped. Normally authored with the DriveAssist dashboard's scenario editor rather than by hand. |

Timing is not a separate setting: how long each situation takes to develop is written into that option's `animations`.

Settings are read defensively. Unknown keys are ignored, so the activity plays correctly whatever a dashboard stored, including the Spin-the-Wheel settings (`low_risk`, `high_risk`, …) a stock dashboard writes for `lamp.spin_wheel`.

### Deployment under `lamp.spin_wheel`

On the DriveAssist server, StopTime is published as the **`lamp.spin_wheel`** spec, so any stock mindLAMP dashboard pointed at that server can launch it. Stock dashboards can play it but can't author scenarios. Only the DriveAssist dashboard has the scenario editor. Install the build by setting the spec's `executable` through the LAMP API (data only; no server change). Either inline the build:

```sh
curl -X PUT "$LAMP_SERVER/activity_spec/lamp.spin_wheel"   -u "$LAMP_USER:$LAMP_PASSWORD" -H "Content-Type: application/json"   -d "{\"executable\": \"data:text/html;base64,$(tr -d '\n' < ../dist/out/stoptime.html.b64)\"}"
```

or host `stoptime.html.b64` somewhere reachable and set `executable` to its `https:` URL. A stock dashboard that saves the activity's settings may drop `categories`. The activity then falls back to the bundled scenarios until they are re-saved from the DriveAssist dashboard.

### Editor protocol

The activity also answers the dashboard's editor, using messages namespaced under `lamp_editor` (see `src/components/editor.ts`). Participant launches never send these messages.

| Direction | Message |
|---|---|
| editor → activity | `{ lamp_editor: { type: "describe", requestId } }` |
| activity → editor | `JSON { lamp_editor: { type: "manifest", requestId, protocol: 1, manifest } }`. The manifest lists the scenes, the assets and their states, the button colors, and the bundled categories. |
| editor → activity | `{ lamp_editor: { type: "preview", settings, target: { categoryIndex, optionIndex }, configuration } }`. Plays that one option on repeat and reports no results. |
| activity → editor | `JSON { lamp_editor: { type: "preview_state", phase, warnings } }` |

---

## Key Analysis Variables

| Research Question | Primary Variable | Notes |
|---|---|---|
| Overall situation appraisal | `accuracy` | The headline measure. Healthy adults familiar with road rules should approach ceiling; scores well below 90% warrant inspecting the confusion matrix before concluding anything about ability. |
| Direction of error | `confusion_matrix` grouped into under- vs over-reacting | The most informative field in the payload. Two participants at 70% accuracy can be failing in opposite ways. |
| Which situation is failing | `by_option` | Localises a deficit to a specific situation. Read it alongside that option's `animations` to see what cue the participant actually missed. |
| Perceptual vs cognitive locus | `by_option` accuracy spread | Accuracy that is uniform across a category's options points to a rule-knowledge issue; accuracy that collapses on one option points to a perceptual one. |
| Engagement / attention | `median_decision_ms` alongside `accuracy` | Very short latencies with chance-level accuracy suggest the participant is tapping through without watching the scene. Since the task is untimed, this is the main use for the latency fields. |
| Ceiling effects | `accuracy` distribution across a sample | The task is designed to be easy for intact participants. Treat it as a screen for impairment, not as a graded measure of ability in the normal range. |
| Category comparisons | `category` + `accuracy` | Self-selected, not randomised. Compare within participant across sessions, not between participants who chose differently. |
