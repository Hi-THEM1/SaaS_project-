// components/auth/LoginForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await loginAction({ username, password });
      if (res.ok) {
        router.push(res.redirectTo);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          id="login-error-banner"
          className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-800 flex items-center justify-between animate-in fade-in duration-150"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-xs font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <div>
        <label
          htmlFor="login-username-input"
          className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          Identifiant / Nom d&apos;utilisateur
        </label>
        <input
          id="login-username-input"
          type="text"
          autoComplete="username"
          required
          value={username}
          disabled={isPending}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ex: ahmed, admin, manager, grh..."
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-100 transition-all duration-150"
        />
      </div>

      <div>
        <label
          htmlFor="login-password-input"
          className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          Mot de passe
        </label>
        <input
          id="login-password-input"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          disabled={isPending}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:bg-slate-100 transition-all duration-150"
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          id="login-submit-btn"
          disabled={isPending || !username.trim() || !password.trim()}
          className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-150 focus:ring-2 focus:ring-slate-900/30"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Connexion en cours...
            </span>
          ) : (
            "Se connecter"
          )}
        </Button>
      </div>
    </form>
  );
}
