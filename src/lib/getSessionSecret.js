let warnedDevSecret = false;

export function getSessionSecret() {
  const secretEnv = process.env.SESSION_SECRET;

  if (!secretEnv) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY ERROR: SESSION_SECRET environment variable must be set in production!"
      );
    }

    if (!warnedDevSecret) {
      console.warn(
        "WARNING: SESSION_SECRET is not set. Using dev-only fallback secret key for local development."
      );
      warnedDevSecret = true;
    }

    return new TextEncoder().encode(
      "dev-secret-key-that-is-very-long-and-secure-for-local-testing-only"
    );
  }

  return new TextEncoder().encode(secretEnv);
}
