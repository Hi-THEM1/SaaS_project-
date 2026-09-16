// domain/schedule/state-machine.ts
export type ScheduleStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "REOPEN_REQUESTED"
  | "REOPEN_AUTHORIZED";

export type ScheduleEvent =
  | "SUBMIT"
  | "REQUEST_MODIFICATION"
  | "APPROVE_REOPEN"
  | "REJECT_REOPEN"
  | "RESUBMIT"
  | "COPY_PREVIOUS_WEEK"
  | "SAVE_ASSIGNMENT"
  | "EDIT_PARK_HOURS";

export const STATUS_DISPLAY: Record<
  ScheduleStatus,
  { label: string; badgeClass: string }
> = {
  DRAFT: {
    label: "DRAFT",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  },
  SUBMITTED: {
    label: "SUBMITTED · LOCKED",
    badgeClass: "bg-red-100 text-red-800 border-red-300",
  },
  REOPEN_REQUESTED: {
    label: "REOPEN REQUESTED",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  REOPEN_AUTHORIZED: {
    label: "REOPEN AUTHORIZED",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
};

/**
 * Returns true only when a schedule can be edited (spec §30-§34).
 * True ONLY for DRAFT and REOPEN_AUTHORIZED.
 */
export function isEditable(status: ScheduleStatus): boolean {
  return status === "DRAFT" || status === "REOPEN_AUTHORIZED";
}

/**
 * Checks whether an event transition is legal for the current status.
 */
export function isEventAllowed(
  status: ScheduleStatus,
  event: ScheduleEvent
): boolean {
  switch (event) {
    case "SUBMIT":
      return status === "DRAFT";
    case "REQUEST_MODIFICATION":
      return status === "SUBMITTED";
    case "APPROVE_REOPEN":
      return status === "REOPEN_REQUESTED";
    case "REJECT_REOPEN":
      return status === "REOPEN_REQUESTED";
    case "RESUBMIT":
      return status === "REOPEN_AUTHORIZED";
    case "COPY_PREVIOUS_WEEK":
    case "SAVE_ASSIGNMENT":
    case "EDIT_PARK_HOURS":
      return isEditable(status);
    default:
      return false;
  }
}

/**
 * Asserts that an event transition is legal, throwing if illegal.
 */
export function assertEventAllowed(
  status: ScheduleStatus,
  event: ScheduleEvent
): void {
  if (!isEventAllowed(status, event)) {
    throw new Error(
      `Illegal schedule transition: event '${event}' is not allowed in status '${status}'`
    );
  }
}

/**
 * Returns the next status for a given legal transition.
 */
export function nextStatus(
  status: ScheduleStatus,
  event: ScheduleEvent
): ScheduleStatus {
  assertEventAllowed(status, event);

  switch (event) {
    case "SUBMIT":
      return "SUBMITTED";
    case "REQUEST_MODIFICATION":
      return "REOPEN_REQUESTED";
    case "APPROVE_REOPEN":
      return "REOPEN_AUTHORIZED";
    case "REJECT_REOPEN":
      return "SUBMITTED";
    case "RESUBMIT":
      return "SUBMITTED";
    case "COPY_PREVIOUS_WEEK":
    case "SAVE_ASSIGNMENT":
    case "EDIT_PARK_HOURS":
      return status;
    default:
      return status;
  }
}
