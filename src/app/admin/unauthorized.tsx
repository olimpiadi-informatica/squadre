"use client";

import { useState } from "react";

import { authClient } from "~/lib/auth-client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGithubLogin() {
    setLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: window.location.href,
      });
    } catch {
      setError("Errore durante il login. Riprova.");
      setLoading(false);
    }
  }

  return (
    <div className="flex grow items-center justify-center">
      <div className="card bg-base-100 shadow-xl w-full max-w-sm">
        <div className="card-body items-center text-center gap-6">
          <h1 className="card-title text-2xl">OIS Admin</h1>
          <p className="text-base-content/60 text-sm">
            Accedi con il tuo account GitHub autorizzato
          </p>
          {error && (
            <div className="alert alert-error w-full text-sm">
              <span>{error}</span>
            </div>
          )}
          <button
            type="button"
            className="btn btn-primary w-full gap-2"
            onClick={handleGithubLogin}
            disabled={loading}>
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
                />
              </svg>
            )}
            {loading ? "Reindirizzamento..." : "Accedi con GitHub"}
          </button>
        </div>
      </div>
    </div>
  );
}
