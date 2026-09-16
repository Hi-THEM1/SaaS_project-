// app/api/exports/attendance/excel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasCapability, type Role } from "@/auth/permissions";
import {
  getOrCreateEditableWeek,
  listWorkforce,
} from "@/domain/schedule/service";
import { generateAttendanceExcel } from "@/lib/exports-generator";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.role) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const role = session.user.role as Role;
  if (!hasCapability(role, "EXPORTS_ATTENDANCE_EXCEL")) {
    return new NextResponse("Forbidden: Missing export capability", { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const weekParam = searchParams.get("week");
  const targetDate = weekParam ? new Date(weekParam) : new Date();

  const schedule = await getOrCreateEditableWeek(targetDate);
  const workforce = await listWorkforce();

  // Filter workforce to those with assignments that week (§39)
  const assignedUserIds = new Set(
    schedule.assignments
      .filter((a) => a.codesSnapshot && a.codesSnapshot.trim().length > 0)
      .map((a) => a.userId)
  );
  const eligibleWorkforce = workforce.filter((emp) => assignedUserIds.has(emp.id));

  const excelXml = generateAttendanceExcel(
    schedule.weekStartDate,
    schedule.weekEndDate,
    eligibleWorkforce,
    schedule.assignments.map((a) => ({
      userId: a.userId,
      dayOfWeek: a.dayOfWeek as any,
      codesSnapshot: a.codesSnapshot,
    })),
    schedule.attendanceRecords.map((r) => ({
      userId: r.userId,
      dayOfWeek: r.dayOfWeek as any,
      status: r.status,
    }))
  );

  const filename = `Presences_${schedule.weekStartDate.toISOString().split("T")[0]}.xls`;

  return new NextResponse(excelXml, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
