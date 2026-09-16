// components/employees/CreateEmployeeDialog.tsx
"use client";

import { useState, useTransition } from "react";
import { type Role } from "@/auth/permissions";
import { createEmployeeAccountAction } from "@/actions/employees";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

interface CreateEmployeeDialogProps {
  manageableRoles: Role[];
}

export function CreateEmployeeDialog({
  manageableRoles,
}: CreateEmployeeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(manageableRoles[0] || "OPERATOR");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (manageableRoles.length === 0) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await createEmployeeAccountAction({
        name,
        username,
        password,
        role,
      });

      if (res.ok) {
        setName("");
        setUsername("");
        setPassword("");
        setIsOpen(false);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <>
      <Button
        id="btn-open-create-employee"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className="bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        + Créer un Compte Employé
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogHeader>
          <DialogTitle>Créer un Nouveau Compte Employé</DialogTitle>
          <DialogDescription>
            Remplissez les informations de base pour ajouter un employé au système (§11).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs font-semibold text-red-800">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="emp-create-name"
              className="block text-xs font-semibold uppercase text-slate-700 mb-1"
            >
              Nom & Prénom
            </label>
            <input
              id="emp-create-name"
              type="text"
              required
              value={name}
              disabled={isPending}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Ahmed Mansour"
              className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="emp-create-username"
              className="block text-xs font-semibold uppercase text-slate-700 mb-1"
            >
              Identifiant (Username / Email)
            </label>
            <input
              id="emp-create-username"
              type="text"
              required
              value={username}
              disabled={isPending}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex: ahmed.mansour"
              className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="emp-create-password"
              className="block text-xs font-semibold uppercase text-slate-700 mb-1"
            >
              Mot de passe initial
            </label>
            <input
              id="emp-create-password"
              type="password"
              required
              value={password}
              disabled={isPending}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="emp-create-role"
              className="block text-xs font-semibold uppercase text-slate-700 mb-1"
            >
              Rôle
            </label>
            <select
              id="emp-create-role"
              value={role}
              disabled={isPending}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              {manageableRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setIsOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              id="emp-create-submit-btn"
              size="sm"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPending ? "Création en cours..." : "Créer le Compte"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
