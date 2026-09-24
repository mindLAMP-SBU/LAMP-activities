// src/app/App.jsx
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "../theme/theme";
import AppLayout from "./AppLayout";
import AppRoutes from "../routes/AppRoutes";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    </ThemeProvider>
  );
}