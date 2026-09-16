// domain/codes/service.ts
import { prisma } from "@/lib/prisma";

/**
 * Returns all currently active working-place codes.
 * Inactive (soft-deleted) codes must never appear in any picker (§18, §22, Prompt Decision #6).
 */
export async function listActiveCodes() {
  return prisma.workingPlaceCode.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });
}

/**
 * Creates a new working-place code (spec §18, §19).
 * If a soft-deleted code with the same name exists, reactivates it.
 */
export async function createWorkingPlaceCode(rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    throw new Error("Code cannot be empty");
  }

  const existing = await prisma.workingPlaceCode.findUnique({
    where: { code },
  });

  if (existing) {
    if (existing.isActive) {
      throw new Error(`Le code '${code}' existe déjà.`);
    }
    // Reactivate soft-deleted code
    return prisma.workingPlaceCode.update({
      where: { id: existing.id },
      data: { isActive: true },
    });
  }

  return prisma.workingPlaceCode.create({
    data: {
      code,
      isActive: true,
    },
  });
}

/**
 * Renames an existing working-place code (spec §21).
 * Historical schedules maintain their frozen snapshots and are never modified.
 */
export async function updateWorkingPlaceCode(id: string, newRawCode: string) {
  const newCode = newRawCode.trim().toUpperCase();
  if (!newCode) {
    throw new Error("Code cannot be empty");
  }

  const duplicate = await prisma.workingPlaceCode.findFirst({
    where: {
      code: newCode,
      NOT: { id },
    },
  });

  if (duplicate && duplicate.isActive) {
    throw new Error(`Un autre code actif '${newCode}' existe déjà.`);
  }

  return prisma.workingPlaceCode.update({
    where: { id },
    data: { code: newCode },
  });
}

/**
 * Soft-deletes a working-place code (spec §22).
 * Sets isActive to false so it disappears from pickers, but preserves historical data.
 */
export async function deleteWorkingPlaceCode(id: string) {
  return prisma.workingPlaceCode.update({
    where: { id },
    data: { isActive: false },
  });
}
