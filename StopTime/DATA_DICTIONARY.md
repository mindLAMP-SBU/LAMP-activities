# Stop Time — Data Dictionary

## Cognitive Test Background

Stop Time is a **situation-appraisal** task built on a road-hazard frame. On each trial a single scene comes into view — a school bus, a traffic signal, or a marked pedestrian crossing — and settles into one of its states. The participant then answers one question: *continue, slow down, or stop?*

Unlike a reaction-time task, the dependent variable here is **accuracy, not latency**. There is no deadline and no penalty for a slow answer. What the task measures is whether the participant can look at a familiar road situation, identify which cue is present, and map it onto the correct action.

Three processes are engaged:

- **Cue discrimination.** The states of each scenario differ only in which lamps are lit, whether the bus's stop arm is extended, or whether the pedestrian has left the sidewalk. The bodywork, the road, and the framing are identical, so the participant has to find the one feature that changed.
- **Rule retrieval.** Each cue maps onto an action through an overlearned traffic rule (amber flashers mean slow; an extended stop arm means stop). This is crystallized semantic knowledge, relatively preserved in normal aging and in many clinical populations, which makes departures from it informative.
- **Graded response selection.** The three responses are ordered rather than arbitrary: *continue → slow down → stop* is a scale of caution. This means errors carry direction. Answering "slow down" when the situation called for "stop" is a different failure from answering "stop" when the road was clear, and the `confusion_matrix` field preserves that distinction.

Cues are presented **out of their natural sequence**. A bus can swing its stop arm out without the amber warning phase having been shown first. This is deliberate: it prevents the participant from answering by position in a predictable script and forces each trial to be read on its own. The one exception is the traffic signal, which always shows yellow briefly on its way to red, because a signal jumping straight from green to red would read as a fault rather than as a situation.

### Related Tests and Constructs

| Construct | How Measured | Related Standardized Test |
|-----------|-------------|--------------------------|
| **Hazard appraisal / situation awareness** | `accuracy`, `stop_correct / stop_total` | Hazard Perception Test (Horswill & McKenna, 2004); Endsley's Level 2 situation awareness |
| **Response selection among graded alternatives** | `confusion_matrix` | Choice RT paradigms; Hick's law (1952) |
| **Failure to inhibit a default action** | `stop>continue`, `slow>continue` in `confusion_matrix` | Go/No-Go commission errors |
| **Over-cautious responding** | `continue>stop`, `continue>slow` in `confusion_matrix` | False alarm rate in signal-detection terms |
| **Visual cue discrimination** | Per-scenario accuracy (`bus_*`, `light_*`, `ped_*`) | Feature-difference visual search |
| **Decision latency (secondary)** | `median_decision_ms` | Reported for context only; not part of the score |

Key references:

> Endsley, M. R. (1995). Toward a theory of situation awareness in dynamic systems. *Human Factors, 37*(1), 32–64.

> Horswill, M. S., & McKenna, F. P. (2004). Drivers' hazard perception ability: Situation awareness on the road. In S. Banbury & S. Tremblay (Eds.), *A Cognitive Approach to Situation Awareness: Theory and Application*. Ashgate.

> Anstey, K. J., Wood, J., Lord, S., & Walker, J. G. (2005). Cognitive, sensory and physical factors enabling driving safety in older adults. *Clinical Psychology Review, 25*(1), 45–65.

> Hick, W. E. (1952). On the rate of gain of information. *Quarterly Journal of Experimental Psychology, 4*(1), 11–26.

---

This document describes the data emitted by the Stop Time activity via `postMessage` when the game ends. The payload is a JSON string with the following top-level structure.

## Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `duration` | number | Total elapsed time in milliseconds from game start to result submission |
| `static_data` | object | Summary scores and metadata (see below) |
| `temporal_slices` | array | Per-trial event log (see below) |
| `timestamp` | number | Unix timestamp (ms) when the result was sent |
| `forward` | boolean | *(optional)* If the activity was configured with a forward nav button, indicates whether the user advanced forward (`true`) or clicked back (`false`) |
| `done` | boolean | *(optional)* `true` when the game ended normally (not via back/forward navigation) |
| `clickBack` | boolean | *(optional)* `true` when the user exited via the back arrow |

---

## static_data — Accuracy Metrics

### Primary Outcome

| Field | Type | Description |
|-------|------|-------------|
| `correct_answers` | number | **Number of situations answered correctly.** The primary outcome. |
| `total_questions` | number | Number of situations presented. Equals `trials` unless the participant exited early. |
| `wrong_answers` | number | `total_questions − correct_answers`. |
| `accuracy` | number | Percentage correct (0–100). Identical to `score`. |
| `score` | number | Accuracy percentage (0–100). Duplicated under the standard LAMP field name. |
| `point` | number | `2` if `score ≥ 80`, else `1`. Standard LAMP field. |

