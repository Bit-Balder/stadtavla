// This is the public, score-based reCAPTCHA Enterprise website key.
// Populate it after registering bit-balder.github.io in the stadtavla project.
export const appCheckSiteKey = "";

// Missing configuration must never start unprotected Firebase services.
export function configureAppCheck(
  app,
  siteKey,
  { initializeAppCheck, ReCaptchaEnterpriseProvider },
) {
  if (typeof siteKey !== "string" || !siteKey.trim()) {
    throw Error(
      "App Check saknar webbplatsnyckel. Molnlagringen är inte aktiverad.",
    );
  }
  return initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey.trim()),
    isTokenAutoRefreshEnabled: true,
  });
}
