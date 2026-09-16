// app/(dashboard)/modification-requests/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasCapability, type Role } from "@/auth/permissions";
import { prisma } from "@/lib/prisma";
import {
  ModificationRequestsTable,
  type ModificationRequestItem,
} from "@/components/modifications/ModificationRequestsTable";

export default async function ModificationRequestsPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const role = session.user.role as Role;

  // Gated on MODIFICATION_REQUESTS_VIEW capability
  if (!hasCapability(role, "MODIFICATION_REQUESTS_VIEW")) {
    redirect("/schedule");
  }

  // Load all modification requests with schedule and user relations
  const requests = await prisma.modificationRequest.findMany({
    include: {
      schedule: true,
      requestedBy: true,
      authorizedBy: true,
    },
    orderBy: {
      requestedAt: "desc",
    },
  });

  const formattedRequests: ModificationRequestItem[] = requests.map((req) => ({
    id: req.id,
    scheduleId: req.scheduleId,
    weekStartDate: req.schedule.weekStartDate,
    weekEndDate: req.schedule.weekEndDate,
    requesterName: req.requestedBy.name,
    requesterRole: req.requestedBy.role as Role,
    reason: req.reason,
    status: req.status,
    authorizedByName: req.authorizedBy?.name ?? null,
    requestedAt: req.requestedAt,
    authorizedAt: req.authorizedAt,
  }));

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {role === "GRH"
              ? "Boîte de Réception GRH (Authorizations Inbox)"
              : "Demandes de Modification de Planning"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Contrôle des autorisations d&apos;ouverture des plannings verrouillés (§4, §32, §33, §35).
          </p>
        </div>

        {/* Quick status counters */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>En attente :</span>
            <span className="font-bold">{pendingCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Autorisées :</span>
            <span className="font-bold">{approvedCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span>Rejetées :</span>
            <span className="font-bold">{rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Table with role-restricted actions */}
      <ModificationRequestsTable
        requests={formattedRequests}
        actorRole={role}
      />
    </div>
  );
}
