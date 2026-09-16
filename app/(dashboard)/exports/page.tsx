// app/(dashboard)/exports/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasCapability, type Role } from "@/auth/permissions";
import { getOrCreateEditableWeek } from "@/domain/schedule/service";
import { formatWeekRangeFrench } from "@/lib/utils";

interface ExportsPageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function ExportsPage({ searchParams }: ExportsPageProps) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const role = session.user.role as Role;

  // Gated on EXPORTS_VIEW capability
  if (!hasCapability(role, "EXPORTS_VIEW")) {
    redirect("/schedule");
  }

  const { week } = await searchParams;
  const targetDate = week ? new Date(week) : new Date();
  const schedule = await getOrCreateEditableWeek(targetDate);

  // Week navigation calculation
  const currentMonday = new Date(schedule.weekStartDate);
  const weekParam = currentMonday.toISOString().split("T")[0];

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

  // Check specific export capabilities
  const canExportSchedulePdf = hasCapability(role, "EXPORTS_SCHEDULE_PDF");
  const canExportScheduleExcel = hasCapability(role, "EXPORTS_SCHEDULE_EXCEL");
  const canExportAttendancePdf = hasCapability(role, "EXPORTS_ATTENDANCE_PDF");
  const canExportAttendanceExcel = hasCapability(role, "EXPORTS_ATTENDANCE_EXCEL");

  return (
    <div className="space-y-6">
      {/* Header & Week Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Exports Documentaires (Reports & Exports)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Téléchargement des plannings et registres de présence aux formats PDF et Excel (§43, §44).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            id="btn-exports-prev-week"
            href={`/exports?week=${prevWeekParam}`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Semaine précédente
          </Link>
          <Link
            id="btn-exports-current-week"
            href="/exports"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Semaine actuelle
          </Link>
          <Link
            id="btn-exports-next-week"
            href={`/exports?week=${nextWeekParam}`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Semaine suivante →
          </Link>
        </div>
      </div>

      {/* Week banner */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Semaine sélectionnée pour export
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">{weekLabel}</h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Les exports restituent les instantanés figés des codes (§50).
        </span>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Exports Planning (§43) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm">
                PL
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Exports du Planning Hebdomadaire (§43)
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Téléchargez le planning officiel de la semaine incluant les affectations des employés
              et les horaires d&apos;ouverture du parc.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {canExportSchedulePdf && (
              <a
                id="export-schedule-pdf-btn"
                href={`/api/exports/schedule/pdf?week=${weekParam}`}
                download
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
              >
                📄 Télécharger PDF
              </a>
            )}

            {canExportScheduleExcel && (
              <a
                id="export-schedule-excel-btn"
                href={`/api/exports/schedule/excel?week=${weekParam}`}
                download
                className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition-colors"
              >
                📊 Télécharger Excel (.xls)
              </a>
            )}
          </div>
        </div>

        {/* Section 2: Exports Présences (§44) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-bold text-sm">
                PR
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Exports du Registre de Présence (§44)
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Téléchargez le relevé hebdomadaire des présences, retards, absences et jours de repos
              pour les employés planifiés.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {canExportAttendancePdf && (
              <a
                id="export-attendance-pdf-btn"
                href={`/api/exports/attendance/pdf?week=${weekParam}`}
                download
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
              >
                📄 Télécharger PDF
              </a>
            )}

            {canExportAttendanceExcel && (
              <a
                id="export-attendance-excel-btn"
                href={`/api/exports/attendance/excel?week=${weekParam}`}
                download
                className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition-colors"
              >
                📊 Télécharger Excel (.xls)
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
