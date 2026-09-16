// lib/exports-generator.ts
import { DAYS_OF_WEEK, type DayOfWeek } from "@/domain/schedule/service";
import { formatWeekRangeFrench } from "@/lib/utils";

interface ExportWorkforceUser {
  id: string;
  name: string;
  role: string;
}

interface ExportAssignment {
  userId: string;
  dayOfWeek: DayOfWeek;
  codesSnapshot: string;
}

interface ExportParkHour {
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
}

interface ExportAttendance {
  userId: string;
  dayOfWeek: DayOfWeek;
  status: string;
}

/**
 * Creates a valid, standalone PDF 1.4 binary buffer.
 */
function buildPdfDocument(contentStream: string): Buffer {
  const contentBytes = Buffer.from(contentStream, "utf-8");
  const objects: string[] = [];

  // Object 1: Catalog
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  // Object 2: Pages container (Landscape A4: 842 x 595 pt)
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  // Object 3: Page definition
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
  );
  // Object 4: Stream content
  objects.push(
    `4 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`
  );
  // Object 5: Standard Font
  objects.push(
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
  );

  let output = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(output, "utf-8"));
    output += objects[i];
  }

  const xrefOffset = Buffer.byteLength(output, "utf-8");
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    const offStr = String(offsets[i]).padStart(10, "0");
    output += `${offStr} 00000 n \n`;
  }

  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(output, "utf-8");
}

/**
 * Escapes characters for PDF text strings.
 */
function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Generates Weekly Schedule PDF with frozen code snapshots (§43, §50).
 */
export function generateSchedulePdf(
  weekStartDate: Date,
  weekEndDate: Date,
  status: string,
  workforce: ExportWorkforceUser[],
  assignments: ExportAssignment[],
  parkHours: ExportParkHour[]
): Buffer {
  const weekLabel = formatWeekRangeFrench(new Date(weekStartDate), new Date(weekEndDate));
  const assignmentMap = new Map<string, string>();
  for (const a of assignments) {
    assignmentMap.set(`${a.userId}-${a.dayOfWeek}`, a.codesSnapshot);
  }

  let stream = `BT
/F1 16 Tf
50 550 Td
(AMUSEMENT PARK - PLANNING HEBDOMADAIRE) Tj
/F1 10 Tf
0 -18 Td
(Semaine : ${escapePdfText(weekLabel)}  |  Statut : ${escapePdfText(status)}) Tj
ET\n`;

  // Draw table header
  stream += `BT
/F1 9 Tf
50 495 Td
(Employe) Tj
120 0 Td
(Role) Tj
50 0 Td
(Lun) Tj
65 0 Td
(Mar) Tj
65 0 Td
(Mer) Tj
65 0 Td
(Jeu) Tj
65 0 Td
(Ven) Tj
65 0 Td
(Sam) Tj
65 0 Td
(Dim) Tj
ET\n`;

  // Draw lines
  let y = 475;
  for (const emp of workforce) {
    if (y < 80) break; // Avoid overflowing landscape single page

    let rowText = `BT
/F1 8 Tf
50 ${y} Td
(${escapePdfText(emp.name.slice(0, 18))}) Tj
120 0 Td
(${escapePdfText(emp.role.slice(0, 6))}) Tj`;

    let xOffset = 50;
    for (const day of DAYS_OF_WEEK) {
      const code = assignmentMap.get(`${emp.id}-${day}`) || "-";
      rowText += `\n${xOffset} 0 Td\n(${escapePdfText(code.slice(0, 10))}) Tj`;
      xOffset = 65;
    }

    rowText += "\nET\n";
    stream += rowText;
    y -= 16;
  }

  // Draw Park Hours Section at bottom (§16)
  const hoursStr = DAYS_OF_WEEK.map((day) => {
    const h = parkHours.find((p) => p.dayOfWeek === day);
    const shortDay = day.slice(0, 3);
    return `${shortDay}: ${h ? `${h.openTime}-${h.closeTime}` : "10:00-18:00"}`;
  }).join("  |  ");

  stream += `BT
/F1 8 Tf
50 40 Td
(Horaires du Parc : ${escapePdfText(hoursStr)}) Tj
ET\n`;

  return buildPdfDocument(stream);
}

