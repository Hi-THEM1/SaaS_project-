// components/employees/EmployeesTable.tsx
"use client";

import { useState, useTransition } from "react";
import { canManageAccount, type Role } from "@/auth/permissions";
import {
  deleteEmployeeAccountAction,
  editEmployeeAccountAction,
  reactivateEmployeeAccountAction,
  resetEmployeePasswordAction,
  suspendEmployeeAccountAction,
} from "@/actions/employees";
import {
  type UserStatus,
  USER_STATUS_STYLES,
} from "@/domain/employees/service";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { formatDateFrench } from "@/lib/utils";

interface EmployeeItem {
  id: string;
  name: string;
  username: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
}

interface EmployeesTableProps {
  employees: EmployeeItem[];
  actorRole: Role;
  manageableRoles: Role[];
}

const ROLE_BADGES: Record<Role, { label: string; badgeClass: string }> = {
  GRH: { label: "GRH", badgeClass: "bg-purple-100 text-purple-800" },
  MANAGER: { label: "Manager", badgeClass: "bg-blue-100 text-blue-800" },
  ADMIN: { label: "Admin", badgeClass: "bg-emerald-100 text-emerald-800" },
  SUPERVISOR: { label: "Supervisor", badgeClass: "bg-amber-100 text-amber-800" },
  OPERATOR: { label: "Operator", badgeClass: "bg-slate-100 text-slate-700" },
  OPERATOR_PILOT: { label: "Operator Pilot", badgeClass: "bg-cyan-100 text-cyan-800" },
};