### By Scenario

The bus and signal scenarios contribute three cues each and the pedestrian crossing contributes two, so the pedestrian denominator is smaller by design. Compare each pair against its own total.

| Field | Type | Description |
|-------|------|-------------|
| `bus_correct` / `bus_total` | number | Correct answers out of school-bus situations presented. |
| `light_correct` / `light_total` | number | Correct answers out of traffic-signal situations presented. |
| `ped_correct` / `ped_total` | number | Correct answers out of pedestrian-crossing situations presented. |

A scenario-specific deficit is usually a perceptual finding rather than a cognitive one — for example, selectively poor performance on the traffic signal in a participant with colour vision deficiency, since that scenario is the only one where the cue is carried by hue alone.

### By Correct Action

| Field | Type | Description |
|-------|------|-------------|
| `continue_correct` / `continue_total` | number | Situations whose correct answer was **continue** (nothing is happening). |
| `slow_correct` / `slow_total` | number | Situations whose correct answer was **slow down**. |
| `stop_correct` / `stop_total` | number | Situations whose correct answer was **stop**. |

With default settings these are not balanced against each other: of the eight cues, two call for *continue*, two for *slow down*, and four for *stop*. Compare each against its own denominator, not against the other actions.

At the default 16 trials that is four *continue* trials, four *slow down* and eight *stop*. The two smaller cells are thin enough that a single session gives only a rough per-action estimate; aggregate across sessions, or raise `trials`, before reading much into one of them.

### Confusion Matrix

| Field | Type | Description |
|-------|------|-------------|
| `confusion_matrix` | object | Counts of each error type, keyed `"<correct_action>><chosen_action>"`. For example `{"stop>slow": 3}` means three situations called for a stop but only a slow down was chosen. Correct answers are not represented. |

The six possible keys are `continue>slow`, `continue>stop`, `slow>continue`, `slow>stop`, `stop>continue`, `stop>slow`. Grouping them by direction gives two interpretable tendencies:

- **Under-reacting** (`stop>slow`, `stop>continue`, `slow>continue`) — the participant chose a less cautious action than the situation required. In a driving frame these are the consequential errors.
- **Over-reacting** (`continue>slow`, `continue>stop`, `slow>stop`) — the participant chose a more cautious action than required. Often reflects a response bias toward stopping rather than a failure to read the scene.

### Decision Speed

Reported for context. **These fields do not contribute to the score.** The task is untimed, so a long latency may reflect deliberation, distraction, or simply that the participant set the device down.

| Field | Type | Description |
|-------|------|-------------|
| `mean_decision_ms` | number | Mean time in ms from the cue landing to the button press, over correct responses only. |
| `median_decision_ms` | number | Median of the same. Preferred over the mean, since untimed latencies are heavily right-skewed. |
| `mean_decision_all_ms` | number | Mean over all responses, correct and incorrect. |

The clock starts when the cue is applied to the scene, **not** when the trial begins. Time spent watching the scene approach is excluded.

### Settings Echo

| Field | Type | Description |
|-------|------|-------------|
| `trials` | number | Configured number of situations |
| `min_approach_ms` | number | Minimum approach delay before the cue lands (ms) |
| `max_approach_ms` | number | Maximum approach delay before the cue lands (ms) |

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
| `duration` | number | Decision time in milliseconds, from the cue landing to the button press. |
| `item` | number | Sequential situation number (1-indexed). |
| `level` | string | Scenario identifier: `"bus"`, `"light"`, or `"ped"`. |
| `type` | boolean | `true` if the chosen action matched the correct action. |
| `value` | string | The action chosen: `"continue"`, `"slow"`, or `"stop"`. |
| `cue` | string | The exact situation shown (see the cue table below). |
| `correct_action` | string | The action the situation called for: `"continue"`, `"slow"`, or `"stop"`. |

### Exit Entry

The final entry in `temporal_slices` is always:

```json
{ "type": "manual_exit", "value": true }
```

`value` is `true` if the user exited via navigation (back/forward), `false` for normal game completion.

---

## Cue Table

The eight situations, their scenario, and the action each requires. This mapping is defined in `src/components/scenarios.ts`.

| `cue` | Scenario | What is shown | `correct_action` |
|-------|----------|---------------|------------------|
| `bus_driving` | School bus | Bus ahead, no lamps lit, stop arm folded in | `continue` |
| `bus_amber` | School bus | Amber roof lamps alternating, stop arm still folded | `slow` |
| `bus_sign` | School bus | Red roof lamps alternating, stop arm swung out, tail lights lit | `stop` |
| `light_green` | Traffic signal | Green lamp lit | `continue` |
| `light_yellow` | Traffic signal | Yellow lamp lit | `stop` |
| `light_red` | Traffic signal | Yellow lamp briefly, then the red lamp lit | `stop` |
| `ped_waiting` | Pedestrian crossing | Someone standing on the sidewalk beside the crossing | `slow` |
| `ped_crossing` | Pedestrian crossing | That person has stepped out onto the crossing | `stop` |

