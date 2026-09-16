// actions/schedule.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/auth/permissions";
import {
  copyPreviousWeekSchema,
  editParkHoursSchema,
  requestModificationSchema,
  resubmitScheduleSchema,
  saveAssignmentSchema,
  submitScheduleSchema,
} from "@/lib/zod-schemas";
import {
  copyPreviousWeek,
  requestModification,
  resubmitSchedule,
  saveAssignment,
  saveParkHours,
  submitSchedule,
} from "@/domain/schedule/service";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Saves a single assignment cell (canonical action pattern).
 */
export async function saveAssignmentAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = saveAssignmentSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await requireCapability("SCHEDULE_EDIT");
    await saveAssignment(
      parsed.data.scheduleId,
      parsed.data.userId,
      parsed.data.dayOfWeek,
      parsed.data.codesSnapshot
    );
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save assignment",
    };
  }
}

/**
 * Copies all assignments from the previous week into the current schedule (spec §28).
 */
export async function copyPreviousWeekAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = copyPreviousWeekSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await requireCapability("SCHEDULE_EDIT");
    await copyPreviousWeek(parsed.data.targetScheduleId);
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to copy previous week",
    };
  }
}

/**
 * Submits the schedule to GRH, locking it (spec §31).
 */
export async function submitScheduleAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = submitScheduleSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const user = await requireCapability("SCHEDULE_SUBMIT");
    await submitSchedule(parsed.data.scheduleId, user.name || user.id);
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to submit schedule",
    };
  }
}

/**
 * Requests modification from GRH after submission (spec §32).
 */
export async function requestModificationAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = requestModificationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const user = await requireCapability("SCHEDULE_REQUEST_MODIFICATION");
    await requestModification(
      parsed.data.scheduleId,
      user.id,
      parsed.data.reason
    );
    revalidatePath("/schedule");
    revalidatePath("/modification-requests");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to request modification",
    };
  }
}

/**
 * Resubmits the modified schedule to GRH, locking it again (spec §34).
 */
export async function resubmitScheduleAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = resubmitScheduleSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const user = await requireCapability("SCHEDULE_RESUBMIT");
    await resubmitSchedule(parsed.data.scheduleId, user.name || user.id);
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to resubmit schedule",
    };
  }
}

/**
 * Updates opening and closing hours for a park day (spec §16).
 * Gated on PARK_HOURS_EDIT capability and isEditable schedule status.
 */
export async function editParkHoursAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = editParkHoursSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await requireCapability("PARK_HOURS_EDIT");
    await saveParkHours(
      parsed.data.scheduleId,
      parsed.data.dayOfWeek,
      parsed.data.openTime,
      parsed.data.closeTime
    );
    revalidatePath("/schedule");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update park hours",
    };
  }
}


