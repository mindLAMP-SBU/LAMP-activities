
import './App.css';

import Home from './components/HomePage';
import Article from './components/ArticlePage';
import Feedback from './components/FeedbackPage';
import ResourcePage from './components/ResourcePage';
import useLocation from "./helpers/UseLocation"


function App() {
    const path = useLocation().split("/");
    console.log("Path " + path)

    switch (path[1]) {
        case "feedback":
            return <Feedback />
        case "resource":
            return <ResourcePage id={path[2]} /> 
        case "article":
            return <Article id={path[2]} />
        default:
            return <Home />
    }
}

export default App;