// app/api/exports/schedule/excel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasCapability, type Role } from "@/auth/permissions";
import {
  getOrCreateEditableWeek,
  listWorkforce,
} from "@/domain/schedule/service";
import { generateScheduleExcel } from "@/lib/exports-generator";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.role) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const role = session.user.role as Role;
  if (!hasCapability(role, "EXPORTS_SCHEDULE_EXCEL")) {
    return new NextResponse("Forbidden: Missing export capability", { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const weekParam = searchParams.get("week");
  const targetDate = weekParam ? new Date(weekParam) : new Date();

  const schedule = await getOrCreateEditableWeek(targetDate);
  const workforce = await listWorkforce();

  // Renders frozen snapshots directly (§43, §50)
  const excelXml = generateScheduleExcel(
    schedule.weekStartDate,
    schedule.weekEndDate,
    schedule.status,
    workforce,
    schedule.assignments.map((a) => ({
      userId: a.userId,
      dayOfWeek: a.dayOfWeek as any,
      codesSnapshot: a.codesSnapshot,
    })),
    schedule.parkHours.map((h) => ({
      dayOfWeek: h.dayOfWeek as any,
      openTime: h.openTime,
      closeTime: h.closeTime,
    }))
  );

  const filename = `Planning_${schedule.weekStartDate.toISOString().split("T")[0]}.xls`;

  return new NextResponse(excelXml, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
