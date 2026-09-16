// app/(dashboard)/working-place-codes/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasCapability, type Role } from "@/auth/permissions";
import { listActiveCodes } from "@/domain/codes/service";
import { CreateCodeForm } from "@/components/codes/CreateCodeForm";
import { CodesTable } from "@/components/codes/CodesTable";

export default async function WorkingPlaceCodesPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const role = session.user.role as Role;

  // Gated on WORKING_PLACE_CODES_VIEW capability
  if (!hasCapability(role, "WORKING_PLACE_CODES_VIEW")) {
    redirect("/schedule");
  }

  const canManage = hasCapability(role, "WORKING_PLACE_CODES_MANAGE");
  const codes = await listActiveCodes();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Codes des Postes de Travail (Working-Place Codes)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestion des codes personnalisés affectés aux employés sur les plannings du parc (§17, §18, §48).
        </p>
      </div>

      {/* Create Code Form at top (§18, §48) */}
      {canManage && <CreateCodeForm />}

      {/* Table of ACTIVE codes with inline edit and soft-delete confirm (§48) */}
      <CodesTable codes={codes} canManage={canManage} />
    </div>
  );
}
