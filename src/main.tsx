import React from "react";
import ReactDOM from "react-dom/client";
import { injectSpeedInsights } from "@vercel/speed-insights";
import App from "./App";
import "./styles/index.css";

// Inject Vercel Speed Insights for performance monitoring
injectSpeedInsights();

// Mount the React component tree into <div id="root"> from index.html.
// StrictMode adds development-only checks for unsafe component behavior.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
