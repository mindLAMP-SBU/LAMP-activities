import { useRef, useState } from 'react';
import {ReactComponent as IconMindlamp} from "../icons/mindlamp.svg";
import {ReactComponent as IconDots} from "../icons/dots.svg";
import QuizQuestion from './QuizQuestion';
import navigate from "../helpers/Navigate"
import QuizResults from './QuizResults';

function Quiz() {
    const [ questionIndex, setQuestionIndex ] = useState(0);
    const correctAnswers = useRef([]); // a list of indices with the correct answer
    const startTime = useRef(null);

    const questions = [
        {
            question: "If you arrive at a four-way stop at the same time as another vehicle, what is the safest next step?",
            choices: ["Proceed quickly to avoid delaying traffic", "Yield and allow the other vehicle to go first", "Wait for the other driver to signal or proceed", "Honk to indicate your turn"],
            correctChoice: 1, // B
            explanation: "At a four-way stop, if two vehicles arrive at the same time, the safest choice is to yield and let the other vehicle go first (especially if there's any uncertainty). This helps prevent confusion and reduces the risk of a collision. Proceeding quickly or honking can startle other drivers and increase danger, and waiting for a signal can lead to hesitation or miscommunication. Yielding is predictable, calm, and keeps everyone safe."
        },
        {
            question: "If a driver is following you too closely, what are appropriate actions you can take?",
            choices: ["Speed up to increase distance", "Maintain a steady speed and allow space ahead", "Change lanes when safe to do so", "Pull over when it is safe and let the vehicle pass"],
            correctChoice: 2,
            explanation: "When someone is following too closely, the main hazard is that they don't have enough time to react if you need to slow down or stop. By safely changing lanes, you remove yourself from that immediate risk zone and allow the aggressive or inattentive driver to pass. This is a defensive driving strategy-it prioritizes avoiding conflict rather than trying to control the other driver's behavior."
        },
        {
            question: "If you miss a turn or exit, what should you do next?",
            choices: ["Stop immediately to recheck directions", "Make a sudden turn to get back on route", "Continue driving and follow an alternate route", "Pull over safely and update navigation"],
            correctChoice: 2,
            explanation: "Missing a turn or exit is common and not dangerous on its own — but reacting impulsively is. Stopping suddenly or making a sharp turn can cause accidents. The safest response is to continue driving calmly and follow an alternate route, or if needed, pull over in a safe location to update your navigation. Never attempt sudden maneuvers to recover a missed turn."
        },
        {
            question: "If traffic becomes overwhelming during a drive, what options do you have to manage the situation safely?",
            choices: ["Take slow, steady breaths and refocus attention", "Pull over in a safe location if needed", "End the drive and resume when you feel ready", "Continue driving without changing anything"],
            correctChoice: 0,
            explanation: "When traffic feels overwhelming, managing your mental state is the first priority. Taking slow, steady breaths helps reduce stress and refocus attention on the road. If that isn't enough, pulling over safely or ending the drive entirely are valid options. Continuing to drive without addressing the overwhelm increases the risk of errors or impaired judgment."
        },
        {
            question: "If you approach a yellow traffic light, what is the safest action?",
            choices: ["Speed up to beat the light", "Stop if it is safe to do so", "Honk to warn other drivers", "Change lanes quickly"],
            correctChoice: 1,
            explanation: "A yellow light signals that the light is about to turn red. The safest action is to stop if you can do so safely. Speeding up to beat the light increases the risk of running a red and causing a collision. Honking or changing lanes are irrelevant responses that don't address the signal. Always prepare to stop when you see yellow unless stopping would itself be unsafe."
        },
        {
            question: "If an emergency vehicle with flashing lights approaches from behind, what should you do?",
            choices: ["Continue driving at the same speed", "Pull over to the right and stop when safe", "Stop immediately in your lane", "Speed up to get out of the way"],
            correctChoice: 1,
            explanation: "When an emergency vehicle approaches with lights and sirens, you are legally and safely required to pull over to the right and stop when it is safe to do so. This clears a path for the emergency vehicle. Stopping abruptly in your lane can cause rear-end collisions, and speeding up puts everyone at risk. Always check mirrors, signal, and move right gradually."
        },
        {
            question: "If road conditions become slippery due to rain or snow, what should you do?",
            choices: ["Drive faster to maintain control", "Increase following distance", "Brake suddenly when needed", "Use cruise control"],
            correctChoice: 1,
            explanation: "Slippery roads significantly reduce traction and stopping ability. Increasing your following distance gives you more time and space to react and stop safely. Driving faster reduces your ability to control the vehicle, sudden braking can cause skidding, and cruise control is dangerous on slippery surfaces because it can prevent you from naturally modulating speed in response to road conditions."
        },
        {
            question: "If another driver cuts you off, what is the safest response?",
            choices: ["Honk and gesture at the driver", "Tailgate them to show frustration", "Stay calm and create space", "Speed past them"],
            correctChoice: 2,
            explanation: "When cut off, the safest response is to stay calm and increase the space between your vehicle and theirs. Aggressive reactions like honking, gesturing, or tailgating can escalate the situation into road rage, which is dangerous for everyone. Speeding past them continues the conflict. Creating distance gives you more reaction time and de-escalates any tension."
        },
        {
            question: "If you begin to feel drowsy while driving, what should you do?",
            choices: ["Open a window and keep driving", "Turn up the radio loudly", "Pull over and rest when safe", "Drive faster to stay alert"],
            correctChoice: 2,
            explanation: "Drowsy driving is extremely dangerous and impairs reaction time similarly to drunk driving. The only truly safe solution is to pull over in a safe location and rest. Opening a window or turning up the radio are temporary distractions that do not restore alertness. Driving faster while drowsy dramatically increases the risk of a serious accident."
        },
        {
            question: "If you encounter a pedestrian waiting at a crosswalk, what should you do?",
            choices: ["Speed up before they cross", "Yield and allow them to cross safely", "Honk to warn them", "Wave them to hurry"],
            correctChoice: 1,
            explanation: "Pedestrians have the right of way at crosswalks. The safest and legally required action is to yield and wait for them to cross completely before proceeding. Speeding up is dangerous and illegal. Honking can startle pedestrians and cause them to stumble or panic. Waving them to hurry puts pressure on them and may cause them to move unsafely."
        },
        {
            question: "If visibility is reduced due to fog, what is the safest action?",
            choices: ["Use high-beam headlights", "Reduce speed and increase following distance", "Follow closely behind another car", "Turn off headlights"],
            correctChoice: 1,
            explanation: "In foggy conditions, reducing speed and increasing following distance are the most important steps to staying safe. High beams actually reflect off fog and reduce visibility further — low beams or fog lights are recommended instead. Following closely behind another car is dangerous because stopping distances are longer in reduced visibility. Turning off headlights makes your vehicle invisible to others."
        },
        {
            question: "If your vehicle begins to skid, what should you do?",
            choices: ["Brake hard immediately", "Turn sharply away from the skid", "Ease off the pedals and steer gently", "Close your eyes and hold the wheel tightly"],
            correctChoice: 2,
            explanation: "When skidding, the correct response is to ease off both the gas and brake pedals and steer gently in the direction you want the car to go. Hard braking locks the wheels and worsens the skid. Sharp steering inputs can cause the vehicle to spin out. Staying calm and making smooth, controlled adjustments gives the tires the best chance to regain traction."
        },
    ]

    /*
        {
            question: "This is a sample question?",
            choices: ["Sample Choice A", "Sample Choice B", "Sample Choice C", "Sample Choice D"],
            correctChoice: 2,
            explanation: "This is a sample explanation. This will explain why it is the correct answer choice."
        },
    */
   
    if (questionIndex == 0)
    {
        startTime.current = new Date().getTime()
    }

    const incrementQuestion = (wasCorrect) => {
        if (wasCorrect)
            correctAnswers.current.push(questionIndex)

        if (questionIndex + 1 <= questions.length) 
            setQuestionIndex(questionIndex+1);
        else
        {
            correctAnswers.current = []
            setQuestionIndex(0)
        }
    }

    const currentQuestion = questions[questionIndex];
    const progress = (100 * (questionIndex)/questions.length) + '%';
    const showResults = questionIndex === questions.length;
    
    return (
        <div id="quiz">
            <div id="resource-header">
                <IconMindlamp onClick={() => navigate("/")} />
                <span>Practice</span>
                <IconDots  />
            </div>
            <div id="progress-bar" style={{width: progress}}></div>
            <div id="quiz-body">
                {
                    !showResults ? 
                    <span>Question {questionIndex+1} out of {questions.length}</span>
                    :
                    <span>Quiz Results</span>
                }
                
                {
                    showResults ? 
                    <QuizResults 
                        correctAnswers={correctAnswers.current}
                        questionCount={questions.length}
                        goBack={incrementQuestion}
                        startTime={startTime.current}
                    />
                    :
                    <QuizQuestion 
                        key={questionIndex}
                        question={currentQuestion.question}
                        choices={currentQuestion.choices}
                        correctChoice={currentQuestion.correctChoice}
                        explanation={currentQuestion.explanation}
                        incrementQuestion={incrementQuestion}
                    />
                }
                
            </div>                    
        </div>
    )
}

export default Quiz