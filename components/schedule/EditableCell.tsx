// components/schedule/EditableCell.tsx
"use client";

import { useState, useTransition } from "react";
import { type DayOfWeek } from "@/domain/schedule/service";
import { saveAssignmentAction } from "@/actions/schedule";

interface EditableCellProps {
  scheduleId: string;
  userId: string;
  dayOfWeek: DayOfWeek;
  initialCode: string;
  canEdit: boolean;
  activeCodes?: string[];
}

export function EditableCell({
  scheduleId,
  userId,
  dayOfWeek,
  initialCode,
  canEdit,
  activeCodes = [],
}: EditableCellProps) {
  const [code, setCode] = useState(initialCode);
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(initialCode);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // READ-ONLY VIEW (Prompt Decision #5 & Spec §47)
  // Read-only users and locked schedules must render IDENTICAL plain markup with ZERO interactive components mounted.
  if (!canEdit) {
    return (
      <div
        id={`cell-ro-${userId}-${dayOfWeek.toLowerCase()}`}
        className="px-2 py-2 text-center text-xs font-semibold font-mono text-slate-800"
      >
        {code || "—"}
      </div>
    );
  }

  // EDITABLE VIEW
  const handleSave = (newValue: string) => {
    const formatted = newValue.trim().toUpperCase();
    setIsEditing(false);
    if (formatted === code) return;

    const previousCode = code;
    setCode(formatted);
    setError(null);

    startTransition(async () => {
      const res = await saveAssignmentAction({
        scheduleId,
        userId,
        dayOfWeek,
        codesSnapshot: formatted,
      });

      if (!res.ok) {
        // Rollback optimistic update
        setCode(previousCode);
        setError(res.error);
      }
    });
  };

  if (isEditing) {
    return (
      <div className="relative p-1">
        <input
          id={`cell-input-${userId}-${dayOfWeek.toLowerCase()}`}
          type="text"
          autoFocus
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value.toUpperCase())}
          onBlur={() => handleSave(tempValue)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave(tempValue);
            if (e.key === "Escape") {
              setTempValue(code);
              setIsEditing(false);
            }
          }}
          placeholder="RR/FR"
          className="w-full rounded border border-indigo-500 bg-white px-1.5 py-1 text-center text-xs font-mono font-bold text-slate-900 shadow-sm focus:outline-none"
        />
        {/* Quick code dropdown helper if active codes exist */}
        {activeCodes.length > 0 && (
          <div className="absolute left-0 top-full z-20 mt-1 max-h-32 w-32 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">
            <div
              onMouseDown={() => handleSave("")}
              className="cursor-pointer rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-100"
            >
              (Clear)
            </div>
            {activeCodes.map((c) => (
              <div
                key={c}
                onMouseDown={() => handleSave(c)}
                className="cursor-pointer rounded px-1.5 py-0.5 text-xs font-mono font-medium hover:bg-indigo-50 hover:text-indigo-700"
              >
                {c}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      id={`cell-btn-${userId}-${dayOfWeek.toLowerCase()}`}
      onClick={() => {
        setTempValue(code);
        setIsEditing(true);
      }}
      disabled={isPending}
      className={`group relative flex h-full min-h-[38px] w-full items-center justify-center rounded px-2 py-1.5 text-center text-xs font-mono font-semibold transition-all hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-300 ${
        isPending ? "opacity-50" : ""
      } ${
        code === "OFF"
          ? "bg-slate-100 text-slate-500"
          : code
          ? "text-slate-900 font-bold"
          : "text-slate-300"
      }`}
    >
      <span>{code || "+"}</span>
      {error && (
        <span
          title={error}
          className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-red-500"
        />
      )}
    </button>
  );
}
