// components/codes/CodesTable.tsx
"use client";

import { useState, useTransition } from "react";
import {
  updateWorkingPlaceCodeAction,
  deleteWorkingPlaceCodeAction,
} from "@/actions/working-place-codes";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { formatDateFrench } from "@/lib/utils";

interface CodeItem {
  id: string;
  code: string;
  createdAt: Date;
}

interface CodesTableProps {
  codes: CodeItem[];
  canManage: boolean;
}

export function CodesTable({ codes, canManage }: CodesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CodeItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Inline rename handler (§21)
  const handleStartEdit = (code: CodeItem) => {
    setError(null);
    setEditingId(code.id);
    setEditValue(code.code);
  };

  const handleSaveEdit = (id: string) => {
    if (!editValue.trim()) return;
    setError(null);

    startTransition(async () => {
      const res = await updateWorkingPlaceCodeAction({
        id,
        newCode: editValue.trim(),
      });
      if (res.ok) {
        setEditingId(null);
      } else {
        setError(res.error);
      }
    });
  };

  // Soft delete confirm handler (§22)
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setError(null);

    startTransition(async () => {
      const res = await deleteWorkingPlaceCodeAction({ id: deleteTarget.id });
      if (res.ok) {
        setDeleteTarget(null);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-150 bg-slate-50/70 p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
          Codes Actifs du Parc (Active Working-Place Codes)
        </h3>
        <p className="text-xs text-slate-500">
          Seuls les codes actifs apparaissent dans les menus déroulants du planning (§18, §22).
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
                Code
              </th>
              <th scope="col" className="px-5 py-3">
                Statut
              </th>
              <th scope="col" className="px-5 py-3 hidden sm:table-cell">
                Créé le
              </th>
              {canManage && (
                <th scope="col" className="px-5 py-3 text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {codes.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 4 : 3}
                  className="px-5 py-8 text-center text-sm text-slate-500"
                >
                  Aucun code de poste actif. Utilisez le formulaire ci-dessus pour en créer un.
                </td>
              </tr>
            ) : (
              codes.map((item) => {
                const isEditingThis = editingId === item.id;

                return (
                  <tr
                    key={item.id}
                    id={`code-row-${item.id}`}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Code name / Inline edit */}
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">
                      {isEditingThis ? (
                        <div className="flex items-center gap-2 max-w-xs">
                          <input
                            id={`edit-code-input-${item.id}`}
                            type="text"
                            value={editValue}
                            autoFocus
                            disabled={isPending}
                            onChange={(e) =>
                              setEditValue(e.target.value.toUpperCase())
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(item.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="w-32 rounded border border-indigo-500 px-2 py-1 text-sm font-mono font-bold text-slate-900 focus:outline-none"
                          />
                          <Button
                            id={`save-edit-btn-${item.id}`}
                            size="sm"
                            disabled={isPending || !editValue.trim()}
                            onClick={() => handleSaveEdit(item.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7 px-2"
                          >
                            Enregistrer
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => setEditingId(null)}
                            className="text-xs h-7 px-2"
                          >
                            Annuler
                          </Button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 border border-slate-250 text-slate-900">
                          {item.code}
                        </span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Actif (Active)
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3 text-xs text-slate-500 hidden sm:table-cell">
                      {formatDateFrench(new Date(item.createdAt))}
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td className="px-5 py-3 text-right">
                        {!isEditingThis && (
                          <div className="inline-flex items-center space-x-2">
                            <button
                              type="button"
                              id={`edit-btn-${item.id}`}
                              disabled={isPending}
                              onClick={() => handleStartEdit(item)}
                              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:underline px-1.5 py-1"
                            >
                              Modifier
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              id={`delete-btn-${item.id}`}
                              disabled={isPending}
                              onClick={() => setDeleteTarget(item)}
                              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline px-1.5 py-1"
                            >
                              Supprimer
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Soft-Delete Confirmation Dialog (§22) */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogHeader>
          <DialogTitle>Supprimer le code &quot;{deleteTarget?.code}&quot; ?</DialogTitle>
          <DialogDescription>
            Cette action désactive le code. Il n&apos;apparaîtra plus dans les choix des futurs
            plannings. Cependant, tous les plannings et historiques existants conservent le code &quot;{deleteTarget?.code}&quot; intact (§22, §50).
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
            id="dialog-confirm-delete-code-btn"
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirmDelete}
          >
            {isPending ? "Désactivation..." : "Confirmer la suppression"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
