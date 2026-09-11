import FeedBackTextBox from "./FeedBackTextBox.js"
import navigate from "../helpers/Navigate"

function Feedback() {

    return <div style={{maxHeight:"100%", display:"flex", flexDirection:"column"}}>
    
    <div id="resource-header">
        <img onClick={()=>navigate("/")} alt="" src="icons/left-arrow.svg" style={{height: 42, cursor: 'pointer'}} ></img>
        <span>Feedback</span>
        <img alt="" src="icons/dots.svg" style={{height: 24}}></img>
    </div>

    <div id="page-container" >
        <FeedBackTextBox/>
    </div>
    
    </div>
}

export default Feedback