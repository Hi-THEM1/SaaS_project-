// components/codes/CreateCodeForm.tsx
"use client";

import { useState, useTransition } from "react";
import { createWorkingPlaceCodeAction } from "@/actions/working-place-codes";
import { Button } from "@/components/ui/Button";

export function CreateCodeForm() {
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const res = await createWorkingPlaceCodeAction({ code });
      if (res.ok) {
        setCode("");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-900">
          Créer un Nouveau Code de Poste (Create Working-Place Code)
        </h2>
        <p className="text-xs text-slate-500">
          Les codes créés sont immédiatement disponibles dans le menu de sélection du planning (§18).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <input
            id="create-code-input"
            type="text"
            value={code}
            disabled={isPending}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ex: RR, FR, CAR, RES PARK..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
          />
        </div>

        <Button
          type="submit"
          id="create-code-submit-btn"
          size="default"
          disabled={isPending || !code.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isPending ? "Création..." : "+ Créer le Code"}
        </Button>

        {success && (
          <span className="text-xs font-semibold text-emerald-600 animate-in fade-in duration-150">
            ✓ Code créé et disponible immédiatement au planning !
          </span>
        )}
      </form>

      {error && (
        <div className="mt-3 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
