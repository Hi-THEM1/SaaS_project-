// app/(dashboard)/schedule/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasCapability, type Role } from "@/auth/permissions";
import { isEditable, type ScheduleStatus } from "@/domain/schedule/state-machine";
import {
  getOrCreateEditableWeek,
  listWorkforce,
} from "@/domain/schedule/service";
import { prisma } from "@/lib/prisma";
import { formatWeekRangeFrench } from "@/lib/utils";
import { ScheduleToolbar } from "@/components/schedule/ScheduleToolbar";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";

interface SchedulePageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function SchedulePage({
  searchParams,
}: SchedulePageProps) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const { week } = await searchParams;
  const targetDate = week ? new Date(week) : new Date();

  // Load schedule data, active workforce & active working place codes
  const schedule = await getOrCreateEditableWeek(targetDate);
  const workforce = await listWorkforce();
  const activeCodes = await prisma.workingPlaceCode.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  // Editability computed ONCE in page via permissions.ts & state-machine.ts (Decision #4)
  const role = session.user.role as Role;
  const scheduleStatus = schedule.status as ScheduleStatus;
  const editableStatus = isEditable(scheduleStatus);

  const canEdit = hasCapability(role, "SCHEDULE_EDIT") && editableStatus;
  const canSubmit = hasCapability(role, "SCHEDULE_SUBMIT");
  const canRequestModification = hasCapability(
    role,
    "SCHEDULE_REQUEST_MODIFICATION"
  );
  const canResubmit = hasCapability(role, "SCHEDULE_RESUBMIT");

  // Week navigation calculation (§23-§26, §46)
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

  return (
    <div className="space-y-6">
      {/* Header & Week Navigation Controls (§46) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Planning Hebdomadaire (Weekly Schedule)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestion centralisée des plannings et affectations des postes de travail.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            id="btn-prev-week"
            href={`/schedule?week=${prevWeekParam}`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Semaine précédente
          </Link>
          <Link
            id="btn-current-week"
            href="/schedule"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Semaine actuelle
          </Link>
          <Link
            id="btn-next-week"
            href={`/schedule?week=${nextWeekParam}`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Semaine suivante →
          </Link>
        </div>
      </div>

      {/* Schedule Toolbar (Status banner + state-machine gated action buttons) */}
      <ScheduleToolbar
        scheduleId={schedule.id}
        status={scheduleStatus}
        canEdit={canEdit}
        canSubmit={canSubmit}
        canRequestModification={canRequestModification}
        canResubmit={canResubmit}
        weekLabel={weekLabel}
      />

      {/* Schedule Grid with sticky columns & integrated ParkHoursEditor */}
      <ScheduleGrid
        scheduleId={schedule.id}
        workforce={workforce}
        assignments={schedule.assignments.map((a) => ({
          userId: a.userId,
          dayOfWeek: a.dayOfWeek as any,
          codesSnapshot: a.codesSnapshot,
        }))}
        parkHours={schedule.parkHours.map((h) => ({
          dayOfWeek: h.dayOfWeek as any,
          openTime: h.openTime,
          closeTime: h.closeTime,
        }))}
        activeCodes={activeCodes.map((c) => c.code)}
        canEdit={canEdit}
      />
    </div>
  );
}
