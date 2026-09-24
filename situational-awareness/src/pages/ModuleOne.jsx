import { Box, Button, IconButton, Paper, Typography} from "@mui/material"
import { useState } from "react";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import video1 from "../assets/video1.mp4";
import video2 from "../assets/video2.mp4";
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

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
  const [questionNumber, setQuestionNumber] = useState(0);
  const [finished, setFinished] = useState(false);

  const incrementQuestion = () => {
    setQuestionNumber((prev) => {
      if (prev < questions.length - 1) {
        return prev + 1;
      } else {
        setFinished(true);
        return prev;
      }
    })
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" >
        <Box display={"flex"} width="100%" alignItems={"center"}  pb={2}>
          <IconButton onClick={() => (window.location.hash = "/")} >
            <NavigateBeforeIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center"}} >
            {!finished && <Typography 
              color={"primary"} 
              fontWeight={"bold"} 
              align="center" 
              sx={{ textDecoration: 'underline' }} 
             
              fontSize={"h5.fontSize"}
            >
                Watch this video
            </Typography>}
          </Box>
        </Box>
        {!finished && <Box
          component="video"
          src={videoSources[questionNumber]}
          controls
          sx={{
            display: "block",
            mx: "auto",    
            maxWidth: 800,
            width: "100%",
            borderRadius: 2,
            pb: 2,
          }}
        />}
        <Box 
          sx={{
            display: "block", 
            width: "100%",
            maxWidth: 800,
          }}
        >
          <Paper
            sx={{
              background: "#fceaeb",
              p: 3,
            }}
          >
            <Box display="flex" justifyContent="flex-end" alignItems={"center"}>
              <Typography pr={2} sx={{ textDecoration: 'underline' }} >
                Click to listen
              </Typography>
              <IconButton 
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <VolumeUpIcon />
              </IconButton>
            </Box>
            {!finished && <MultipleChoiceQuestion question={questions[questionNumber]} options={options[questionNumber]} feedback={feedback[questionNumber]}
             correctAnswer={correctAnswers[questionNumber]} questionNumber={questionNumber} incrementQuestion={incrementQuestion}/>}
            {finished && (
              <Typography fontWeight={"bold"} fontSize={"h6.fontSize"} align="center">
                Great job! You've completed Module One.
              </Typography>
            )}
          </Paper>
        </Box>
    </Box>
  )
}

function MultipleChoiceQuestion({ question, options, feedback, correctAnswer, questionNumber, incrementQuestion }) {
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleOptionClick = (option) => {
    setSelected(option);
  }

  const handleCheck = () => {
    // logic to check the answer
    setShowFeedback(true);
  }

  const handleHint = () => {
    // logic to show hint
  }

  console.log(options.indexOf(selected) + 1, correctAnswer, "selected vs correct")
  const isCorrect = correctAnswer == options.indexOf(selected) + 1;

  return (
    <Box>
      <Typography fontWeight={"bold"}>
        {question}
      </Typography>
      <Box display="flex" flexDirection="column" mt={2} gap={2}>
        {!showFeedback && options.map((option) => (
          <Paper
            key={option}
            onClick={() => handleOptionClick(option)}
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: selected === option ? "primary.main" : "divider",
              backgroundColor: selected === option ? "action.selected" : "inherit",
              cursor: "pointer",
              transition: "0.2s",
            
              '&:hover': {
                backgroundColor: "action.hover",
              }
            }}
          >
            {option}
          </Paper>
        ))}
        {showFeedback && (
          <Typography color={isCorrect ? "success.main" : "error.main"}>
            {feedback[options.indexOf(selected)]}
          </Typography>
        )}
       <Box display="flex" gap={2} justifyContent={"center"}>
          {!showFeedback && (
              <>
                <Button variant="contained" onClick={handleCheck}>
                  Check
                </Button>
                <Button variant="contained" onClick={handleHint}>
                  Hint
                </Button>
              </>
            )
          }
          {showFeedback && !isCorrect && (
            <Button variant="contained" onClick={() => {
              setSelected(null);
              setShowFeedback(false);
            }}>
              Try Again
            </Button>
          )}
          {showFeedback && isCorrect && (
            <Button variant="contained" onClick={() => {
              setSelected(null);
              setShowFeedback(false);
              incrementQuestion();
            }}>
              Next
            </Button>
          )}
       </Box>
      </Box>
    </Box>
  )
}