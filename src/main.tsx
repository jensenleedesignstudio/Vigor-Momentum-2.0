import React from "react";
import ReactDOM from "react-dom/client";
import Home from "../app/page";
import "../app/globals.css";

// Mount the React component tree into <div id="root"> from index.html.
// StrictMode adds development-only checks for unsafe component behavior.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
);
