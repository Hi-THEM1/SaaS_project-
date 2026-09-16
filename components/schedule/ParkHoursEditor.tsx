// components/schedule/ParkHoursEditor.tsx
"use client";

import { useState, useTransition } from "react";
import { type DayOfWeek, DAYS_OF_WEEK } from "@/domain/schedule/service";
import { editParkHoursAction } from "@/actions/schedule";
import { FRENCH_DAYS } from "@/lib/utils";

export interface ParkHourItem {
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
}

interface ParkHoursEditorProps {
  scheduleId: string;
  initialHours: ParkHourItem[];
  canEdit: boolean;
}

export function ParkHoursEditor({
  scheduleId,
  initialHours,
  canEdit,
}: ParkHoursEditorProps) {
  // Normalize initial hours to guarantee all 7 days exist
  const normalizedInitial = DAYS_OF_WEEK.reduce<Record<DayOfWeek, { openTime: string; closeTime: string }>>(
    (acc, day) => {
      const existing = initialHours.find((h) => h.dayOfWeek === day);
      acc[day] = {
        openTime: existing?.openTime || "10:00",
        closeTime: existing?.closeTime || "18:00",
      };
      return acc;
    },
    {} as Record<DayOfWeek, { openTime: string; closeTime: string }>
  );

  const [hoursState, setHoursState] = useState(normalizedInitial);
  const [isPending, startTransition] = useTransition();
  const [savingDay, setSavingDay] = useState<DayOfWeek | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccessDay, setSavedSuccessDay] = useState<DayOfWeek | null>(null);

  // READ-ONLY VIEW (Spec §16 & Prompt Decisions #5, #8)
  // When canEdit is false (operators, locked schedules):
  // Renders IDENTICAL plain-text markup with ZERO interactive input components mounted.
  if (!canEdit) {
    return (
      <div
        id="park-hours-readonly-section"
        className="my-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Horaires d&apos;Ouverture du Parc (Park Working Hours)
          </h3>
          <span className="text-xs text-slate-400 font-medium">Lecture seule / Read-only</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
          {FRENCH_DAYS.map((day) => {
            const dayHours = hoursState[day.key as DayOfWeek];
            return (
              <div
                key={day.key}
                id={`park-hours-readonly-${day.key.toLowerCase()}`}
                className="flex flex-col rounded-lg bg-slate-50 p-2.5 border border-slate-150 text-center"
              >
                <span className="text-xs font-semibold text-slate-600">
                  {day.label}
                </span>
                <span className="mt-1 text-sm font-bold font-mono text-slate-900">
                  {dayHours.openTime} – {dayHours.closeTime}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // EDITABLE VIEW (Spec §16 & Prompt Decision #8)
  // Gated on canEdit === true. One time-input pair per day.
  const handleTimeChange = (
    day: DayOfWeek,
    field: "openTime" | "closeTime",
    value: string
  ) => {
    setHoursState((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSaveDay = (day: DayOfWeek) => {
    const current = hoursState[day];
    setError(null);
    setSavingDay(day);

    startTransition(async () => {
      const res = await editParkHoursAction({
        scheduleId,
        dayOfWeek: day,
        openTime: current.openTime,
        closeTime: current.closeTime,
      });

      setSavingDay(null);
      if (res.ok) {
        setSavedSuccessDay(day);
        setTimeout(() => setSavedSuccessDay(null), 2000);
      } else {
        setError(res.error);
        // Rollback to original if needed
        const prev = initialHours.find((h) => h.dayOfWeek === day);
        if (prev) {
          setHoursState((p) => ({
            ...p,
            [day]: { openTime: prev.openTime, closeTime: prev.closeTime },
          }));
        }
      }
    });
  };

  return (
    <div
      id="park-hours-editor-section"
      className="my-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Définir les Horaires du Parc (Park Working Hours)
          </h3>
          <p className="text-xs text-slate-500">
            Horaires applicables à l&apos;ensemble du parc pour chaque jour de la semaine.
          </p>
        </div>
        {error && (
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
            {error}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        {FRENCH_DAYS.map((day) => {
          const dayKey = day.key as DayOfWeek;
          const current = hoursState[dayKey];
          const isCurrentSaving = isPending && savingDay === dayKey;
          const isJustSaved = savedSuccessDay === dayKey;

          return (
            <div
              key={day.key}
              id={`park-hours-card-${day.key.toLowerCase()}`}
              className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/70 p-3 transition-colors hover:border-slate-300"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                  {day.label}
                </span>
                {isCurrentSaving ? (
                  <span className="text-[10px] text-indigo-600 font-medium animate-pulse">
                    Sauvegarde...
                  </span>
                ) : isJustSaved ? (
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    ✓ Enregistré
                  </span>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <div>
                  <label
                    htmlFor={`park-hours-open-${day.key.toLowerCase()}`}
                    className="block text-[10px] font-semibold text-slate-500 uppercase"
                  >
                    Ouverture
                  </label>
                  <input
                    id={`park-hours-open-${day.key.toLowerCase()}`}
                    type="time"
                    value={current.openTime}
                    disabled={isPending}
                    onChange={(e) =>
                      handleTimeChange(dayKey, "openTime", e.target.value)
                    }
                    onBlur={() => handleSaveDay(dayKey)}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-mono font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`park-hours-close-${day.key.toLowerCase()}`}
                    className="block text-[10px] font-semibold text-slate-500 uppercase"
                  >
                    Fermeture
                  </label>
                  <input
                    id={`park-hours-close-${day.key.toLowerCase()}`}
                    type="time"
                    value={current.closeTime}
                    disabled={isPending}
                    onChange={(e) =>
                      handleTimeChange(dayKey, "closeTime", e.target.value)
                    }
                    onBlur={() => handleSaveDay(dayKey)}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs font-mono font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
