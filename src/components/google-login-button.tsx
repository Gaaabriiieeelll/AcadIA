"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type GoogleLoginButtonProps = {
  configured: boolean;
};

export function GoogleLoginButton({ configured }: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!configured || loading) return;
    setLoading(true);

    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      className="google-button"
      type="button"
      onClick={handleSignIn}
      disabled={!configured || loading}
      aria-busy={loading}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.4l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.39 13.91A6 6 0 0 1 6.07 12c0-.66.11-1.3.32-1.91v-2.6H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.51l3.35-2.6Z" />
        <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.49l3.35 2.6C7.18 7.72 9.39 5.96 12 5.96Z" />
      </svg>
      <span>
        {loading
          ? "Abrindo o Google..."
          : configured
            ? "Continuar com Google"
            : "Configure o Google OAuth"}
      </span>
      <svg className="button-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M5 12h14M14 7l5 5-5 5" />
      </svg>
    </button>
  );
}
