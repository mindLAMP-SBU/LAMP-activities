import video3 from "../assets/video3.mp4";
import video4 from "../assets/video4.mp4";
import ModuleTemplate from "./ModuleTemplate";

const videoSources = [
  video3, 
  video4,
];
const questions = [
  "As the driver, what should you do in this situation?", 
  "If you, in the black car, arrive at a four-way stop at the same time as another vehicle, what is the safest next step?",
]
const options = [
  ["Stop the car and wait for a moment.", "Continue driving because only the ball is on the road.", "Change to the other lane and drive around the ball."], 
  ["Proceed quickly to avoid delaying traffic", "Yield and allow the other vehicle to go first", "Wait for the other driver to signal or proceed", "Honk to indicate your turn"],
]
const feedback = [
  [
    "Stopping the vehicle is the safest response because the situation presents a high probability of a child entering the roadway suddenly.Children frequently chase toys or balls without looking for traffic. When a ball rolls into the road from behind parked cars, a child may appear with almost no warning, giving the driver very little reaction time.",
    "Continuing to drive assumes the hazard is limited to the ball itself. However, the ball is actually a warning signal of a hidden pedestrian hazard.",
    "Switching lanes may seem like a quick way to avoid the ball, but it introduces additional dangers and unpredictability",
    "Slowing down is safer than continuing to drive, but it is not the safest response in this specific situation. Because the hazard suggests a child could enter the road immediately, slowing down may still leave the car moving toward the danger."
  ],
  [
    "Proceding quickly increases the risk of a car crash, as if the other driver moves at the same time as your car, then a bone collision becomes likely.",
    "Yielding at a four-way stop is the safest choice: right-of-way disputes are a common cause of intersection collisions, and giving way removes that risk entirely—regardless of what the other driver does. Better to protect yourself than count on someone else to.",
    "Waiting passively for signals creates unnecessary gridlock and confusion. Drivers rarely use hand or horn signals at four-way stops, so sitting indefinitely causes a deadlock rather than resolving the right of way.",
    "Honking to assert your turn is aggressive, confusing, and violates proper horn use. Horns are designed strictly to warn others of danger, not to negotiate turn order or demand the right-of-way."]
]
const correctAnswers = [
  1,
  2,
];

// src/pages/ModuleTwo.jsx
export default function ModuleTwo() {
  return (
    <ModuleTemplate 
      moduleName={"Module Two"}
      videoSources={videoSources}
      questions={questions}
      options={options}
      feedback={feedback}
      correctAnswers={correctAnswers}
    />
  )
}