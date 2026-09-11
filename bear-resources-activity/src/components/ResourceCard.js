import navigate from "../helpers/Navigate"

function ResourceCard(props) {
    const { text, icon, color, path } = props

    console.log(text)
    return <div className='resource-card' onClick={() => navigate(`/resource/${path}`)}>
            <div>
                <div className='resource-icon' style={{background: color}}>
                    { icon }
                </div>
                <span style={{color: color}}>{text}</span>
            </div>
            <img alt="" className="right-arrow" src="icons/arrow.svg" />
        </div>
}

export default ResourceCard