// auth/permissions.ts
import { auth } from "@/auth";

export type Role =
  | "GRH"
  | "MANAGER"
  | "ADMIN"
  | "SUPERVISOR"
  | "OPERATOR"
  | "OPERATOR_PILOT";

export const CAPABILITIES = [
  // Schedule
  "SCHEDULE_VIEW",
  "SCHEDULE_EDIT",
  "SCHEDULE_SUBMIT",
  "SCHEDULE_REQUEST_MODIFICATION",
  "SCHEDULE_RESUBMIT",
  // Park Hours
  "PARK_HOURS_EDIT",
  // Attendance
  "ATTENDANCE_VIEW",
  "ATTENDANCE_EDIT",
  // Accounts / Employees
  "ACCOUNTS_VIEW",
  "ACCOUNTS_MANAGE",
  // Working-Place Codes
  "WORKING_PLACE_CODES_VIEW",
  "WORKING_PLACE_CODES_MANAGE",
  // Modification Requests
  "MODIFICATION_REQUESTS_VIEW",
  "MODIFICATION_REQUESTS_AUTHORIZE",
  // Exports
  "EXPORTS_VIEW",
  "EXPORTS_SCHEDULE_PDF",
  "EXPORTS_SCHEDULE_EXCEL",
  "EXPORTS_ATTENDANCE_PDF",
  "EXPORTS_ATTENDANCE_EXCEL",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const MATRIX: Record<Role, readonly Capability[]> = {
  GRH: [
    "SCHEDULE_VIEW", // Read-only access to schedule (spec §4, §30, §51)
    "ACCOUNTS_VIEW",
    "ACCOUNTS_MANAGE",
    "MODIFICATION_REQUESTS_VIEW",
    "MODIFICATION_REQUESTS_AUTHORIZE",
  ],
  MANAGER: [
    "SCHEDULE_VIEW",
    "SCHEDULE_EDIT",
    "SCHEDULE_SUBMIT",
    "SCHEDULE_REQUEST_MODIFICATION",
    "SCHEDULE_RESUBMIT",
    "PARK_HOURS_EDIT",
    "ATTENDANCE_VIEW",
    "ATTENDANCE_EDIT",
    "ACCOUNTS_VIEW",
    "ACCOUNTS_MANAGE",
    "WORKING_PLACE_CODES_VIEW",
    "WORKING_PLACE_CODES_MANAGE",
    "MODIFICATION_REQUESTS_VIEW",
    "EXPORTS_VIEW",
    "EXPORTS_SCHEDULE_PDF",
    "EXPORTS_SCHEDULE_EXCEL",
    "EXPORTS_ATTENDANCE_PDF",
    "EXPORTS_ATTENDANCE_EXCEL",
  ],
  ADMIN: [
    "SCHEDULE_VIEW",
    "SCHEDULE_EDIT",
    "SCHEDULE_SUBMIT",
    "SCHEDULE_REQUEST_MODIFICATION",
    "SCHEDULE_RESUBMIT",
    "PARK_HOURS_EDIT",
    "ATTENDANCE_VIEW",
    "ATTENDANCE_EDIT",
    "ACCOUNTS_VIEW",
    "ACCOUNTS_MANAGE",
    "WORKING_PLACE_CODES_VIEW",
    "WORKING_PLACE_CODES_MANAGE",
    "MODIFICATION_REQUESTS_VIEW",
    "EXPORTS_VIEW",
    "EXPORTS_SCHEDULE_PDF",
    "EXPORTS_SCHEDULE_EXCEL",
    "EXPORTS_ATTENDANCE_PDF",
    "EXPORTS_ATTENDANCE_EXCEL",
  ],
  SUPERVISOR: [
    "SCHEDULE_VIEW",
    "SCHEDULE_EDIT",
    "SCHEDULE_SUBMIT",
    "SCHEDULE_REQUEST_MODIFICATION",
    "SCHEDULE_RESUBMIT",
    "PARK_HOURS_EDIT",
    "ATTENDANCE_VIEW",
    "ATTENDANCE_EDIT",
    "ACCOUNTS_VIEW",
    "ACCOUNTS_MANAGE",
    "WORKING_PLACE_CODES_VIEW",
    "WORKING_PLACE_CODES_MANAGE",
    "MODIFICATION_REQUESTS_VIEW",
    "EXPORTS_VIEW",
    "EXPORTS_SCHEDULE_PDF",
    "EXPORTS_SCHEDULE_EXCEL",
    "EXPORTS_ATTENDANCE_PDF",
    "EXPORTS_ATTENDANCE_EXCEL",
  ],
  OPERATOR: ["SCHEDULE_VIEW"],
  OPERATOR_PILOT: ["SCHEDULE_VIEW"],
};

export function hasCapability(role: Role, cap: Capability): boolean {
  const allowed = MATRIX[role];
  return allowed ? allowed.includes(cap) : false;
}

export function canManageAccount(actorRole: Role, targetRole: Role): boolean {
  switch (actorRole) {
    case "GRH":
      return targetRole === "ADMIN" || targetRole === "SUPERVISOR";
    case "MANAGER":
      return (
        targetRole === "ADMIN" ||
        targetRole === "SUPERVISOR" ||
        targetRole === "OPERATOR" ||
        targetRole === "OPERATOR_PILOT"
      );
    case "ADMIN":
    case "SUPERVISOR":
      return targetRole === "OPERATOR" || targetRole === "OPERATOR_PILOT";
    case "OPERATOR":
    case "OPERATOR_PILOT":
    default:
      return false;
  }
}

export async function requireCapability(cap: Capability): Promise<{
  id: string;
  name: string;
  role: Role;
}> {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.role) {
    throw new Error("Unauthorized: Authentication required");
  }
  const role = session.user.role as Role;
  if (!hasCapability(role, cap)) {
    throw new Error(`Forbidden: Role '${role}' lacks capability '${cap}'`);
  }
  return session.user as { id: string; name: string; role: Role };
}
