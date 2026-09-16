// components/schedule/ScheduleToolbar.tsx
"use client";

import { useState, useTransition } from "react";
import {
  isEventAllowed,
  ScheduleStatus,
  STATUS_DISPLAY,
} from "@/domain/schedule/state-machine";
import {
  copyPreviousWeekAction,
  requestModificationAction,
  resubmitScheduleAction,
  submitScheduleAction,
} from "@/actions/schedule";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

interface ScheduleToolbarProps {
  scheduleId: string;
  status: ScheduleStatus;
  canEdit: boolean;
  canSubmit: boolean;
  canRequestModification: boolean;
  canResubmit: boolean;
  weekLabel: string;
}

export function ScheduleToolbar({
  scheduleId,
  status,
  canEdit,
  canSubmit,
  canRequestModification,
  canResubmit,
  weekLabel,
}: ScheduleToolbarProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Request Modification Dialog state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [modificationReason, setModificationReason] = useState("");

  // Ask state machine for legality of each action (§28, §31, §32, §34)
  const isCopyAllowed = canEdit && isEventAllowed(status, "COPY_PREVIOUS_WEEK");
  const isSubmitAllowed = canSubmit && isEventAllowed(status, "SUBMIT");
  const isRequestModAllowed =
    canRequestModification && isEventAllowed(status, "REQUEST_MODIFICATION");
  const isResubmitAllowed = canResubmit && isEventAllowed(status, "RESUBMIT");

  const statusMeta = STATUS_DISPLAY[status] ?? {
    label: status,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  };

  const handleCopyPreviousWeek = () => {
    setError(null);
    if (!confirm("Are you sure you want to copy assignments from the previous week? Current week assignments will be overwritten.")) {
      return;
    }
    startTransition(async () => {
      const res = await copyPreviousWeekAction({ targetScheduleId: scheduleId });
      if (!res.ok) {
        setError(res.error);
      }
    });
  };

  const handleSubmitSchedule = () => {
    setError(null);
    if (!confirm("Send schedule to GRH? Once submitted, the schedule will be locked.")) {
      return;
    }
    startTransition(async () => {
      const res = await submitScheduleAction({ scheduleId });
      if (!res.ok) {
        setError(res.error);
      }
    });
  };

  const handleRequestModification = () => {
    if (!modificationReason.trim()) {
      setError("Please enter a valid reason for the modification request.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await requestModificationAction({
        scheduleId,
        reason: modificationReason.trim(),
      });
      if (res.ok) {
        setIsRequestModalOpen(false);
        setModificationReason("");
      } else {
        setError(res.error);
      }
    });
  };

  const handleResubmitSchedule = () => {
    setError(null);
    if (!confirm("Resubmit schedule to GRH? The schedule will lock automatically.")) {
      return;
    }
    startTransition(async () => {
      const res = await resubmitScheduleAction({ scheduleId });
      if (!res.ok) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-3 my-4">
      {/* Top Banner: Week label & Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <h2
            className="text-lg sm:text-xl font-bold text-slate-900"
            id="schedule-week-range"
          >
            {weekLabel}
          </h2>
          {/* Status Banner per prompt requirement */}
          <span
            id="schedule-status-banner"
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${statusMeta.badgeClass}`}
          >
            {statusMeta.label}
          </span>
        </div>

        {/* Action Buttons: Rendered only when state machine permits */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Previous Week (§28) */}
          {isCopyAllowed && (
            <Button
              id="schedule-copy-prev-btn"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleCopyPreviousWeek}
            >
              {isPending ? "Copying..." : "Copy Previous Week"}
            </Button>
          )}

          {/* Send to GRH (§31) */}
          {isSubmitAllowed && (
            <Button
              id="schedule-send-grh-btn"
              variant="default"
              size="sm"
              disabled={isPending}
              onClick={handleSubmitSchedule}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPending ? "Submitting..." : "Send to GRH"}
            </Button>
          )}

          {/* Request Modification (§32) */}
          {isRequestModAllowed && (
            <Button
              id="schedule-request-mod-btn"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setError(null);
                setIsRequestModalOpen(true);
              }}
              className="border-amber-400 text-amber-900 hover:bg-amber-50"
            >
              Request Modification
            </Button>
          )}

          {/* Resubmit (§34) */}
          {isResubmitAllowed && (
            <Button
              id="schedule-resubmit-btn"
              variant="default"
              size="sm"
              disabled={isPending}
              onClick={handleResubmitSchedule}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending ? "Resubmitting..." : "Resubmit"}
            </Button>
          )}
        </div>
      </div>

      {/* Error Feedback Banner */}
      {error && (
        <div
          id="schedule-toolbar-error"
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center justify-between"
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-xs font-semibold ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Request Modification Dialog (§32, §35) */}
      <Dialog open={isRequestModAllowed && isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogHeader>
          <DialogTitle>Request Schedule Modification</DialogTitle>
          <DialogDescription>
            This schedule is locked. GRH must authorize reopening it before any changes can be made.
            Please state why modifications are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <label
            htmlFor="modification-reason-input"
            className="text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Reason for Modification
          </label>
          <textarea
            id="modification-reason-input"
            rows={3}
            value={modificationReason}
            onChange={(e) => setModificationReason(e.target.value)}
            placeholder="e.g. Operator illness requires shift reassignments on Friday and Saturday..."
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRequestModalOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            id="dialog-submit-request-btn"
            size="sm"
            disabled={isPending || !modificationReason.trim()}
            onClick={handleRequestModification}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isPending ? "Submitting Request..." : "Submit Request to GRH"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
