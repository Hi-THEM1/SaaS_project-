// app/(dashboard)/attendance/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasCapability, type Role } from "@/auth/permissions";
import {
  getOrCreateEditableWeek,
  listWorkforce,
} from "@/domain/schedule/service";
import { isPreviousWeek } from "@/domain/attendance/service";
import { formatWeekRangeFrench } from "@/lib/utils";
import { AttendanceGrid } from "@/components/attendance/AttendanceGrid";

interface AttendancePageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function AttendancePage({
  searchParams,
}: AttendancePageProps) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const role = session.user.role as Role;

  // Gated on ATTENDANCE_VIEW capability
  if (!hasCapability(role, "ATTENDANCE_VIEW")) {
    redirect("/schedule");
  }

  const { week } = await searchParams;
  const targetDate = week ? new Date(week) : new Date();

  // Load schedule for target week with assignments and attendance records
  const schedule = await getOrCreateEditableWeek(targetDate);
  const workforce = await listWorkforce();

  // Rule 1: Previous weeks render strictly read-only (§24)
  const isPastWeek = isPreviousWeek(schedule.weekStartDate);
  const canEdit = hasCapability(role, "ATTENDANCE_EDIT") && !isPastWeek;

  // Rule 2: Attendance rows exist ONLY for employees with a schedule assignment that week (§39)
  const assignedUserIds = new Set(
    schedule.assignments
      .filter((a) => a.codesSnapshot && a.codesSnapshot.trim().length > 0)
      .map((a) => a.userId)
  );

  const eligibleEmployees = workforce.filter((emp) =>
    assignedUserIds.has(emp.id)
  );

  // Week navigation calculation (identical to schedule slice)
  const currentMonday = new Date(schedule.weekStartDate);

  const prevMonday = new Date(currentMonday);
  prevMonday.setDate(prevMonday.getDate() - 7);
  const prevWeekParam = prevMonday.toISOString().split("T")[0];

  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const nextWeekParam = nextMonday.toISOString().split("T")[0];

  const weekLabel = formatWeekRangeFrench(
    new Date(schedule.weekStartDate),
    new Date(schedule.weekEndDate)
  );

  // Calculate summary metrics for the header
  const presentCount = schedule.attendanceRecords.filter(
    (r) => r.status === "PRESENT"
  ).length;
  const lateCount = schedule.attendanceRecords.filter(
    (r) => r.status === "LATE"
  ).length;
  const absentCount = schedule.attendanceRecords.filter(
    (r) => r.status === "ABSENT"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header & Week Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Suivi des Présences (Attendance Management)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion hebdomadaire des statuts de présence pour les employés planifiés (§36–§42).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            id="btn-att-prev-week"
            href={`/attendance?week=${prevWeekParam}`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Semaine précédente
          </Link>
          <Link
            id="btn-att-current-week"
            href="/attendance"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Semaine actuelle
          </Link>
          <Link
            id="btn-att-next-week"
            href={`/attendance?week=${nextWeekParam}`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Semaine suivante →
          </Link>
        </div>
      </div>

      {/* Week banner & Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <h2
            className="text-lg sm:text-xl font-bold text-slate-900"
            id="attendance-week-range"
          >
            {weekLabel}
          </h2>
          {isPastWeek ? (
            <span
              id="attendance-past-badge"
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300"
            >
              Semaine Passée · Lecture Seule (§24)
            </span>
          ) : (
            <span
              id="attendance-active-badge"
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300"
            >
              Semaine Active · Saisie Autorisée
            </span>
          )}
        </div>

        {/* Quick Counters */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Présents:</span>
            <span className="text-slate-900 font-bold">{presentCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600">Retards:</span>
            <span className="text-slate-900 font-bold">{lateCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-slate-600">Absents:</span>
            <span className="text-slate-900 font-bold">{absentCount}</span>
          </div>
        </div>
      </div>

      {/* Attendance Grid */}
      <AttendanceGrid
        scheduleId={schedule.id}
        eligibleEmployees={eligibleEmployees}
        assignments={schedule.assignments.map((a) => ({
          userId: a.userId,
          dayOfWeek: a.dayOfWeek as any,
          codesSnapshot: a.codesSnapshot,
        }))}
        attendanceRecords={schedule.attendanceRecords.map((r) => ({
          userId: r.userId,
          dayOfWeek: r.dayOfWeek as any,
          status: r.status as any,
        }))}
        canEdit={canEdit}
      />
    </div>
  );
}
