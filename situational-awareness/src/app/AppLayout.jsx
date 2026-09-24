// src/app/AppLayout.jsx
import { Box, Paper } from "@mui/material";
import Navbar from "../components/Navbar";
import { useState } from "react";

export default function AppLayout({ children }) {

  return (
    <Box display="flex" height="100vh">
      <Box flex={1} display="flex" flexDirection="column">
        <Navbar />
        <Box display="flex" component="main" flex={1} overflow="visible" flexDirection="column">
          <Paper
            elevation={4}
            sx={{
              mt: -1,
              p: 2,
              borderRadius: 3,
              position: "relative",
              zIndex: 1200,
              flex: 1,
              display: "flex",
              flexDirection: "column",

            }}
          >
            {children}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}