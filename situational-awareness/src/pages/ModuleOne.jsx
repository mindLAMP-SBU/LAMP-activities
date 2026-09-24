import { Box, Button, IconButton, Paper, Typography} from "@mui/material"
import { useState } from "react";
import video1 from "../assets/video1.mp4";
import video2 from "../assets/video2.mp4";
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import MultipleChoiceQuestion from "../components/MultipleChoiceQuestion";
import CelebrationIcon from '@mui/icons-material/Celebration';

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

  const goHome = () => {
    window.location.hash = "/"
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" >
        <Box display={"flex"} width="100%" alignItems={"center"}  pb={2}>
          <IconButton onClick={goHome} >
            <NavigateBeforeIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center"}} >
            {!finished && <Typography 
              color={"primary"} 
              fontWeight={"bold"} 
              align="center" 
              sx={{ color: 'black' }} 
             
              fontSize={"h5.fontSize"}
            >
                Watch this video
            </Typography>}
          </Box>

          <Box  sx={{ width: 40, height: 40, borderRadius: 2, }} />
        </Box>
        {!finished && <Box
          component="video"
          autoPlay={true}
          src={videoSources[questionNumber]}
          controls
          sx={{
            display: "block",
            mx: "auto",    
            maxWidth: 800,
            width: "100%",
            borderRadius: 3,
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
          <Box
            sx={{
              background: "white",
              p: 3,
            }}
          >
            {!finished &&
              <MultipleChoiceQuestion 
                question={questions[questionNumber]} 
                options={options[questionNumber]} 
                feedback={feedback[questionNumber]}
                correctAnswer={correctAnswers[questionNumber]} 
                questionNumber={questionNumber} 
                incrementQuestion={incrementQuestion}
              />
            }
            
            {finished && (
              <Box display="flex" flexDirection={"column"} gap={6} alignItems={"center"}>
                 <Typography fontWeight={"bold"} fontSize={"h5.fontSize"} align="center">
                  Great job! You've completed Module One.
                </Typography>
                <CelebrationIcon
                  sx={{
                    width: "100px",
                    height: "100px"
                  }}
                />
                <Button variant="contained" onClick={goHome}>
                  Go Back
                </Button>
              </Box>
            )}
          </Box>
        </Box>
    </Box>
  )
}