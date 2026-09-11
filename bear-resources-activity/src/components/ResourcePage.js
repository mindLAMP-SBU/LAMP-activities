
import ReactMarkdown from 'react-markdown';
import resources from './resources';
import Quiz from './QuizPage';
import navigate from "../helpers/Navigate"

import {ReactComponent as LeftArrow} from "../icons/left-arrow.svg";
import {ReactComponent as Dots} from "../icons/dots.svg";

function ResourcePage(props) {
    const { id } = props;
    const resource = resources[id];

    if (id === "quiz")
    {
        return <Quiz />
    }

    return <>
        <div id="resource-header">
            <LeftArrow className='clickable' height={42} width={42} onClick={() => navigate('/')}/>
            <span>{resource.display}</span>
            <Dots height={24} width={24}/>
        </div>
        <div id="resource-list">
            <h1 className="resource-text" style={{color: resource.color, fontSize: 16}}>{resource.title}</h1>
            <div className="resource-text resource-text-box">
                <ReactMarkdown
                  components={{
                    strong: ({node, ...props}) => <strong {...props} />,
                    em: ({node, ...props}) => <span style={{ textDecoration: 'underline' }} {...props} />,
                    ul: ({node, ...props}) => <ul style={{paddingLeft: 24, listStyleType: 'disc'}} {...props} />,
                    li: ({node, ...props}) => <li style={{marginBottom: 4}} {...props} />,
                  }}
                >
                  {resource.description}
                </ReactMarkdown>
            </div>
            <a id="learn-more-box" href={resource.learnMore} target="_blank" rel="noopener noreferrer">
                <span style={{textDecoration: 'none'}}>Learn More Here</span>
                <img alt="" className="right-arrow" src="icons/arrow.svg" />
            </a>
        </div>
    </>;
}

export default ResourcePage;