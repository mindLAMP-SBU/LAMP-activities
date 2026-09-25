import { createContext, useState } from "react";

export const ScoreContext = createContext({
    correctAnswers: 0,
    incorectAnswer: 0,
    totalNumberOfAnswer: 0,
})

export function ScoreProvider({ children }) {
    const [score, setScore] = useState({
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalNumberOfAnswers: 0,
    })

    return (
        <ScoreContext.Provider value={{ score, setScore}}>
            {children}
        </ScoreContext.Provider>
    )
}