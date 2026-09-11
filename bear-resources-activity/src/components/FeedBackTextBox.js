import { useState } from "react"
import navigate from "../helpers/Navigate"

function FeedBackTextBox(){

    const [submit, setSubmit] = useState(false)
    const [feedbackValue, setFeedback] = useState("")
    const handleChange = (event) => {
        setFeedback(event.target.value)
    }
    const submitFeedback = () => {
        console.log(feedbackValue)
        setSubmit(true)
    }

    if(!submit){
    return <div id="feedback-textbox">


            <div style={{marginBottom:"16px"}} >Message:</div>
            <div style={{  display: "flex", boxSizing:"border-box", height:"70%" }} >
                <textarea  
                value={feedbackValue}
                onChange={handleChange}
                className="feedback-textarea"  ></textarea>

            </div>

            <button onClick={submitFeedback} className="submit-button" >Submit Feedback</button>
        </div>
    } else {
        return <div id="feedback-textbox" >

        <div className="post-feedback-submit">
            <div style={{marginBottom:"16px"}} >Submited</div>
            <div>We Appreciate Your Feedback</div>
            <button onClick={()=>{navigate('/')}} className="submit-button">
                Return Home
            </button>
        </div>

        </div>
    }

  


}

export default FeedBackTextBox