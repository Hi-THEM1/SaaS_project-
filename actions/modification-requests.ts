// actions/modification-requests.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/auth/permissions";
import {
  approveRequestSchema,
  rejectRequestSchema,
} from "@/lib/zod-schemas";
import { approveReopen, rejectReopen } from "@/domain/schedule/service";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * GRH authorizes reopening a submitted schedule for modification (spec §4, §33).
 */
export async function approveModificationRequestAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = approveRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const actor = await requireCapability("MODIFICATION_REQUESTS_AUTHORIZE");
    await approveReopen(parsed.data.requestId, actor.id);
    revalidatePath("/modification-requests");
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to authorize modification request",
    };
  }
}

/**
 * GRH rejects a request to reopen a submitted schedule (spec §33).
 */
export async function rejectModificationRequestAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = rejectRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const actor = await requireCapability("MODIFICATION_REQUESTS_AUTHORIZE");
    await rejectReopen(parsed.data.requestId, actor.id);
    revalidatePath("/modification-requests");
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to reject modification request",
    };
  }
}
