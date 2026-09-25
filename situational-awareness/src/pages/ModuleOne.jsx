import video1 from "../assets/video1.mp4";
import video2 from "../assets/video2.mp4";
import ModuleTemplate from "./ModuleTemplate";

const videoSources = [
  video1, 
  video2,
];
const questions = [
  "What is the safety hazard shown?", 
  "What should you do in this case?",
]
const options = [
  ["The car ahead is too fast", "You're too far from the car ahead", "The car behind is tailgating you"], 
  ["Increase your speed", "Tap your brakes to signal them to slow down", "Stay calm, maintain your speed, and let them pass if possible"],
]
const feedback = [
  ["Not quite... think about what is unsafe in this image.", "Nope, this wouldn't be good practice because it was right to keep a safe distance.", "Correct! The car behind you is tailgating, this could increase the risk of accidents. Good catch!"],
  ["Nope. Increasing your speed often fails to deter the driver while reducing your own reaction time. This can increase the severity of a potential crash.", "Not quite. Tapping your brakes in this case is often called 'brake checking' and can cause serious rear-end accidents or trigger road rage, and result in you being held liable for damages. We don't want that, do we?", "That's right. Stay calm, maintain your speed and let them pass if possible. Just like that!"]
]
const correctAnswers = [
  3,
  3,
];

// src/pages/ModuleOne.jsx
export default function ModuleOne() {
  return (
    <ModuleTemplate 
      moduleName={"Module One"}
      videoSources={videoSources}
      questions={questions}
      options={options}
      feedback={feedback}
      correctAnswers={correctAnswers}
    />
  )
}