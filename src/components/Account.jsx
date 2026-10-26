import { useState } from "react";
import Modal from "./Modal.jsx";
import CloudStatus from "./CloudStatus.jsx";
export function ProfileAvatar({ user }) {
  const [failed, setFailed] = useState(null);
  return (
    <span
      className="profile-avatar"
      aria-label={user.displayName || user.email || "Användare"}
    >
      {user.photoURL && failed !== user.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailed(user.photoURL)}
        />
      ) : (
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
        </svg>
      )}
    </span>
  );
}
export function AccountPanel({
  user,
  onSignIn,
  onSignOut,
  authActions,
  onOpenLogin,
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [password, setPassword] = useState("");
  async function run(action, success = "") {
    setPending(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
      setPassword("");
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  const providers = user?.providerData?.map((x) => x.providerId) || [];
  return (
    <>
      {user ? (
        <>
          <div className="account-identity">
            <ProfileAvatar user={user} />
            <div>
              <strong>{user.displayName || "Mitt konto"}</strong>
              <p className="smallprint">{user.email}</p>
            </div>
          </div>
          {authActions && (
            <>
              {user.emailVerified === false && (
                <div className="verification">
                  <p className="caption">
                    Bekräfta din e-postadress via mejlet från Firebase.
                  </p>
                  <button
                    className="secondary"
                    disabled={pending}
                    onClick={() =>
                      run(
                        authActions.verify,
                        "Ett bekräftelsemejl har skickats.",
                      )
                    }
                  >
                    Skicka bekräftelsemejl igen
                  </button>
                </div>
              )}
              {!providers.includes("password") &&
                providers.includes("google.com") && (
                  <details className="account-link">
                    <summary>Lägg till lösenordsinloggning</summary>
                    <p className="caption">
                      Behåll samma konto och uppgifter. Bekräfta först ditt
                      Google-konto.
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        run(
                          () => authActions.password(password),
                          "Lösenordsinloggningen är kopplad till samma konto.",
                        );
                      }}
                    >
                      <label>
                        Nytt lösenord
                        <input
                          className="textinput"
                          type="password"
                          required
                          minLength={6}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </label>
                      <button className="secondary" disabled={pending}>
                        Lägg till lösenord
                      </button>
                    </form>
                  </details>
                )}
              {!providers.includes("google.com") && (
                <button
                  className="secondary"
                  disabled={pending}
                  onClick={() =>
                    run(
                      authActions.google,
                      "Google är kopplat till samma konto.",
                    )
                  }
                >
                  Koppla Google till kontot
                </button>
              )}
            </>
          )}
          <button
            className="secondary account-action"
            disabled={pending || !onSignOut}
            onClick={() => run(onSignOut)}
          >
            Logga ut
          </button>
        </>
      ) : (
        <>
          <p className="caption">Du använder Städtavlan utan konto.</p>
          <button
            className="primary account-action"
            disabled={!onOpenLogin && !onSignIn}
            onClick={onOpenLogin || (() => run(onSignIn))}
          >
            Logga in
          </button>
          {!onSignIn && (
            <p className="caption">
              Inloggningen är inte tillgänglig just nu. Dina uppgifter sparas på
              den här enheten.
            </p>
          )}
        </>
      )}
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </>
  );
}
export function AccountDialog({
  user,
  onSignIn,
  onSignOut,
  onClose,
  authActions,
}) {
  const [view, setView] = useState("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const changeView = (v) => {
    setView(v);
    setPassword("");
    setConfirmation("");
    setError("");
    setMessage("");
  };
  async function run(action, success) {
    setPending(true);
    setError("");
    setMessage("");
    try {
      await action();
      setPassword("");
      setConfirmation("");
      if (success) setMessage(success);
      else onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  function submit(e) {
    e.preventDefault();
    if (!authActions) return;
    if (view === "register" && password !== confirmation) {
      setError("Lösenorden matchar inte.");
      return;
    }
    if (view === "reset")
      run(
        () => authActions.reset(email),
        "Om adressen har ett konto får du ett mejl med instruktioner.",
      );
    else
      run(() =>
        authActions[view === "register" ? "register" : "email"](
          email,
          password,
        ),
      );
  }
  return (
    <Modal
      title={
        user
          ? "Mitt konto"
          : view === "register"
            ? "Skapa konto"
            : view === "reset"
              ? "Återställ lösenord"
              : "Logga in"
      }
      onClose={pending ? () => {} : onClose}
    >
      {user ? (
        <AccountPanel
          user={user}
          onSignOut={onSignOut}
          authActions={authActions}
        />
      ) : (
        <div className="auth-form">
          <form onSubmit={submit}>
            <fieldset disabled={pending || !authActions}>
              <label>
                E-postadress
                <input
                  className="textinput"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              {view !== "reset" && (
                <label>
                  Lösenord
                  <input
                    className="textinput"
                    type="password"
                    required
                    minLength={view === "register" ? 6 : undefined}
                    autoComplete={
                      view === "register" ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              )}
              {view === "register" && (
                <label>
                  Bekräfta lösenord
                  <input
                    className="textinput"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                  />
                </label>
              )}
              <button className="primary account-action">
                {pending
                  ? "Vänta…"
                  : view === "register"
                    ? "Skapa konto"
                    : view === "reset"
                      ? "Skicka återställningsmejl"
                      : "Logga in"}
              </button>
            </fieldset>
          </form>
          {view === "login" ? (
            <>
              <button
                className="auth-link"
                disabled={pending}
                onClick={() => changeView("reset")}
              >
                Glömt lösenord?
              </button>
              <div className="auth-divider">eller</div>
              <button
                className="secondary google-login"
                disabled={pending || !onSignIn}
                onClick={() => run(onSignIn)}
              >
                Logga in med Google
              </button>
              <p className="auth-footer">
                Har du inget konto?{" "}
                <button
                  className="auth-link"
                  disabled={pending}
                  onClick={() => changeView("register")}
                >
                  Registrera dig
                </button>
              </p>
            </>
          ) : (
            <button
              className="auth-link"
              disabled={pending}
              onClick={() => changeView("login")}
            >
              Tillbaka till Logga in
            </button>
          )}
          {!onSignIn && (
            <p className="caption">
              Inloggningen är inte tillgänglig just nu. Se kontodelen i
              Inställningar.
            </p>
          )}
          {error && (
            <p className="notice" role="alert">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
        </div>
      )}
    </Modal>
  );
}
export function ProfileMenu({ user, onSignIn, onSignOut, onAccount, state }) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  if (!user)
    return (
      <button className="secondary header-login" onClick={onSignIn}>
        Logga in
      </button>
    );
  return (
    <div
      className="menuwrap profile-menu"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        className="brand-profile"
        aria-label="Öppna profilmenyn"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <ProfileAvatar user={user} />
      </button>
      {open && (
        <div className="dropdown profile-dropdown">
          <strong>{user.displayName || "Mitt konto"}</strong>
          <p className="smallprint">{user.email}</p>
          {!state.needsSetup && <CloudStatus state={state} />}
          <button
            onClick={() => {
              setOpen(false);
              onAccount();
            }}
          >
            Mitt konto
          </button>
          <button
            onClick={async () => {
              try {
                await onSignOut();
              } catch {
                setError("Kunde inte logga ut. Försök igen.");
              }
            }}
          >
            Logga ut
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
