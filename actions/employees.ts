// actions/employees.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canManageAccount, requireCapability, type Role } from "@/auth/permissions";
import {
  createUserSchema,
  deleteUserSchema,
  editUserSchema,
  reactivateUserSchema,
  resetPasswordSchema,
  suspendUserSchema,
} from "@/lib/zod-schemas";
import {
  createEmployeeAccount,
  deleteEmployeeAccount,
  editEmployeeAccount,
  reactivateEmployeeAccount,
  resetEmployeePassword,
  suspendEmployeeAccount,
} from "@/domain/employees/service";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Creates a new employee account (gated by ACCOUNTS_MANAGE and canManageAccount on new role).
 */
export async function createEmployeeAccountAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = createUserSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const actor = await requireCapability("ACCOUNTS_MANAGE");

    // Double-check hierarchical authorization
    if (!canManageAccount(actor.role, parsed.data.role as Role)) {
      return {
        ok: false,
        error: `Vous n'avez pas l'autorisation de créer un compte avec le rôle '${parsed.data.role}'.`,
      };
    }

    await createEmployeeAccount({
      name: parsed.data.name,
      username: parsed.data.username,
      password: parsed.data.password,
      role: parsed.data.role as Role,
    });

    revalidatePath("/employees");
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create account",
    };
  }
}

/**
 * Edits an employee account (gated by canManageAccount on both target and new role).
 */
export async function editEmployeeAccountAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = editUserSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const actor = await requireCapability("ACCOUNTS_MANAGE");
    const target = await prisma.user.findUnique({
      where: { id: parsed.data.id },
    });

    if (!target) {
      return { ok: false, error: "Compte introuvable" };
    }

    // Double-check actor can manage target's current role
    if (!canManageAccount(actor.role, target.role as Role)) {
      return {
        ok: false,
        error: "Action refusée : hiérarchie de rôle insuffisante pour modifier cet employé.",
      };
    }

    // Double-check actor can assign the new role
    if (!canManageAccount(actor.role, parsed.data.role as Role)) {
      return {
        ok: false,
        error: `Action refusée : vous ne pouvez pas attribuer le rôle '${parsed.data.role}'.`,
      };
    }

    await editEmployeeAccount(parsed.data.id, {
      name: parsed.data.name,
      username: parsed.data.username,
      role: parsed.data.role as Role,
    });

    revalidatePath("/employees");
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to edit account",
    };
  }
}

/**
 * Suspends an active account (§12).
 */
export async function suspendEmployeeAccountAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = suspendUserSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const actor = await requireCapability("ACCOUNTS_MANAGE");
    const target = await prisma.user.findUnique({
      where: { id: parsed.data.id },
    });

    if (!target) return { ok: false, error: "Compte introuvable" };

    if (!canManageAccount(actor.role, target.role as Role)) {
      return {
        ok: false,
        error: "Action refusée : hiérarchie de rôle insuffisante pour suspendre cet employé.",
      };
    }

    await suspendEmployeeAccount(parsed.data.id);
    revalidatePath("/employees");
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to suspend account",
    };
  }
}

/**
 * Reactivates a suspended account (§12).
 */
export async function reactivateEmployeeAccountAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = reactivateUserSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const actor = await requireCapability("ACCOUNTS_MANAGE");
    const target = await prisma.user.findUnique({
      where: { id: parsed.data.id },
    });

    if (!target) return { ok: false, error: "Compte introuvable" };

    if (!canManageAccount(actor.role, target.role as Role)) {
      return {
        ok: false,
        error: "Action refusée : hiérarchie de rôle insuffisante pour réactiver cet employé.",
      };
    }

    await reactivateEmployeeAccount(parsed.data.id);
    revalidatePath("/employees");
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to reactivate account",
    };
  }
}

/**
 * Soft-deletes an account (§11).
 */
export async function deleteEmployeeAccountAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = deleteUserSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const actor = await requireCapability("ACCOUNTS_MANAGE");
    const target = await prisma.user.findUnique({
      where: { id: parsed.data.id },
    });

    if (!target) return { ok: false, error: "Compte introuvable" };

    if (!canManageAccount(actor.role, target.role as Role)) {
      return {
        ok: false,
        error: "Action refusée : hiérarchie de rôle insuffisante pour supprimer cet employé.",
      };
    }

    await deleteEmployeeAccount(parsed.data.id);
    revalidatePath("/employees");
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete account",
    };
  }
}

/**
 * Resets an employee password (§10).
 */
export async function resetEmployeePasswordAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const actor = await requireCapability("ACCOUNTS_MANAGE");
    const target = await prisma.user.findUnique({
      where: { id: parsed.data.id },
    });

    if (!target) return { ok: false, error: "Compte introuvable" };

    if (!canManageAccount(actor.role, target.role as Role)) {
      return {
        ok: false,
        error: "Action refusée : hiérarchie de rôle insuffisante pour réinitialiser le mot de passe de cet employé.",
      };
    }

    await resetEmployeePassword(parsed.data.id, parsed.data.newPassword);
    revalidatePath("/employees");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to reset password",
    };
  }
}
