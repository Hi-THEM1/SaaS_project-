// lib/zod-schemas.ts
import { z } from "zod";

export const DayOfWeekEnum = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

export const saveAssignmentSchema = z.object({
  scheduleId: z.string().min(1, "Schedule ID is required"),
  userId: z.string().min(1, "User ID is required"),
  dayOfWeek: DayOfWeekEnum,
  codesSnapshot: z.string().default(""),
});

export const copyPreviousWeekSchema = z.object({
  targetScheduleId: z.string().min(1, "Target schedule ID is required"),
});

export const submitScheduleSchema = z.object({
  scheduleId: z.string().min(1, "Schedule ID is required"),
});

export const requestModificationSchema = z.object({
  scheduleId: z.string().min(1, "Schedule ID is required"),
  reason: z.string().min(3, "Please provide a reason for the modification request"),
});

export const resubmitScheduleSchema = z.object({
  scheduleId: z.string().min(1, "Schedule ID is required"),
});

export const editParkHoursSchema = z.object({
  scheduleId: z.string().min(1, "Schedule ID is required"),
  dayOfWeek: DayOfWeekEnum,
  openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid open time (HH:MM)"),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid close time (HH:MM)"),
});

export const AttendanceStatusEnum = z.enum([
  "PRESENT",
  "LATE",
  "ABSENT",
  "DAY_OFF",
]);

export const saveAttendanceSchema = z.object({
  scheduleId: z.string().min(1, "Schedule ID is required"),
  userId: z.string().min(1, "User ID is required"),
  dayOfWeek: DayOfWeekEnum,
  status: AttendanceStatusEnum,
});

export const createCodeSchema = z.object({
  code: z
    .string()
    .min(1, "Le code est obligatoire")
    .max(20, "Le code ne peut pas dépasser 20 caractères")
    .transform((val) => val.trim().toUpperCase()),
});

export const updateCodeSchema = z.object({
  id: z.string().min(1, "ID is required"),
  newCode: z
    .string()
    .min(1, "Le nouveau code est obligatoire")
    .max(20, "Le code ne peut pas dépasser 20 caractères")
    .transform((val) => val.trim().toUpperCase()),
});

export const deleteCodeSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const RoleEnum = z.enum([
  "GRH",
  "MANAGER",
  "ADMIN",
  "SUPERVISOR",
  "OPERATOR",
  "OPERATOR_PILOT",
]);

export const createUserSchema = z.object({
  name: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  username: z
    .string()
    .min(2, "L'identifiant doit comporter au moins 2 caractères")
    .trim()
    .toLowerCase(),
  password: z.string().min(4, "Le mot de passe doit comporter au moins 4 caractères"),
  role: RoleEnum,
});

export const editUserSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  username: z
    .string()
    .min(2, "L'identifiant doit comporter au moins 2 caractères")
    .trim()
    .toLowerCase(),
  role: RoleEnum,
});

export const suspendUserSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const reactivateUserSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const deleteUserSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const resetPasswordSchema = z.object({
  id: z.string().min(1, "ID is required"),
  newPassword: z
    .string()
    .min(4, "Le mot de passe doit comporter au moins 4 caractères"),
});

export const approveRequestSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
});

export const rejectRequestSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Veuillez saisir votre identifiant"),
  password: z.string().min(1, "Veuillez saisir votre mot de passe"),
});





