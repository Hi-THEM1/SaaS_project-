// components/schedule/ScheduleGrid.tsx
import { type DayOfWeek, DAYS_OF_WEEK } from "@/domain/schedule/service";
import { EditableCell } from "./EditableCell";
import { ParkHoursEditor, type ParkHourItem } from "./ParkHoursEditor";
import { FRENCH_DAYS } from "@/lib/utils";

interface WorkforceUser {
  id: string;
  name: string;
  role: string;
}

interface AssignmentData {
  userId: string;
  dayOfWeek: DayOfWeek;
  codesSnapshot: string;
}

interface ScheduleGridProps {
  scheduleId: string;
  workforce: WorkforceUser[];
  assignments: AssignmentData[];
  parkHours: ParkHourItem[];
  activeCodes: string[];
  canEdit: boolean;
}

const ROLE_BADGES: Record<string, { label: string; badgeClass: string }> = {
  ADMIN: { label: "ADM", badgeClass: "bg-emerald-100 text-emerald-800" },
  SUPERVISOR: { label: "SUP", badgeClass: "bg-amber-100 text-amber-800" },
  OPERATOR: { label: "OP", badgeClass: "bg-slate-100 text-slate-700" },
  OPERATOR_PILOT: { label: "PIL", badgeClass: "bg-cyan-100 text-cyan-800" },
};

export function ScheduleGrid({
  scheduleId,
  workforce,
  assignments,
  parkHours,
  activeCodes,
  canEdit,
}: ScheduleGridProps) {
  // Map assignments for O(1) cell lookup
  const assignmentMap = new Map<string, string>();
  for (const a of assignments) {
    assignmentMap.set(`${a.userId}-${a.dayOfWeek}`, a.codesSnapshot);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Schedule Table with Sticky First Two Columns (Decision #9) */}
      <div className="relative overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-700">
              {/* Column 1: Sticky Employee Name */}
              <th
                scope="col"
                className="sticky left-0 z-20 min-w-[160px] bg-slate-50 px-4 py-3 border-r border-slate-200 shadow-[1px_0_0_0_rgba(226,232,240,1)]"
              >
                Employé (Worker)
              </th>
              {/* Column 2: Sticky Role Badge */}
              <th
                scope="col"
                className="sticky left-[160px] z-20 min-w-[80px] bg-slate-50 px-3 py-3 text-center border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
              >
                Rôle
              </th>
              {/* 7 Days of the Week (Monday - Sunday) */}
              {FRENCH_DAYS.map((day) => (
                <th
                  key={day.key}
                  scope="col"
                  className="min-w-[110px] px-3 py-3 text-center border-r border-slate-100 last:border-r-0"
                >
                  <div className="font-bold">{day.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {day.short}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {workforce.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  Aucun employé actif trouvé pour le planning.
                </td>
              </tr>
            ) : (
              workforce.map((employee) => {
                const roleMeta = ROLE_BADGES[employee.role] ?? {
                  label: employee.role,
                  badgeClass: "bg-slate-100 text-slate-700",
                };

                return (
                  <tr
                    key={employee.id}
                    id={`schedule-row-${employee.id}`}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Sticky Employee Name */}
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 font-medium text-slate-900 border-r border-slate-200 shadow-[1px_0_0_0_rgba(226,232,240,1)] whitespace-nowrap">
                      {employee.name}
                    </td>

                    {/* Sticky Role */}
                    <td className="sticky left-[160px] z-10 bg-white px-3 py-2 text-center border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${roleMeta.badgeClass}`}
                      >
                        {roleMeta.label}
                      </span>
                    </td>

                    {/* 7 Day Assignment Cells */}
                    {DAYS_OF_WEEK.map((day) => {
                      const code =
                        assignmentMap.get(`${employee.id}-${day}`) || "";

                      return (
                        <td
                          key={day}
                          className="px-1 py-1 border-r border-slate-100 last:border-r-0"
                        >
                          <EditableCell
                            scheduleId={scheduleId}
                            userId={employee.id}
                            dayOfWeek={day}
                            initialCode={code}
                            canEdit={canEdit}
                            activeCodes={activeCodes}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Park Hours Row/Section per week (§16 & Decision #8) */}
      <ParkHoursEditor
        scheduleId={scheduleId}
        initialHours={parkHours}
        canEdit={canEdit}
      />
    </div>
  );
}
