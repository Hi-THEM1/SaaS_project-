// actions/attendance.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/auth/permissions";
import { saveAttendanceSchema } from "@/lib/zod-schemas";
import { saveAttendance } from "@/domain/attendance/service";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Saves or updates an employee's daily attendance record (spec §37-§41).
 * Gated on ATTENDANCE_EDIT capability.
 */
export async function saveAttendanceAction(
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = saveAttendanceSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid attendance input",
    };
  }

  try {
    await requireCapability("ATTENDANCE_EDIT");
    await saveAttendance(
      parsed.data.scheduleId,
      parsed.data.userId,
      parsed.data.dayOfWeek,
      parsed.data.status
    );
    revalidatePath("/attendance");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to record attendance",
    };
  }
}
