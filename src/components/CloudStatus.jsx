export default function CloudStatus({ state }) {
  if (state.mode !== "cloud") return null;
  if (state.needsSetup)
    return (
      <section className="panel cloud-setup">
        <h3>Första gången med det här kontot</h3>
        {state.error && (
          <p className="notice" role="alert">
            {state.error}
          </p>
        )}
        <p className="caption">
          Vill du föra över uppgifterna från den här enheten till molnlagringen?
        </p>
        <p className="caption">
          Den lokala kopian finns kvar. Andra enheter hämtar sedan kontots
          uppgifter.
        </p>
        <div className="inlinecontrols">
          <button className="primary" onClick={() => state.initialize(true)}>
            Använd mina lokala uppgifter
          </button>
          <button className="secondary" onClick={() => state.initialize(false)}>
            Börja med nya uppgifter
          </button>
        </div>
      </section>
    );
  return (
    <div className="cloud-status" role="status">
      <span>{state.status}</span>
      {state.error && <p className="notice">{state.error}</p>}
      {state.blocked && !state.pending && (
        <div className="inlinecontrols">
          <button className="secondary" onClick={state.retry}>
            Försök igen
          </button>
          <button
            className="secondary"
            onClick={() => {
              if (
                !state.dirty ||
                confirm(
                  "Hämta molnversionen? Osparade ändringar ersätts. Exportera dem först om du vill behålla dem.",
                )
              )
                state.reload();
            }}
          >
            Hämta molnversionen
          </button>
        </div>
      )}
    </div>
  );
}
