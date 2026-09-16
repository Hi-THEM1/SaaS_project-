// components/attendance/AttendanceCell.tsx
"use client";

import { useState, useTransition } from "react";
import { type DayOfWeek } from "@/domain/schedule/service";
import {
  type AttendanceStatus,
  ATTENDANCE_STATUS_DISPLAY,
} from "@/domain/attendance/service";
import { saveAttendanceAction } from "@/actions/attendance";

interface AttendanceCellProps {
  scheduleId: string;
  userId: string;
  dayOfWeek: DayOfWeek;
  assignedCode: string | null;
  initialStatus: AttendanceStatus | null;
  canEdit: boolean;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; short: string }[] = [
  { value: "PRESENT", label: "Présent (Present)", short: "P" },
  { value: "LATE", label: "En retard (Late)", short: "R" },
  { value: "ABSENT", label: "Absent (Absent)", short: "A" },
  { value: "DAY_OFF", label: "Repos (Day Off)", short: "OFF" },
];

export function AttendanceCell({
  scheduleId,
  userId,
  dayOfWeek,
  assignedCode,
  initialStatus,
  canEdit,
}: AttendanceCellProps) {
  // Case 1: No assignment for this day (§41)
  // Employee has no scheduled assignment; renders no attendance cell and NEVER auto-marked Absent.
  const hasAssignment = Boolean(assignedCode && assignedCode.trim().length > 0);
  if (!hasAssignment) {
    return (
      <div
        id={`att-empty-${userId}-${dayOfWeek.toLowerCase()}`}
        className="flex h-10 w-full items-center justify-center text-xs font-mono text-slate-300"
        title="Non planifié ce jour (No assignment)"
      >
        —
      </div>
    );
  }

  // Case 2: Assigned code contains OFF (§40)
  // Automatically renders as DAY_OFF and is permanently not editable.
  const codes = (assignedCode || "")
    .split("/")
    .map((c) => c.trim().toUpperCase());
  const isOffCode = codes.includes("OFF");

  if (isOffCode) {
    const offMeta = ATTENDANCE_STATUS_DISPLAY.DAY_OFF;
    return (
      <div
        id={`att-off-${userId}-${dayOfWeek.toLowerCase()}`}
        className="flex h-10 w-full items-center justify-center"
        title="Planifié en Repos (Code OFF au planning)"
      >
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${offMeta.badgeClass}`}
        >
          {offMeta.label}
        </span>
      </div>
    );
  }

  const [status, setStatus] = useState<AttendanceStatus | null>(initialStatus);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Case 3: Read-only mode (§24 & Decision #5)
  // Previous weeks, read-only users, or users without ATTENDANCE_EDIT capability.
  if (!canEdit) {
    if (!status) {
      return (
        <div
          id={`att-ro-${userId}-${dayOfWeek.toLowerCase()}`}
          className="flex h-10 w-full items-center justify-center text-xs font-medium text-slate-400"
        >
          —
        </div>
      );
    }
    const meta = ATTENDANCE_STATUS_DISPLAY[status];
    return (
      <div
        id={`att-ro-${userId}-${dayOfWeek.toLowerCase()}`}
        className="flex h-10 w-full items-center justify-center"
      >
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${meta.badgeClass}`}
        >
          {meta.label}
        </span>
      </div>
    );
  }

  // Case 4: Editable view with optimistic update & rollback
  const handleSelectStatus = (newStatus: AttendanceStatus) => {
    setIsDropdownOpen(false);
    if (newStatus === status) return;

    const previousStatus = status;
    setStatus(newStatus);
    setError(null);

    startTransition(async () => {
      const res = await saveAttendanceAction({
        scheduleId,
        userId,
        dayOfWeek,
        status: newStatus,
      });

      if (!res.ok) {
        // Rollback optimistic state
        setStatus(previousStatus);
        setError(res.error);
      }
    });
  };

  const currentMeta = status
    ? ATTENDANCE_STATUS_DISPLAY[status]
    : {
        label: "Marquer...",
        short: "?",
        badgeClass: "bg-slate-50 text-slate-400 border-dashed border-slate-300 hover:border-slate-400",
      };

  return (
    <div className="relative flex h-10 w-full items-center justify-center p-1">
      <button
        type="button"
        id={`attendance-cell-${userId}-${dayOfWeek.toLowerCase()}`}
        disabled={isPending}
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className={`group flex items-center justify-center rounded px-2.5 py-1 text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
          currentMeta.badgeClass
        } ${isPending ? "opacity-50" : ""}`}
      >
        <span>{currentMeta.label}</span>
      </button>

      {error && (
        <span
          title={error}
          className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500"
        />
      )}

      {/* 4-Status Selector Dropdown (PRESENT, LATE, ABSENT, DAY_OFF) */}
      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute top-full z-30 mt-1 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                id={`opt-${opt.value.toLowerCase()}-${userId}-${dayOfWeek.toLowerCase()}`}
                onClick={() => handleSelectStatus(opt.value)}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  status === opt.value
                    ? "bg-slate-900 text-white font-bold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
