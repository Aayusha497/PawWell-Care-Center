
  import { createRoot } from "react-dom/client";
  import { AuthProvider } from './context/AuthContext.tsx';
  import { ThemeProvider } from './context/ThemeContext.tsx';
  import App from "./app/App.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  );
  