import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
function Bootstrap() {
  const [AccountApp, setAccountApp] = useState(null),
    [error, setError] = useState("");
  const supported = typeof BigInt === "function" && typeof fetch === "function";
  useEffect(() => {
    if (!supported) return;
    let active = true;
    import("./firebase/AuthApp.jsx")
      .then((module) => {
        if (active) setAccountApp(() => module.default);
      })
      .catch(() => {
        if (active)
          setError(
            "Molnlagringen kunde inte startas. Kontrollera Firebase-inställningarna och ladda om sidan. Lokal lagring fungerar fortfarande.",
          );
      });
    return () => {
      active = false;
    };
  }, [supported]);
  if (AccountApp) return <AccountApp />;
  return (
    <App
      authLoading={supported && !error}
      authError={error}
      onSignIn={
        !supported
          ? () => {
              throw Error(
                "Webbläsaren saknar stöd för molnlagring. Använd en nyare webbläsare för att logga in.",
              );
            }
          : undefined
      }
    />
  );
}
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
);
