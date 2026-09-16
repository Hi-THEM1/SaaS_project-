// domain/attendance/service.ts
import { prisma } from "@/lib/prisma";
import { type DayOfWeek, getWeekWindow } from "@/domain/schedule/service";

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "DAY_OFF";

export const ATTENDANCE_STATUS_DISPLAY: Record<
  AttendanceStatus,
  { label: string; short: string; badgeClass: string }
> = {
  PRESENT: {
    label: "Présent",
    short: "P",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  LATE: {
    label: "En retard",
    short: "R",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  ABSENT: {
    label: "Absent",
    short: "A",
    badgeClass: "bg-red-100 text-red-800 border-red-300",
  },
  DAY_OFF: {
    label: "Repos",
    short: "OFF",
    badgeClass: "bg-slate-150 text-slate-600 border-slate-300 bg-slate-100",
  },
};

/**
 * Checks if a schedule's week is in the past (previous week) per spec §24.
 * Previous weeks are strictly read-only.
 */
export function isPreviousWeek(weekStartDate: Date): boolean {
  const { monday: currentMonday } = getWeekWindow(new Date());
  return new Date(weekStartDate).getTime() < currentMonday.getTime();
}

/**
 * Saves or updates an attendance record.
 * Enforces business rules:
 * - Previous weeks are read-only (§24)
 * - Requires existing scheduled assignment for that day (§39, §41)
 * - Prohibits manual override if schedule contains code 'OFF' (§40)
 */
export async function saveAttendance(
  scheduleId: string,
  userId: string,
  dayOfWeek: DayOfWeek,
  status: AttendanceStatus
) {
  const schedule = await prisma.weeklySchedule.findUnique({
    where: { id: scheduleId },
    include: {
      assignments: {
        where: { userId, dayOfWeek },
      },
    },
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  // Rule 1: Previous weeks are strictly read-only (§24)
  if (isPreviousWeek(schedule.weekStartDate)) {
    throw new Error("Cannot modify attendance for previous weeks (read-only)");
  }

  // Rule 2: Employee must have a scheduled assignment that day (§39, §41)
  const assignment = schedule.assignments[0];
  if (!assignment || !assignment.codesSnapshot.trim()) {
    throw new Error(
      "Cannot record attendance: employee has no schedule assignment for this day"
    );
  }

  // Rule 3: OFF code auto-renders as DAY_OFF and cannot be manually modified (§40)
  const codes = assignment.codesSnapshot.split("/").map((c) => c.trim().toUpperCase());
  if (codes.includes("OFF")) {
    throw new Error(
      "Attendance for scheduled 'OFF' is permanently locked as DAY_OFF"
    );
  }

  return prisma.attendanceRecord.upsert({
    where: {
      scheduleId_userId_dayOfWeek: {
        scheduleId,
        userId,
        dayOfWeek,
      },
    },
    update: {
      status,
    },
    create: {
      scheduleId,
      userId,
      dayOfWeek,
      status,
    },
  });
}
