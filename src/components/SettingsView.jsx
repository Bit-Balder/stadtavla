import CloudStatus from "./CloudStatus.jsx";
import { useRef } from "react";
import { AccountPanel } from "./Account.jsx";
import { fmt, normalize, today } from "../domain/schedule.js";
export default function SettingsView({
  board,
  commit,
  replace,
  notify,
  wake,
  mode,
  readOnly,
  user,
  onSignIn,
  onSignOut,
  authError,
  authLoading,
  authActions,
  cloudState,
  onOpenLogin,
}) {
  const input = useRef(null);
  function download() {
    const blob = new Blob([JSON.stringify(board, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `stadtavlan-sakerhetskopia-${fmt(today())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function restore(file) {
    if (!file) return;
    try {
      const data = normalize(JSON.parse(await file.text()));
      if (
        confirm(
          "Ersätta alla befintliga uppgifter, inköp och historik med säkerhetskopian?",
        )
      ) {
        replace(data);
        notify("Säkerhetskopian återställd.");
      }
    } catch {
      alert("Filen innehåller ingen giltig säkerhetskopia.");
    }
  }
  return (
    <>
      <section className="panel">
        <h3>Utseende</h3>
        <p className="caption">
          Automatiskt följer paddans inställning för ljust och mörkt läge.
        </p>
        <div className="settings-options">
          {[
            ["light", "Ljust"],
            ["auto", "Automatiskt"],
            ["dark", "Mörkt"],
          ].map(([key, label]) => (
            <button
              disabled={readOnly}
              className="themechoice"
              key={key}
              aria-pressed={board.theme === key}
              onClick={() =>
                commit((s) => {
                  s.theme = key;
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <h3>Skärm och navigation</h3>
        <div className="switchrow">
          <div>
            <strong>Håll skärmen tänd</strong>
            <p className="smallprint">
              Funktionen beror på iPadens webbläsare.
            </p>
          </div>
          <button className="secondary" onClick={wake.toggle}>
            {wake.awake ? "På" : "Av"}
          </button>
        </div>
        <div className="switchrow navigation-setting">
          <div>
            <strong>Dölj navigation</strong>
            <p className="smallprint">Visa mer plats för uppgifterna.</p>
          </div>
          <button
            disabled={readOnly}
            className="secondary"
            onClick={() =>
              commit((s) => {
                s.settings.collapsed = !s.settings.collapsed;
              })
            }
          >
            {board.settings.collapsed ? "Visa" : "Dölj"}
          </button>
        </div>
      </section>
      <section className="panel">
        <h3>Säkerhetskopia</h3>
        <p className="caption">
          Exportera alla uppgifter, inköp, scheman och avklarade uppgifter till
          en JSON-fil.
        </p>
        <div className="inlinecontrols">
          <button className="primary" onClick={download}>
            Exportera fil
          </button>
          <button
            disabled={readOnly}
            className="secondary"
            onClick={() => input.current.click()}
          >
            Importera fil
          </button>
        </div>
        <input
          ref={input}
          type="file"
          className="backupfile"
          disabled={readOnly}
          accept="application/json,.json"
          onChange={(e) => {
            restore(e.target.files[0]);
            e.target.value = "";
          }}
        />
        <p className="smallprint">
          En import ersätter alla befintliga uppgifter efter bekräftelse.
        </p>
      </section>
      <section className="panel account-settings">
        <h3>Mitt konto</h3>
        {authLoading && <p role="status">Kontrollerar inloggning…</p>}
        {authError && (
          <p className="notice" role="alert">
            {authError}
          </p>
        )}
        <AccountPanel
          user={user}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          authActions={authActions}
          onOpenLogin={onOpenLogin}
        />
        {cloudState && !cloudState.needsSetup && (
          <CloudStatus state={cloudState} />
        )}
      </section>
      <section className="panel">
        <h3>Om tavlan</h3>
        <p className="caption">
          {mode === "cloud"
            ? "Städtavlan 3.1 · Uppgifterna sparas i ditt kontos molnlagring."
            : "Städtavlan 3.1 · Data sparas på den här enheten."}
        </p>
      </section>
    </>
  );
}
