// src/components/Navbar.jsx
import { AppBar, Toolbar, Box, IconButton, Typography } from "@mui/material";
import logo from "../assets/logo.png";
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function Navbar() {

  const handleClick = () => {};

  return (
    <AppBar position="static" >
      <Toolbar sx={{ display: "flex", alignItems: "center" }}>

        {/* left */}
        <Box component="img" src={logo} sx={{ width: 28, height: 28, borderRadius: 2, }} />

        {/* center */}
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
          <Typography variant="h6" fontWeight="bold">
            Situational Modules
          </Typography>
        </Box>
        <IconButton
          aria-label="more"
          id="long-button"
          aria-controls={open ? 'long-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
          onClick={handleClick}
        >
          <MoreVertIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}