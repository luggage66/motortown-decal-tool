import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@react-spectrum/s2/page.css";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
