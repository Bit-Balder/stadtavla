import { authMessage } from "./messages.js";
import { useEffect, useMemo, useState } from "react";
import App from "../App.jsx";
import { createCloudRepository } from "../storage/cloudRepository.js";
import {
  database,
  login,
  logout,
  watchUser,
  verifyAppCheck,
  emailLogin,
  register,
  resetPassword,
  verifyEmail,
  addPassword,
  addGoogle,
} from "./client.js";
export default function AuthApp() {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [checking, setChecking] = useState(true),
    [error, setError] = useState("");
  const repository = useMemo(
    () => (user ? createCloudRepository(database, user.uid) : null),
    [user?.uid],
  );
  useEffect(() => {
    let active = true,
      unsubscribe;
    verifyAppCheck()
      .then(() => {
        if (!active) return;
        unsubscribe = watchUser(
          (next) => {
            if (!active) return;
            setUser(next);
            setReady(true);
            setChecking(false);
            setError("");
          },
          () => {
            if (!active) return;
            setError(
              "Kunde inte återställa inloggningen. Du kan fortsätta utan konto.",
            );
            setChecking(false);
          },
        );
      })
      .catch(() => {
        if (!active) return;
        setError(
          "Kunde inte verifiera appen. Kontrollera anslutningen och ladda om sidan. Lokal lagring fungerar fortfarande.",
        );
        setChecking(false);
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);
  async function perform(action, ...args) {
    try {
      setError("");
      await action(...args);
    } catch (e) {
      const message = authMessage(e);
      setError(message);
      throw Error(message);
    }
  }
  const authActions = ready
    ? {
        email: (email, password) => perform(emailLogin, email, password),
        register: (email, password) => perform(register, email, password),
        reset: (email) => perform(resetPassword, email),
        verify: () => perform(verifyEmail),
        password: (password) => perform(addPassword, password),
        google: () => perform(addGoogle),
      }
    : undefined;
  return (
    <App
      key={user?.uid || "guest"}
      user={user}
      cloudRepository={repository}
      onSignIn={ready ? () => perform(login) : undefined}
      authActions={authActions}
      onSignOut={logout}
      authError={error}
      authLoading={checking}
    />
  );
}
