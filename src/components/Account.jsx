import { useState } from "react";
import Modal from "./Modal.jsx";
export function ProfileAvatar({ user }) {
  const [failedPhoto, setFailedPhoto] = useState(null);
  const name = user.displayName || user.email || "Användare";
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("sv-SE");
  return (
    <span className="profile-avatar" aria-label={name}>
      {user.photoURL && failedPhoto !== user.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailedPhoto(user.photoURL)}
        />
      ) : (
        <span aria-hidden="true">{initials || "A"}</span>
      )}
    </span>
  );
}
export function AccountPanel({ user, onSignIn, onSignOut }) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  async function perform(action) {
    setPending(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(
        error.message || "Det gick inte att ändra inloggningen. Försök igen.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      {user ? (
        <>
          <div className="account-identity">
            <ProfileAvatar user={user} />
            <div>
              <strong>{user.displayName || "Användare"}</strong>
              {user.email && <p className="smallprint">{user.email}</p>}
            </div>
          </div>
          <button
            className="secondary account-action"
            disabled={pending || !onSignOut}
            onClick={() => perform(onSignOut)}
          >
            {pending ? "Vänta…" : "Logga ut"}
          </button>
          {!onSignOut && (
            <p className="caption">
              Utloggning aktiveras när inloggningen är ansluten.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="caption">Du använder Städtavlan utan konto.</p>
          {onSignIn ? (
            <button
              className="primary account-action"
              disabled={pending}
              onClick={() => perform(onSignIn)}
            >
              {pending ? "Vänta…" : "Logga in med Google"}
            </button>
          ) : (
            <>
              <button className="primary account-action" disabled>
                Logga in med Google
              </button>
              <p className="caption">
                Inloggningen är inte tillgänglig just nu. Dina uppgifter sparas
                på den här enheten.
              </p>
            </>
          )}
        </>
      )}
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
export function AccountDialog({ user, onSignIn, onSignOut, onClose }) {
  return (
    <Modal title="Mitt konto" onClose={onClose}>
      <AccountPanel user={user} onSignIn={onSignIn} onSignOut={onSignOut} />
    </Modal>
  );
}
