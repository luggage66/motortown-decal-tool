import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@react-spectrum/s2/page.css";
import "./index.css";
import App from "./App";
import { DecalStoreProvider } from "./store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DecalStoreProvider>
      <App />
    </DecalStoreProvider>
  </StrictMode>,
);
