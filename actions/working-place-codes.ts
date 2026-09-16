// actions/working-place-codes.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/auth/permissions";
import {
  createCodeSchema,
  deleteCodeSchema,
  updateCodeSchema,
} from "@/lib/zod-schemas";
import {
  createWorkingPlaceCode,
  deleteWorkingPlaceCode,
  updateWorkingPlaceCode,
} from "@/domain/codes/service";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Creates a new working-place code (spec §18).
 */
export async function createWorkingPlaceCodeAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = createCodeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await requireCapability("WORKING_PLACE_CODES_MANAGE");
    await createWorkingPlaceCode(parsed.data.code);
    revalidatePath("/working-place-codes");
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create code",
    };
  }
}

/**
 * Renames an existing working-place code (spec §21).
 */
export async function updateWorkingPlaceCodeAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = updateCodeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await requireCapability("WORKING_PLACE_CODES_MANAGE");
    await updateWorkingPlaceCode(parsed.data.id, parsed.data.newCode);
    revalidatePath("/working-place-codes");
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update code",
    };
  }
}

/**
 * Soft-deletes a working-place code (spec §22).
 */
export async function deleteWorkingPlaceCodeAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = deleteCodeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await requireCapability("WORKING_PLACE_CODES_MANAGE");
    await deleteWorkingPlaceCode(parsed.data.id);
    revalidatePath("/working-place-codes");
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete code",
    };
  }
}
