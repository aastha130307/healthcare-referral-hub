
import React from "react";
import ReactDOM from "react-dom/client";
import { MsalProvider } from "@azure/msal-react";

import App from "./App.jsx";
import { msalInstance } from "./authConfig";
import "./index.css";

async function start() {
  try {
    await msalInstance.initialize();

    ReactDOM.createRoot(
      document.getElementById("root")
    ).render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error("MSAL initialization failed:", error);
  }
}

start();
