import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./modeColors.css";
import "./index.css";
import "../ficha-modernrpg/styles.css";
// Camada final do redesign da Mesa Online: precisa vir depois das folhas
// herdadas para vencer por ordem de cascata, sem recorrer a !important.
import "./mesa-theme.css";
// Fonte visual literal fornecida para a mesa que abre após “Criar mesa online”.
import "./components/mesaSkin/appearance.css";
import "./components/mesaSkin/actionDialog.css";
import "./mesaSkinDrawerHost.css";
import "./combatDialogExtras.css";
import "./mesaDrawerExtras.css";
import "./expandedMode.css";
import App from "./App";

const viteMode = (import.meta as ImportMeta & { env?: { MODE?: string } }).env?.MODE;
if (viteMode === "e2e") void import("./testing/e2eBridge").then(({ installE2EBridge }) => installE2EBridge());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
