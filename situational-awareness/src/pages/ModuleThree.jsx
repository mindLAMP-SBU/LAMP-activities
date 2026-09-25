import video5 from "../assets/video5.mp4";
import ModuleTemplate from "./ModuleTemplate";

const videoSources = [
  video5, 
];
const questions = [
  "You need to merge soon. What should you do next?",
]
const options = [
  ["Merge immediately", "Slow dramatically and wait near the endn of the lane for traffic to disapear", "Focus only on the side mirror and merge when you no longer see the vehicle in the mirror", "Check the traffic around you, adjust your speed to create a safe opening, verify the space beside you is clear, and merge when there is a sufficient gap"],
  ["Reduce speed and cover the brake", "Accelerate to clear the intersection quickly", "Swerve left to avoid the pedestrian", "Stop immediately in the intersection"]
]
const feedback = [
  [
    "A signal communicates your intention. It does not by itself create a safe opening.",
    "In this scenario, slowing dramatically could make matching the highway traffic flow and finding a safe gap more difficult.",
    "A vehicle disappearing from the mirror does not necessarily mean the lane is clear. Situational awareness means considering where that vehicle could have moved relative to you.",
    "Merging requires monitoring surrounding traffic and finding enough time and space to safely enter the traffic stream."
  ],
  [
    "Slowing slightly while preparing to brake gives you maximum reaction time. You maintain control, avoid sudden swerving, and stay predictable to other drivers. This is the correct response because the pedestrian is an immediate but partially obscured hazard.",
    "Speeding up reduces your reaction time and increases the severity of any collision. Clearing the intersection faster does not make you safer when a hazard is emerging directly in your path.",
    "Swerving introduces new risks: entering another lane, hitting another vehicle, or losing control. Situational awareness prioritizes predictable, controlled adjustments—not sudden lateral movement.",
    "Hard‑stopping in the middle of an active intersection can cause rear‑end collisions and block cross‑traffic. Stopping is only appropriate if the pedestrian is directly in your path and you cannot safely continue"
  ]
]
const correctAnswers = [
  4,
  1,
];

// src/pages/ModuleTwo.jsx
export default function ModuleThree() {
  return (
    <ModuleTemplate 
      moduleName={"Module Three"}
      videoSources={videoSources}
      questions={questions}
      options={options}
      feedback={feedback}
      correctAnswers={correctAnswers}
    />
  )
}