
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";

const MODULE_RELOAD_KEY = "delta:module-reload-attempt";
const MODULE_RELOAD_WINDOW_MS = 5 * 60_000;

window.addEventListener("vite:preloadError", (event) => {
  try {
    const previousAttempt = Number(sessionStorage.getItem(MODULE_RELOAD_KEY));
    if (previousAttempt && Date.now() - previousAttempt < MODULE_RELOAD_WINDOW_MS) {
      sessionStorage.removeItem(MODULE_RELOAD_KEY);
      return;
    }

    sessionStorage.setItem(MODULE_RELOAD_KEY, String(Date.now()));
  } catch {
    return;
  }

  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);