export function EmployeesTable({
  employees,
  actorRole,
  manageableRoles,
}: EmployeesTableProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [editTarget, setEditTarget] = useState<EmployeeItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<Role>("OPERATOR");

  const [deleteTarget, setDeleteTarget] = useState<EmployeeItem | null>(null);

  const [passwordTarget, setPasswordTarget] = useState<EmployeeItem | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Edit Handlers
  const handleOpenEdit = (emp: EmployeeItem) => {
    setError(null);
    setEditTarget(emp);
    setEditName(emp.name);
    setEditUsername(emp.username);
    setEditRole(emp.role);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    setError(null);
    startTransition(async () => {
      const res = await editEmployeeAccountAction({
        id: editTarget.id,
        name: editName,
        username: editUsername,
        role: editRole,
      });

      if (res.ok) {
        setEditTarget(null);
      } else {
        setError(res.error);
      }
    });
  };

  // Suspend / Reactivate Handlers
  const handleToggleSuspend = (emp: EmployeeItem) => {
    setError(null);
    startTransition(async () => {
      if (emp.status === "ACTIVE") {
        const res = await suspendEmployeeAccountAction({ id: emp.id });
        if (!res.ok) setError(res.error);
      } else if (emp.status === "SUSPENDED") {
        const res = await reactivateEmployeeAccountAction({ id: emp.id });
        if (!res.ok) setError(res.error);
      }
    });
  };

  // Delete Confirm Handler
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    setError(null);
    startTransition(async () => {
      const res = await deleteEmployeeAccountAction({ id: deleteTarget.id });
      if (res.ok) {
        setDeleteTarget(null);
      } else {
        setError(res.error);
      }
    });
  };

  // Reset Password Handler
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget || !newPassword.trim()) return;

    setError(null);
    startTransition(async () => {
      const res = await resetEmployeePasswordAction({
        id: passwordTarget.id,
        newPassword: newPassword.trim(),
      });

      if (res.ok) {
        setPasswordTarget(null);
        setNewPassword("");
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-150 bg-slate-50/70 p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
          Comptes & Employés Autorisés (Staff Accounts)
        </h3>
        <p className="text-xs text-slate-500">
          Affichage et gestion strictement filtrés selon la hiérarchie de votre rôle (§4–§7, §11, §51).
        </p>
      </div>

      {error && (
        <div className="m-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-800 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-600">
              <th scope="col" className="px-5 py-3">
                Employé
              </th>
              <th scope="col" className="px-5 py-3">
                Rôle
              </th>
              <th scope="col" className="px-5 py-3">
                Statut
              </th>
              <th scope="col" className="px-5 py-3 hidden md:table-cell">
                Créé le
              </th>
              <th scope="col" className="px-5 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {employees.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-sm text-slate-500"
                >
                  Aucun compte gérable trouvé dans votre hiérarchie.
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                // Hierarchical rule check: refuse to render action buttons actor cannot perform
                const isManageable = canManageAccount(actorRole, emp.role);
                const roleMeta = ROLE_BADGES[emp.role];
                const statusMeta = USER_STATUS_STYLES[emp.status];

                return (
                  <tr
                    key={emp.id}
                    id={`emp-row-${emp.id}`}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Name & Username */}
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900">{emp.name}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        @{emp.username}
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${roleMeta.badgeClass}`}
                      >
                        {roleMeta.label}
                      </span>
                    </td>

                    {/* Status Badge (§11, §12) */}
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-5 py-3 text-xs text-slate-500 hidden md:table-cell">
                      {formatDateFrench(new Date(emp.createdAt))}
                    </td>

                    {/* Actions: ONLY rendered if canManageAccount is true */}
                    <td className="px-5 py-3 text-right">
                      {isManageable ? (
                        <div className="inline-flex items-center space-x-2 text-xs font-semibold">
                          {/* Edit */}
                          <button
                            type="button"
                            id={`emp-edit-btn-${emp.id}`}
                            disabled={isPending}
                            onClick={() => handleOpenEdit(emp)}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            Modifier
                          </button>

                          <span className="text-slate-200">|</span>

                          {/* Suspend / Reactivate (§12) */}
                          {emp.status === "ACTIVE" && (
                            <button
                              type="button"
                              id={`emp-suspend-btn-${emp.id}`}
                              disabled={isPending}
                              onClick={() => handleToggleSuspend(emp)}
                              className="text-amber-600 hover:text-amber-800 hover:underline"
                            >
                              Suspendre
                            </button>
                          )}
                          {emp.status === "SUSPENDED" && (
                            <button
                              type="button"
                              id={`emp-reactivate-btn-${emp.id}`}
                              disabled={isPending}
                              onClick={() => handleToggleSuspend(emp)}
                              className="text-emerald-600 hover:text-emerald-800 hover:underline"
                            >
                              Réactiver
                            </button>
                          )}

                          {/* Delete soft (§11) */}
                          {emp.status !== "DELETED" && (
                            <>
                              <span className="text-slate-200">|</span>
                              <button
                                type="button"
                                id={`emp-delete-btn-${emp.id}`}
                                disabled={isPending}
                                onClick={() => setDeleteTarget(emp)}
                                className="text-red-600 hover:text-red-800 hover:underline"
                              >
                                Supprimer
                              </button>
                            </>
                          )}

                          <span className="text-slate-200">|</span>

                          {/* Reset Password (§10) */}
                          <button
                            type="button"
                            id={`emp-reset-pwd-btn-${emp.id}`}
                            disabled={isPending}
                            onClick={() => {
                              setPasswordTarget(emp);
                              setNewPassword("");
                            }}
                            className="text-slate-600 hover:text-slate-900 hover:underline"
                          >
                            MDP
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Lecture seule
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Employee Dialog */}
      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogHeader>
          <DialogTitle>Modifier l&apos;employé</DialogTitle>
          <DialogDescription>
            Modifier les informations de base et le rôle de l&apos;employé.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveEdit} className="space-y-3 py-2">
          <div>
            <label
              htmlFor="edit-emp-name"
              className="block text-xs font-semibold uppercase text-slate-700 mb-1"
            >
              Nom & Prénom
            </label>
            <input
              id="edit-emp-name"
              type="text"
              required
              value={editName}
              disabled={isPending}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="edit-emp-username"
              className="block text-xs font-semibold uppercase text-slate-700 mb-1"
            >
              Identifiant
            </label>
            <input
              id="edit-emp-username"
              type="text"
              required
              value={editUsername}
              disabled={isPending}
              onChange={(e) => setEditUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="edit-emp-role"
              className="block text-xs font-semibold uppercase text-slate-700 mb-1"
            >
              Rôle
            </label>
            <select
              id="edit-emp-role"
              value={editRole}
              disabled={isPending}
              onChange={(e) => setEditRole(e.target.value as Role)}
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
              onClick={() => setEditTarget(null)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              id="dialog-save-emp-btn"
              size="sm"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete (Soft) Confirmation Dialog (§11) */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogHeader>
          <DialogTitle>Supprimer le compte de {deleteTarget?.name} ?</DialogTitle>
          <DialogDescription>
            Cette action désactive le compte employé. L&apos;employé ne pourra plus se connecter,
            mais l&apos;ensemble de ses plannings passés et historiques de présence restent conservés dans le système (§11).
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setDeleteTarget(null)}
          >
            Annuler
          </Button>
          <Button
            id="dialog-confirm-delete-emp-btn"
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirmDelete}
          >
            {isPending ? "Suppression..." : "Confirmer la désactivation"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Reset Password Dialog (§10) */}
      <Dialog
        open={Boolean(passwordTarget)}
        onOpenChange={(open) => !open && setPasswordTarget(null)}
      >
        <DialogHeader>
          <DialogTitle>
            Réinitialiser le Mot de Passe de {passwordTarget?.name}
          </DialogTitle>
          <DialogDescription>
            Saisissez le nouveau mot de passe provisoire pour cet employé (§10).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSavePassword} className="space-y-3 py-2">
          <div>
            <label
              htmlFor="reset-emp-password"
              className="block text-xs font-semibold uppercase text-slate-700 mb-1"
            >
              Nouveau mot de passe
            </label>
            <input
              id="reset-emp-password"
              type="password"
              required
              value={newPassword}
              disabled={isPending}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setPasswordTarget(null)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              id="dialog-save-pwd-btn"
              size="sm"
              disabled={isPending || !newPassword.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPending ? "Modification..." : "Modifier le mot de passe"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
