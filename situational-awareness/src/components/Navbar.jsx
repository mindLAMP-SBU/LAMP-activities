// src/components/Navbar.jsx
import { AppBar, Toolbar, Box, Typography } from "@mui/material";
import logo from "../assets/logo.png";

export default function Navbar() {

  return (
    <AppBar position="static" >
      <Toolbar sx={{ display: "flex", alignItems: "center", height: 70 }}>

        {/* left */}
        <Box component="img" src={logo} sx={{ width: 28, height: 28, borderRadius: 2, }} />

        {/* center */}
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
          <Typography variant="h6" fontWeight="bold">
            Situational Modules
          </Typography>
        </Box>

        {/* right (used for centering) */}
        <Box sx={{ width: 28, height: 28 }} />
      </Toolbar>
    </AppBar>
  );
}