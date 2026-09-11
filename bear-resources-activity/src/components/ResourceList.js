import ResourceCard from "./ResourceCard"
import {ReactComponent as IconTraffic} from "../icons/traffic.svg";
import {ReactComponent as IconFocus} from "../icons/focus.svg";
import {ReactComponent as IconIntersection} from "../icons/intersections.svg";
import {ReactComponent as IconFollowingDistance} from "../icons/following_distance.svg";
import {ReactComponent as IconParking} from "../icons/parking.svg";
import {ReactComponent as IconPreDriving} from "../icons/pre_driving.svg";

function ResourceList() {
    const resources = [
        {color: "#4378DB", text: "Traffic Signals", icon_path: <IconTraffic />, path: "traffic"},
        {color: "#F0A714", text: "Focus", icon_path: <IconFocus />, path: "focus"},
        {color: "#28A164", text: "Intersections", icon_path: <IconIntersection />, path: "intersections"},
        {color: "#F35555", text: "Following Distance", icon_path: <IconFollowingDistance />, path: "following"},
        {color: "#F38E55", text: "Parking", icon_path: <IconParking />, path: "parking"},
        {color: "#4378DB", text: "Pre-Driving Checklist", icon_path: <IconPreDriving />, path: "checklist"},
        {color: "#8543db", text: "Quiz", icon_path: <IconPreDriving />, path: "quiz"},
    ]

    return <div id="resource-list">
        {
            resources.map(resource => (
                <ResourceCard
                    key={resource.text}
                    text={resource.text}
                    color={resource.color}
                    icon={resource.icon_path}
                    path={resource.path}
                />
            ))
        }
    </div>
}

export default ResourceList