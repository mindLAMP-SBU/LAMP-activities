import { useEffect, useRef } from "react";
import {ReactComponent as IconConfetti} from "../icons/confetti.svg";

function QuizResults(props) {
    const {correctAnswers, questionCount, goBack, startTime} = props
    const sentMessage = useRef(false)

    const sendResults = () => {
        console.log((new Date().getTime() - startTime)/1000)
        window.parent.postMessage(
            JSON.stringify({
                timestamp: new Date().getTime(),
                duration: new Date().getTime() - startTime,
                static_data: {
                    correct_answers: correctAnswers,
                    correct_answer_count: correctAnswers.length,
                    total_questions: questionCount
                },
                temporal_slices: [],        
                clickBack: false,
            }),
            "*"
        );
    }

    const returnToApp = () => {
        window.parent.postMessage(
            JSON.stringify({
                timestamp: new Date().getTime(),
                duration: new Date().getTime() - startTime,
                static_data: {
                    correct_answers: correctAnswers,
                    correct_answer_count: correctAnswers.length,
                    total_questions: questionCount
                },
                temporal_slices: [],        
                clickBack: true,
            }),
            "*"
        );

        goBack();
    }

    useEffect(() => {
        if (!sentMessage.current)
        {
            sendResults()
            sentMessage.current = true
        }
    }, [])

    const percent = correctAnswers.length / questionCount * 100;

    return (
            <div className='quiz-question'>
                <span>You Finished!</span>
                <div>
                    {
                        `You got ${correctAnswers.length} out of ${questionCount} questions correct.`
                    }
                </div>
                <IconConfetti width={175} height={200}/>
                <div>
                        Thats a 
                    <b>
                        {` ${percent.toFixed(2)}%`}
                    </b>
                </div>
                <button onClick={returnToApp}>
                    Go Back
                </button>
            </div>
        )
}

export default QuizResults;