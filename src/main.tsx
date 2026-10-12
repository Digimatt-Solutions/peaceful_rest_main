import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { HelmetProvider } from "react-helmet-async";

const root = document.getElementById("root");
if (root) createRoot(root).render(<HelmetProvider><App /></HelmetProvider>);