The pedestrian scenario has only two states. Somebody standing beside a crossing is reason enough to be ready to slow, so there is no case here whose answer is *continue*.

Note that `light_yellow` maps to **stop**, not slow down. This is an instructed rule the participant is given up front rather than something they are expected to infer. This is the rule the participant is given in the instructions, and it is the legally correct answer in most jurisdictions (a yellow signal means stop unless stopping is unsafe). It is also the one place where the task deliberately breaks the "amber means slow" association carried by the bus scenario, so errors on `light_yellow` specifically are worth inspecting: they usually indicate the participant generalized the amber rule rather than applying the instruction given.

`ped_waiting` maps to **slow down** on the principle a driving examiner would apply: a pedestrian beside a marked crossing is a developing hazard, and the correct response is to come off speed and be ready to yield rather than to carry on at pace. Answering *continue* there is scored as under-reacting and shows up in the confusion matrix as `slow>continue`.

---

## Game Logic Summary

### Deck construction

The deck is dealt in shuffled blocks of all eight cues. With `trials` set to a multiple of eight, every situation appears exactly `trials / 8` times; otherwise the final partial block is truncated. Blocks are re-shuffled if the first cue would repeat the previous block's last cue back to back, so the same situation never appears twice in a row.

### A single trial

1. The scene is drawn small and far off, in its baseline state (bus driving, signal green, car cruising). The three buttons are visible but locked.
2. Over roughly 600ms the scene rolls up to full size.
3. After a random approach delay (default 800–1600ms from the start of the trial), the cue is applied. The bus's stop arm swings out, lamps begin flashing, the pedestrian steps off the curb — whatever that cue calls for. A cue may first pass through a **lead-in** state: `light_red` holds yellow for 650ms before going red. The response window stays shut through the lead-in, so the decision clock always starts on the cue itself. The buttons unlock, the prompt "What should you do?" appears, and the decision clock starts. For a `continue` cue nothing changes at this moment; the absence of any developing hazard *is* the cue.
4. The participant taps **Continue**, **Slow Down**, or **Stop**. There is no time limit and no timeout.
5. Feedback appears: "Correct!" or "The right choice was …". The correct button is outlined and a wrong pick is struck through. The scene stays on screen in its cue state so the situation and the answer can be seen together.
6. The participant taps **Next** for the following situation.

### Completion

1. After all situations, a "Game Over" overlay shows the final tally
2. Post-game questionnaire (clarity + happiness ratings)
3. Results sent via `postMessage`

### Configurable Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `trials` | number | `16` | Number of situations (clamped to 1–90). A multiple of 8 keeps the eight cues exactly balanced. |
| `min_approach_ms` | number | `800` | Minimum delay before the cue lands (clamped to ≥ 300) |
| `max_approach_ms` | number | `1600` | Maximum delay before the cue lands (clamped to ≥ `min_approach_ms`) |

---

## Key Analysis Variables

| Research Question | Primary Variable | Notes |
|---|---|---|
| Overall situation appraisal | `accuracy` | The headline measure. Healthy adults familiar with road rules should approach ceiling; scores well below 90% warrant inspecting the confusion matrix before concluding anything about ability. |
| Direction of error | `confusion_matrix` grouped into under- vs over-reacting | The most informative field in the payload. Two participants at 70% accuracy can be failing in opposite ways. |
| Failure to withhold the default action | `stop>continue` + `slow>continue` | Choosing to drive on when the scene called for caution. The closest analogue to a commission error. |
| Response bias toward caution | `continue>stop` + `continue>slow` | Stopping for a clear road. Usually a strategy rather than a deficit, but a high rate alongside high overall accuracy suggests the participant is not discriminating and is defaulting to "stop". |
| Perceptual vs cognitive locus | Per-scenario accuracy spread | Accuracy that is uniform across `bus_*`, `light_*` and `ped_*` points to a rule-knowledge issue; accuracy that collapses in one scenario points to a perceptual one. |
| Instruction adherence | Errors on `light_yellow` in `temporal_slices` | The one cue whose correct answer is an instructed rule rather than an inference. Isolates rule-following from hazard detection. |
| Engagement / attention | `median_decision_ms` alongside `accuracy` | Very short latencies with chance-level accuracy suggest the participant is tapping through without reading the scene. Since the task is untimed, this is the main use for the latency fields. |
| Ceiling effects | `accuracy` distribution across a sample | The task is designed to be easy for intact participants. Treat it as a screen for impairment, not as a graded measure of ability in the normal range. |
