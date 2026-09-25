// src/app/AppLayout.jsx
import { Box, Paper } from "@mui/material";
import Navbar from "../components/Navbar";

// Max width of the app column; on wider screens (PC) the app is centered in a phone-shaped column
const MOBILE_MAX_WIDTH = 480;

export default function AppLayout({ children }) {

  return (
    <Box
      display="flex"
      justifyContent="center"
      minHeight="100vh"
      sx={{ bgcolor: { xs: "background.paper", sm: "grey.200" } }}
    >
      <Box
        flex={1}
        display="flex"
        flexDirection="column"
        minHeight="100vh"
        sx={{
          width: "100%",
          maxWidth: MOBILE_MAX_WIDTH,
          bgcolor: "background.paper",
          boxShadow: { xs: "none", sm: 6 },
        }}
      >
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
