import { useState } from "react";
import { Box, Button, IconButton, Paper, Typography} from "@mui/material"
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

export default function MultipleChoiceQuestion({ question, options, feedback, correctAnswer, questionNumber, incrementQuestion }) {
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
        <Box display="flex" justifyContent="space-between" alignItems={"center"}>
            <Typography fontWeight={"bold"}>
                {question}
            </Typography>
            <IconButton 
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <VolumeUpIcon 
                    sx={{
                        height: '0.75em',
                        width: '0.75em'
                    }}
                />
              </IconButton>
        </Box>
    
              
      <Box display="flex" flexDirection="column" mt={2} gap={2}>
        {!showFeedback && options.map((option) => (
          <Paper
            key={option}
            onClick={() => handleOptionClick(option)}
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: selected === option ? "black" : "divider",
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
          <Paper
            sx={{
                p: 3,
                background: "#FAFAFA"
            }}
          >
            
            <Typography color={isCorrect ? "success.main" : "error.main"}>
              {feedback[options.indexOf(selected)]}
            </Typography>
          </Paper>
        )}
       <Box display="flex" marginTop={5} gap={2} justifyContent={"center"}>
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