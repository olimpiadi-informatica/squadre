"use client";

import { useState } from "react";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { Button } from "@olinfo/react-components";

import { authClient } from "~/lib/auth-client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleGithubLogin() {
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: window.location.href,
      });
      await new Promise(() => {});
    } catch {
      setError("Errore durante il login. Riprova.");
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
          <Button className="btn-primary w-full gap-2" onClick={handleGithubLogin}>
            <SiGithub className="w-5 h-5" aria-hidden="true" />
            Accedi con GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}
