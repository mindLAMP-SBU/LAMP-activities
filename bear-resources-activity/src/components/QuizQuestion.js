import { useState } from "react";

function QuizQuestion(props) {
    const { question, choices, correctChoice, explanation, incrementQuestion } = props;

    const [ selected, setSelected ] = useState(-1);
    const [ isCorrect, setIsCorrect ] = useState(null);
    const [ showExplanation, setShowExplanation ] = useState(false);

    const handleChange = (e) => {
        setSelected(e.target.value)
    }

    const handleClick = (e) => {
        // Check if answer is correct
        if (isCorrect === null)
        {
            if (selected == correctChoice)
            {
                setIsCorrect(true);
            }
            else
            {
                setIsCorrect(false);
            }
        }
        // Show explanation
        else
        {
            setShowExplanation(true);
        }
        
    }

    const handleNextQuestion = (e) => {
        incrementQuestion(isCorrect)
    }

    let message = ""
    let messageClass = "quiz-message"
    if (isCorrect === true)
    {
        message = "You got it right!"
        messageClass += " correct"
    }
    else if (isCorrect === false) // if null, message shouldn't be visible
    {
        message = "That's wrong :("
        messageClass += " wrong"
    }

    const disabled = isCorrect !== null;
    let buttonText = "Check";
    if (disabled)
        buttonText = "Show Explanation"


    if (!showExplanation)
        return (
            <div className='quiz-question'>
                <span>{question}</span>
                <form className="quiz-choices">
                    {
                    choices.map((choice, index) => {
                        return (
                            <div key={index} className="quiz-choice">
                                <input disabled={disabled} type="radio" id={index} name="question" value={index} onChange={handleChange}></input>
                                <label htmlFor={index}>{choice}</label>
                            </div>
                        )
                    })
                }
                </form>
                <span className={messageClass}>{message}</span>
                <button onClick={handleClick} disabled={selected===-1}>
                    {buttonText}
                </button>
                
                
            </div>
        )
    else
        return (
            <div className='quiz-question'>
                <span>{question}</span>
                <div className="quiz-question-explanation">
                    {explanation}
                </div>
                <button onClick={handleNextQuestion}>
                    Next Question
                </button>
                
            </div>
        )
}

export default QuizQuestion