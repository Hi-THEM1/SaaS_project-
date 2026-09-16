// components/modifications/ModificationRequestsTable.tsx
"use client";

import { useState, useTransition } from "react";
import { type Role } from "@/auth/permissions";
import {
  approveModificationRequestAction,
  rejectModificationRequestAction,
} from "@/actions/modification-requests";
import { Button } from "@/components/ui/Button";
import { formatDateTimeFrench, formatWeekRangeFrench } from "@/lib/utils";

export interface ModificationRequestItem {
  id: string;
  scheduleId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  requesterName: string;
  requesterRole: Role;
  reason: string;
  status: string; // PENDING, APPROVED, REJECTED
  authorizedByName?: string | null;
  requestedAt: Date;
  authorizedAt?: Date | null;
}

interface ModificationRequestsTableProps {
  requests: ModificationRequestItem[];
  actorRole: Role;
}

const STATUS_BADGES: Record<string, { label: string; badgeClass: string }> = {
  PENDING: {
    label: "En attente (Pending)",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  APPROVED: {
    label: "Autorisée (Approved)",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  REJECTED: {
    label: "Rejetée (Rejected)",
    badgeClass: "bg-red-100 text-red-800 border-red-300",
  },
};

const ROLE_BADGES: Record<Role, { label: string; badgeClass: string }> = {
  GRH: { label: "GRH", badgeClass: "bg-purple-100 text-purple-800" },
  MANAGER: { label: "Manager", badgeClass: "bg-blue-100 text-blue-800" },
  ADMIN: { label: "Admin", badgeClass: "bg-emerald-100 text-emerald-800" },
  SUPERVISOR: { label: "Supervisor", badgeClass: "bg-amber-100 text-amber-800" },
  OPERATOR: { label: "Operator", badgeClass: "bg-slate-100 text-slate-700" },
  OPERATOR_PILOT: { label: "Pilot", badgeClass: "bg-cyan-100 text-cyan-800" },
};

export function ModificationRequestsTable({
  requests,
  actorRole,
}: ModificationRequestsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isGRH = actorRole === "GRH";

  const handleApprove = (requestId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await approveModificationRequestAction({ requestId });
      if (!res.ok) setError(res.error);
    });
  };

  const handleReject = (requestId: string) => {
    setError(null);
    if (!confirm("Confirmer le rejet de cette demande de modification ?")) {
      return;
    }
    startTransition(async () => {
      const res = await rejectModificationRequestAction({ requestId });
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-150 bg-slate-50/70 p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
          Historique des Demandes de Réouverture (§32, §33, §35)
        </h3>
        <p className="text-xs text-slate-500">
          {isGRH
            ? "En tant que GRH, vous pouvez autoriser ou rejeter la réouverture des plannings verrouillés."
            : "Vue en lecture seule de l'état des demandes d'autorisation de modification."}
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
                Demandeur
              </th>
              <th scope="col" className="px-5 py-3">
                Semaine concernée
              </th>
              <th scope="col" className="px-5 py-3">
                Motif (Reason)
              </th>
              <th scope="col" className="px-5 py-3">
                Statut
              </th>
              <th scope="col" className="px-5 py-3 hidden md:table-cell">
                Historique GRH (§35)
              </th>
              <th scope="col" className="px-5 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {requests.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-slate-500"
                >
                  Aucune demande de modification enregistrée.
                </td>
              </tr>
            ) : (
              requests.map((req) => {
                const isPendingStatus = req.status === "PENDING";
                const canAct = isGRH && isPendingStatus;
                const statusMeta = STATUS_BADGES[req.status] ?? {
                  label: req.status,
                  badgeClass: "bg-slate-100 text-slate-700",
                };
                const roleMeta = ROLE_BADGES[req.requesterRole];
                const weekLabel = formatWeekRangeFrench(
                  new Date(req.weekStartDate),
                  new Date(req.weekEndDate)
                );

                return (
                  <tr
                    key={req.id}
                    id={`mod-row-${req.id}`}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Requester */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">
                        {req.requesterName}
                      </div>
                      <div className="mt-0.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${roleMeta.badgeClass}`}
                        >
                          {roleMeta.label}
                        </span>
                      </div>
                    </td>

                    {/* Week */}
                    <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-800 text-xs">
                      {weekLabel}
                    </td>

                    {/* Reason */}
                    <td className="px-5 py-3.5 max-w-xs text-xs text-slate-700">
                      <p className="line-clamp-2">{req.reason}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Demandé le {formatDateTimeFrench(new Date(req.requestedAt))}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* Resolution history (§35) */}
                    <td className="px-5 py-3.5 text-xs text-slate-500 hidden md:table-cell">
                      {req.authorizedByName && req.authorizedAt ? (
                        <div>
                          <span className="font-semibold text-slate-700">
                            Par {req.authorizedByName}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            le {formatDateTimeFrench(new Date(req.authorizedAt))}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">En attente de décision</span>
                      )}
                    </td>

                    {/* Actions: Approve / Reject ONLY for role GRH on PENDING (§4, §33) */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {canAct ? (
                        <div className="inline-flex items-center space-x-2">
                          <Button
                            id={`approve-btn-${req.id}`}
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleApprove(req.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
                          >
                            Autoriser
                          </Button>
                          <Button
                            id={`reject-btn-${req.id}`}
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleReject(req.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8 px-3"
                          >
                            Rejeter
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {isPendingStatus ? "En attente GRH" : "Dossier clôturé"}
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
    </div>
  );
}
