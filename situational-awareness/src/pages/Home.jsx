import { List, ListItem, ListItemAvatar, ListItemText, Avatar, IconButton, Box } from "@mui/material"
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const modules = ["Module One", "Module Two", "Module Three", "Module Four", "Module Five"];

export default function Home() {

    const handleClickBack = () => {
        parent.postMessage(
            JSON.stringify({
                timestamp: Date.now(),
                static_data: {
                    test: "hi",
                    EndTime: new Date(),
                },
                clickBack: true,
            }),
            "*"
        );
    };

    return (
        <Box>
            <IconButton onClick={handleClickBack}>
                <ArrowBackIcon />
            </IconButton>
            <Box>
                <List>
                    {modules.map((module) => (
                        <ModuleListItem key={module} title={module} link={`/${module.toLowerCase().replace(/\s/g, "-")}`} />
                    ))}
                </List>
            </Box>
        </Box>
    )
}

function ModuleListItem({ title, link }) {
    return (
        <ListItem
            secondaryAction={
                <IconButton onClick={() => (window.location.hash = link)} edge="end" aria-label="delete">
                    <NavigateNextIcon />
                </IconButton>
            }
        >
            <ListItemText
                primary={title}
                slotProps={{
                    primary: {
                        fontWeight: "bold",
                    }
                }}
            />
        </ListItem>
    )
}