/**
 * Generates Weekly Schedule Excel (.xls SpreadsheetML) with frozen snapshots (§43, §50).
 */
export function generateScheduleExcel(
  weekStartDate: Date,
  weekEndDate: Date,
  status: string,
  workforce: ExportWorkforceUser[],
  assignments: ExportAssignment[],
  parkHours: ExportParkHour[]
): string {
  const weekLabel = formatWeekRangeFrench(new Date(weekStartDate), new Date(weekEndDate));
  const assignmentMap = new Map<string, string>();
  for (const a of assignments) {
    assignmentMap.set(`${a.userId}-${a.dayOfWeek}`, a.codesSnapshot);
  }

  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E293B" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="14"/></Style>
  <Style ss:ID="SubTitle"><Font ss:Italic="1" ss:Color="#64748B"/></Style>
  <Style ss:ID="CellBold"><Font ss:Bold="1"/></Style>
  <Style ss:ID="ParkHourHeader"><Font ss:Bold="1"/><Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="Planning">
  <Table>
   <Row><Cell ss:StyleID="Title"><Data ss:Type="String">Planning Hebdomadaire du Parc</Data></Cell></Row>
   <Row><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Semaine : ${weekLabel} - Statut : ${status}</Data></Cell></Row>
   <Row></Row>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Employé</Data></Cell>
    <Cell><Data ss:Type="String">Rôle</Data></Cell>
    <Cell><Data ss:Type="String">Lundi</Data></Cell>
    <Cell><Data ss:Type="String">Mardi</Data></Cell>
    <Cell><Data ss:Type="String">Mercredi</Data></Cell>
    <Cell><Data ss:Type="String">Jeudi</Data></Cell>
    <Cell><Data ss:Type="String">Vendredi</Data></Cell>
    <Cell><Data ss:Type="String">Samedi</Data></Cell>
    <Cell><Data ss:Type="String">Dimanche</Data></Cell>
   </Row>`;

  for (const emp of workforce) {
    xml += `\n   <Row>
    <Cell ss:StyleID="CellBold"><Data ss:Type="String">${emp.name}</Data></Cell>
    <Cell><Data ss:Type="String">${emp.role}</Data></Cell>`;
    for (const day of DAYS_OF_WEEK) {
      const code = assignmentMap.get(`${emp.id}-${day}`) || "";
      xml += `\n    <Cell><Data ss:Type="String">${code}</Data></Cell>`;
    }
    xml += `\n   </Row>`;
  }

  // Park Hours Row
  xml += `\n   <Row></Row>
   <Row ss:StyleID="ParkHourHeader">
    <Cell ss:MergeAcross="1"><Data ss:Type="String">Horaires d'Ouverture du Parc</Data></Cell>`;
  for (const day of DAYS_OF_WEEK) {
    const h = parkHours.find((p) => p.dayOfWeek === day);
    const timeText = h ? `${h.openTime} - ${h.closeTime}` : "10:00 - 18:00";
    xml += `\n    <Cell><Data ss:Type="String">${timeText}</Data></Cell>`;
  }
  xml += `\n   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  return xml;
}

/**
 * Generates Weekly Attendance PDF (§44).
 */
export function generateAttendancePdf(
  weekStartDate: Date,
  weekEndDate: Date,
  workforce: ExportWorkforceUser[],
  assignments: ExportAssignment[],
  attendanceRecords: ExportAttendance[]
): Buffer {
  const weekLabel = formatWeekRangeFrench(new Date(weekStartDate), new Date(weekEndDate));
  const assignmentMap = new Map<string, string>();
  for (const a of assignments) {
    assignmentMap.set(`${a.userId}-${a.dayOfWeek}`, a.codesSnapshot);
  }

  const attendanceMap = new Map<string, string>();
  for (const r of attendanceRecords) {
    attendanceMap.set(`${r.userId}-${r.dayOfWeek}`, r.status);
  }

  let stream = `BT
/F1 16 Tf
50 550 Td
(AMUSEMENT PARK - REGISTRE DE PRESENCE) Tj
/F1 10 Tf
0 -18 Td
(Semaine : ${escapePdfText(weekLabel)}) Tj
ET\n`;

  // Draw table header
  stream += `BT
/F1 9 Tf
50 495 Td
(Employe) Tj
120 0 Td
(Role) Tj
50 0 Td
(Lun) Tj
65 0 Td
(Mar) Tj
65 0 Td
(Mer) Tj
65 0 Td
(Jeu) Tj
65 0 Td
(Ven) Tj
65 0 Td
(Sam) Tj
65 0 Td
(Dim) Tj
ET\n`;

  let y = 475;
  for (const emp of workforce) {
    if (y < 60) break;

    let rowText = `BT
/F1 8 Tf
50 ${y} Td
(${escapePdfText(emp.name.slice(0, 18))}) Tj
120 0 Td
(${escapePdfText(emp.role.slice(0, 6))}) Tj`;

    let xOffset = 50;
    for (const day of DAYS_OF_WEEK) {
      const assigned = assignmentMap.get(`${emp.id}-${day}`);
      let displayStatus = "-";
      if (assigned) {
        if (assigned.split("/").includes("OFF")) {
          displayStatus = "REPOS";
        } else {
          displayStatus = attendanceMap.get(`${emp.id}-${day}`) || "Non marq";
        }
      }

      rowText += `\n${xOffset} 0 Td\n(${escapePdfText(displayStatus.slice(0, 9))}) Tj`;
      xOffset = 65;
    }

    rowText += "\nET\n";
    stream += rowText;
    y -= 16;
  }

  return buildPdfDocument(stream);
}

/**
 * Generates Weekly Attendance Excel (.xls) (§44).
 */
export function generateAttendanceExcel(
  weekStartDate: Date,
  weekEndDate: Date,
  workforce: ExportWorkforceUser[],
  assignments: ExportAssignment[],
  attendanceRecords: ExportAttendance[]
): string {
  const weekLabel = formatWeekRangeFrench(new Date(weekStartDate), new Date(weekEndDate));
  const assignmentMap = new Map<string, string>();
  for (const a of assignments) {
    assignmentMap.set(`${a.userId}-${a.dayOfWeek}`, a.codesSnapshot);
  }

  const attendanceMap = new Map<string, string>();
  for (const r of attendanceRecords) {
    attendanceMap.set(`${r.userId}-${r.dayOfWeek}`, r.status);
  }

  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E293B" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="14"/></Style>
  <Style ss:ID="SubTitle"><Font ss:Italic="1" ss:Color="#64748B"/></Style>
  <Style ss:ID="CellBold"><Font ss:Bold="1"/></Style>
 </Styles>
 <Worksheet ss:Name="Présences">
  <Table>
   <Row><Cell ss:StyleID="Title"><Data ss:Type="String">Registre Hebdomadaire des Présences</Data></Cell></Row>
   <Row><Cell ss:StyleID="SubTitle"><Data ss:Type="String">Semaine : ${weekLabel}</Data></Cell></Row>
   <Row></Row>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Employé</Data></Cell>
    <Cell><Data ss:Type="String">Rôle</Data></Cell>
    <Cell><Data ss:Type="String">Lundi</Data></Cell>
    <Cell><Data ss:Type="String">Mardi</Data></Cell>
    <Cell><Data ss:Type="String">Mercredi</Data></Cell>
    <Cell><Data ss:Type="String">Jeudi</Data></Cell>
    <Cell><Data ss:Type="String">Vendredi</Data></Cell>
    <Cell><Data ss:Type="String">Samedi</Data></Cell>
    <Cell><Data ss:Type="String">Dimanche</Data></Cell>
   </Row>`;

  for (const emp of workforce) {
    xml += `\n   <Row>
    <Cell ss:StyleID="CellBold"><Data ss:Type="String">${emp.name}</Data></Cell>
    <Cell><Data ss:Type="String">${emp.role}</Data></Cell>`;
    for (const day of DAYS_OF_WEEK) {
      const assigned = assignmentMap.get(`${emp.id}-${day}`);
      let displayStatus = "";
      if (assigned) {
        if (assigned.split("/").includes("OFF")) {
          displayStatus = "DAY_OFF";
        } else {
          displayStatus = attendanceMap.get(`${emp.id}-${day}`) || "NON_MARQUÉ";
        }
      }
      xml += `\n    <Cell><Data ss:Type="String">${displayStatus}</Data></Cell>`;
    }
    xml += `\n   </Row>`;
  }

  xml += `\n  </Table>
 </Worksheet>
</Workbook>`;

  return xml;
}
