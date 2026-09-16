// domain/employees/service.ts
import { prisma } from "@/lib/prisma";
import { canManageAccount, type Role } from "@/auth/permissions";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export const USER_STATUS_STYLES: Record<
  UserStatus,
  { label: string; badgeClass: string }
> = {
  ACTIVE: {
    label: "Actif",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  SUSPENDED: {
    label: "Suspendu",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  DELETED: {
    label: "Désactivé (Supprimé)",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-300",
  },
};

/**
 * Returns roles that the actor is authorized to create/manage (§4, §5, §6, §7, §11, §51).
 */
export function getManageableRoles(actorRole: Role): Role[] {
  const allRoles: Role[] = [
    "ADMIN",
    "SUPERVISOR",
    "OPERATOR",
    "OPERATOR_PILOT",
  ];
  return allRoles.filter((targetRole) => canManageAccount(actorRole, targetRole));
}

/**
 * Queries users that the actor is authorized to see per prompt requirements:
 * - Manager sees Admin + Supervisor + Operator + Pilot rows
 * - Admin and Supervisor see only Operator + Pilot rows
 * - GRH sees Admin + Supervisor rows
 */
export async function listManageableUsers(actorRole: Role) {
  const allowedRoles = getManageableRoles(actorRole);

  if (allowedRoles.length === 0) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      role: { in: allowedRoles },
    },
    orderBy: [
      { status: "asc" },
      { role: "asc" },
      { name: "asc" },
    ],
  });
}

/**
 * Creates an employee account with initial password.
 */
export async function createEmployeeAccount(data: {
  name: string;
  username: string;
  password: string;
  role: Role;
}) {
  const existing = await prisma.user.findUnique({
    where: { username: data.username },
  });

  if (existing) {
    throw new Error(`L'identifiant '${data.username}' est déjà utilisé.`);
  }

  return prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      passwordHash: data.password, // Plain/hash per spec §10
      role: data.role,
      status: "ACTIVE",
    },
  });
}

/**
 * Edits an employee account details.
 */
export async function editEmployeeAccount(
  id: string,
  data: {
    name: string;
    username: string;
    role: Role;
  }
) {
  const duplicate = await prisma.user.findFirst({
    where: {
      username: data.username,
      NOT: { id },
    },
  });

  if (duplicate) {
    throw new Error(`L'identifiant '${data.username}' est déjà utilisé.`);
  }

  return prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      username: data.username,
      role: data.role,
    },
  });
}

/**
 * Suspends an account (spec §12: employee cannot log in, data preserved).
 */
export async function suspendEmployeeAccount(id: string) {
  return prisma.user.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });
}

/**
 * Reactivates a suspended account (spec §12).
 */
export async function reactivateEmployeeAccount(id: string) {
  return prisma.user.update({
    where: { id },
    data: { status: "ACTIVE" },
  });
}

/**
 * Soft-deletes an account (spec §11: historical schedules and attendance remain).
 */
export async function deleteEmployeeAccount(id: string) {
  return prisma.user.update({
    where: { id },
    data: { status: "DELETED" },
  });
}

/**
 * Resets an employee's password (spec §10).
 */
export async function resetEmployeePassword(id: string, newPassword: string) {
  return prisma.user.update({
    where: { id },
    data: { passwordHash: newPassword },
  });
}
