// app/(dashboard)/employees/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasCapability, type Role } from "@/auth/permissions";
import {
  getManageableRoles,
  listManageableUsers,
} from "@/domain/employees/service";
import { CreateEmployeeDialog } from "@/components/employees/CreateEmployeeDialog";
import { EmployeesTable } from "@/components/employees/EmployeesTable";

export default async function EmployeesPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const role = session.user.role as Role;

  // Gated on ACCOUNTS_VIEW capability
  if (!hasCapability(role, "ACCOUNTS_VIEW")) {
    redirect("/schedule");
  }

  const manageableRoles = getManageableRoles(role);
  const employees = await listManageableUsers(role);

  return (
    <div className="space-y-6">
      {/* Header & Create Employee CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Gestion des Employés & Comptes (Staff Accounts)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion hiérarchique des comptes, statuts (actif/suspendu/supprimé) et mots de passe (§4–§7, §11, §12).
          </p>
        </div>

        {manageableRoles.length > 0 && (
          <CreateEmployeeDialog manageableRoles={manageableRoles} />
        )}
      </div>

      {/* Staff Table */}
      <EmployeesTable
        employees={employees.map((u) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          role: u.role as Role,
          status: u.status as any,
          createdAt: u.createdAt,
        }))}
        actorRole={role}
        manageableRoles={manageableRoles}
      />
    </div>
  );
}
