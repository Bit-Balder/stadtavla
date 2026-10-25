import { initializeApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  getToken,
} from "firebase/app-check";
import { appCheckSiteKey, configureAppCheck } from "./appCheck.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
export const firebaseConfig = {
  apiKey: "AIzaSyDw1bCf82xB5438BRxvqvGPTazdw9djPuE",
  authDomain: "stadtavla.firebaseapp.com",
  projectId: "stadtavla",
  storageBucket: "stadtavla.firebasestorage.app",
  messagingSenderId: "318653264481",
  appId: "1:318653264481:web:ef0ffff8999b4ddb683020",
};
const app = initializeApp(firebaseConfig);
// Initialize before Auth or Firestore can make any requests.
const appCheck = configureAppCheck(app, appCheckSiteKey, {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
});
export function verifyAppCheck() {
  return getToken(appCheck, false);
}
export const auth = getAuth(app);
export const database = getFirestore(app);
export function watchUser(next, error) {
  return onAuthStateChanged(auth, next, error);
}
export function login() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  // A popup avoids third-party redirect storage restrictions on GitHub Pages/Safari.
  return signInWithPopup(auth, provider);
}
export function logout() {
  return signOut(auth);
}
