// domain/schedule/service.ts
import { prisma } from "@/lib/prisma";
import {
  assertEventAllowed,
  isEditable,
  ScheduleStatus,
} from "./state-machine";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

/**
 * Clean & freeze codes into snapshot string. Never stores a foreign key.
 */
export function freezeCodes(codes: string): string {
  if (!codes) return "";
  return codes
    .split("/")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
    .join("/");
}

/**
 * Returns active workforce employees appearing in the schedule.
 * Per spec §14 & prompt: ACTIVE users only; GRH and MANAGER are excluded.
 */
export async function listWorkforce() {
  return prisma.user.findMany({
    where: {
      status: "ACTIVE",
      role: {
        notIn: ["GRH", "MANAGER"],
      },
    },
    orderBy: [
      { role: "asc" },
      { name: "asc" },
    ],
  });
}

/**
 * Returns start (Monday 00:00:00) and end (Sunday 23:59:59.999) dates for the target date's week.
 */
export function getWeekWindow(targetDate = new Date()) {
  const date = new Date(targetDate);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

/**
 * Retrieves or initializes a weekly schedule with default park hours.
 */
export async function getOrCreateEditableWeek(targetDate = new Date()) {
  const { monday, sunday } = getWeekWindow(targetDate);

  let schedule = await prisma.weeklySchedule.findFirst({
    where: {
      weekStartDate: monday,
    },
    include: {
      assignments: {
        include: {
          user: true,
        },
      },
      parkHours: true,
      attendanceRecords: true,
      modificationRequests: {
        include: {
          requestedBy: true,
          authorizedBy: true,
        },
        orderBy: { requestedAt: "desc" },
      },
    },
  });

  if (!schedule) {
    schedule = await prisma.weeklySchedule.create({
      data: {
        weekStartDate: monday,
        weekEndDate: sunday,
        status: "DRAFT",
        parkHours: {
          create: DAYS_OF_WEEK.map((day) => ({
            dayOfWeek: day,
            openTime: "10:00",
            closeTime: "18:00",
          })),
        },
      },
      include: {
        assignments: {
          include: {
            user: true,
          },
        },
        parkHours: true,
        attendanceRecords: true,
        modificationRequests: {
          include: {
            requestedBy: true,
            authorizedBy: true,
          },
          orderBy: { requestedAt: "desc" },
        },
      },
    });
  }

  return schedule;
}

/**
 * Saves or clears an employee's working place assignment for a day.
 */
export async function saveAssignment(
  scheduleId: string,
  userId: string,
  dayOfWeek: DayOfWeek,
  rawCodes: string
) {
  const schedule = await prisma.weeklySchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  assertEventAllowed(schedule.status as ScheduleStatus, "SAVE_ASSIGNMENT");

  const frozenSnapshot = freezeCodes(rawCodes);

  if (!frozenSnapshot) {
    // If cleared or empty, delete the assignment row
    await prisma.scheduleAssignment.deleteMany({
      where: {
        scheduleId,
        userId,
        dayOfWeek,
      },
    });
    return null;
  }

  return prisma.scheduleAssignment.upsert({
    where: {
      scheduleId_userId_dayOfWeek: {
        scheduleId,
        userId,
        dayOfWeek,
      },
    },
    update: {
      codesSnapshot: frozenSnapshot,
    },
    create: {
      scheduleId,
      userId,
      dayOfWeek,
      codesSnapshot: frozenSnapshot,
    },
  });
}

/**
 * Saves opening and closing hours for a park day (spec §16).
 */
export async function saveParkHours(
  scheduleId: string,
  dayOfWeek: DayOfWeek,
  openTime: string,
  closeTime: string
) {
  const schedule = await prisma.weeklySchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  assertEventAllowed(schedule.status as ScheduleStatus, "EDIT_PARK_HOURS");

  return prisma.parkHours.upsert({
    where: {
      scheduleId_dayOfWeek: {
        scheduleId,
        dayOfWeek,
      },
    },
    update: {
      openTime,
      closeTime,
    },
    create: {
      scheduleId,
      dayOfWeek,
      openTime,
      closeTime,
    },
  });
}

/**
 * Copies assignments from the previous week's schedule (spec §28).
 */
export async function copyPreviousWeek(targetScheduleId: string) {
  const targetSchedule = await prisma.weeklySchedule.findUnique({
    where: { id: targetScheduleId },
  });

  if (!targetSchedule) {
    throw new Error("Target schedule not found");
  }

  assertEventAllowed(
    targetSchedule.status as ScheduleStatus,
    "COPY_PREVIOUS_WEEK"
  );

  const prevMonday = new Date(targetSchedule.weekStartDate);
  prevMonday.setDate(prevMonday.getDate() - 7);

  const prevSchedule = await prisma.weeklySchedule.findFirst({
    where: { weekStartDate: prevMonday },
    include: { assignments: true },
  });

  if (!prevSchedule || prevSchedule.assignments.length === 0) {
    throw new Error("No previous week assignments found to copy");
  }

  // Atomically copy assignments into target week
  await prisma.$transaction(async (tx) => {
    // Clear existing assignments
    await tx.scheduleAssignment.deleteMany({
      where: { scheduleId: targetScheduleId },
    });

    // Create copied assignments with frozen snapshots preserved
    for (const assignment of prevSchedule.assignments) {
      await tx.scheduleAssignment.create({
        data: {
          scheduleId: targetScheduleId,
          userId: assignment.userId,
          dayOfWeek: assignment.dayOfWeek,
          codesSnapshot: assignment.codesSnapshot,
        },
      });
    }
  });

  return { copiedCount: prevSchedule.assignments.length };
}

/**
 * Submits the schedule to GRH, locking it (spec §31).
 */
export async function submitSchedule(scheduleId: string, submittedBy: string) {
  const schedule = await prisma.weeklySchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  assertEventAllowed(schedule.status as ScheduleStatus, "SUBMIT");

  return prisma.weeklySchedule.update({
    where: { id: scheduleId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      submittedBy,
    },
  });
}

/**
 * Requests modification from GRH after schedule is locked (spec §32).
 */
export async function requestModification(
  scheduleId: string,
  requestedById: string,
  reason: string
) {
  const schedule = await prisma.weeklySchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  assertEventAllowed(
    schedule.status as ScheduleStatus,
    "REQUEST_MODIFICATION"
  );

  return prisma.$transaction(async (tx) => {
    const request = await tx.modificationRequest.create({
      data: {
        scheduleId,
        requestedById,
        reason,
        status: "PENDING",
      },
    });

    await tx.weeklySchedule.update({
      where: { id: scheduleId },
      data: {
        status: "REOPEN_REQUESTED",
      },
    });

    return request;
  });
}

/**
 * GRH approves reopening the schedule (spec §33).
 */
export async function approveReopen(
  requestId: string,
  authorizedById: string
) {
  const request = await prisma.modificationRequest.findUnique({
    where: { id: requestId },
    include: { schedule: true },
  });

  if (!request) {
    throw new Error("Modification request not found");
  }

  assertEventAllowed(
    request.schedule.status as ScheduleStatus,
    "APPROVE_REOPEN"
  );

  return prisma.$transaction(async (tx) => {
    await tx.modificationRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        authorizedById,
        authorizedAt: new Date(),
      },
    });

    return tx.weeklySchedule.update({
      where: { id: request.scheduleId },
      data: {
        status: "REOPEN_AUTHORIZED",
      },
    });
  });
}

/**
 * GRH rejects reopening the schedule (spec §33).
 */
export async function rejectReopen(
  requestId: string,
  authorizedById: string
) {
  const request = await prisma.modificationRequest.findUnique({
    where: { id: requestId },
    include: { schedule: true },
  });

  if (!request) {
    throw new Error("Modification request not found");
  }

  assertEventAllowed(
    request.schedule.status as ScheduleStatus,
    "REJECT_REOPEN"
  );

  return prisma.$transaction(async (tx) => {
    await tx.modificationRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        authorizedById,
        authorizedAt: new Date(),
      },
    });

    return tx.weeklySchedule.update({
      where: { id: request.scheduleId },
      data: {
        status: "SUBMITTED",
      },
    });
  });
}

/**
 * Resubmits the schedule to GRH, locking it again (spec §34).
 */
export async function resubmitSchedule(
  scheduleId: string,
  submittedBy: string
) {
  const schedule = await prisma.weeklySchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  assertEventAllowed(schedule.status as ScheduleStatus, "RESUBMIT");

  return prisma.weeklySchedule.update({
    where: { id: scheduleId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      submittedBy,
    },
  });
}
