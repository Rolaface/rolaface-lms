import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";

import "./index.css";
import App from "./App";
import { mantineTheme } from "./mantine.theme";

const params = new URLSearchParams(window.location.search);
const sidFromUrl = params.get("sid");

if (sidFromUrl) {
  localStorage.setItem("session_id", sidFromUrl);   
  window.history.replaceState({}, "", window.location.pathname);
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={mantineTheme}>
      <App />
    </MantineProvider>
  </StrictMode>
);