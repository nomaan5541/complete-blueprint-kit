import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { logAudit } from "@/lib/auditLog";

type TableConfig = { name: string; label: string };

const TABLES: TableConfig[] = [
  { name: "academic_years", label: "Academic Years" },
  { name: "classes", label: "Classes" },
  { name: "sections", label: "Sections" },
  { name: "subjects", label: "Subjects" },
  { name: "class_subjects", label: "Class-Subject Mapping" },
  { name: "grade_systems", label: "Grade Systems" },
  { name: "fee_types", label: "Fee Types" },
  { name: "student_master", label: "Student Master" },
  { name: "students", label: "Students (Year-wise)" },
  { name: "student_documents", label: "Student Documents" },
  { name: "student_face_data", label: "Student Face Data" },
  { name: "teachers", label: "Teachers" },
  { name: "teacher_assignments", label: "Teacher Assignments" },
  { name: "attendance", label: "Attendance" },
  { name: "exams", label: "Exams" },
  { name: "exam_questions", label: "Exam Questions" },
  { name: "exam_options", label: "Exam Options" },
  { name: "exam_marks", label: "Exam Marks" },
  { name: "student_exam_attempts", label: "Student Exam Attempts" },
  { name: "student_answers", label: "Student Answers" },
  { name: "fee_structures", label: "Fee Structures" },
  { name: "fee_payments", label: "Fee Payments" },
  { name: "timetable_slots", label: "Timetable Slots" },
  { name: "timetable_entries", label: "Timetable Entries" },
  { name: "homework", label: "Homework" },
  { name: "meetings", label: "Meetings" },
  { name: "notifications", label: "Notifications" },
  { name: "school_events", label: "School Events" },
  { name: "student_chat_messages", label: "Student Chat Messages" },
  { name: "school_credentials", label: "School Credentials" },
  { name: "audit_logs", label: "Audit Logs" },
];

function toCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          // Escape CSV: wrap in quotes if contains comma, newline, or quote
          if (str.includes(",") || str.includes("\n") || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    ),
  ];
  return lines.join("\n");
}

async function fetchAll(table: string, schoolId: string) {
  // Fetch in batches of 1000 to handle large datasets
  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from(table as any)
      .select("*")
      .eq("school_id", schoolId)
      .range(from, from + batchSize - 1);
    if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return allData;
}

export type ExportFormat = "csv" | "json";

export interface BackupProgress {
  current: number;
  total: number;
  currentTable: string;
}

export async function exportSchoolBackup(
  schoolId: string,
  schoolName: string,
  format: ExportFormat = "csv",
  onProgress?: (p: BackupProgress) => void
) {
  const zip = new JSZip();
  const folder = zip.folder("backup")!;
  const total = TABLES.length + 1; // +1 for school info

  // 1. Export school info
  onProgress?.({ current: 1, total, currentTable: "School Info" });
  const { data: schoolData } = await supabase
    .from("schools")
    .select("*")
    .eq("id", schoolId)
    .single();

  if (schoolData) {
    folder.file(
      `school_info.${format}`,
      format === "json" ? JSON.stringify(schoolData, null, 2) : toCsv([schoolData])
    );
  }

  // 2. Export each table
  for (let i = 0; i < TABLES.length; i++) {
    const table = TABLES[i];
    onProgress?.({ current: i + 2, total, currentTable: table.label });

    try {
      const data = await fetchAll(table.name, schoolId);
      if (data.length > 0) {
        const content =
          format === "json" ? JSON.stringify(data, null, 2) : toCsv(data);
        folder.file(`${table.name}.${format}`, content);
      }
    } catch (err) {
      console.warn(`Skipping ${table.name}:`, err);
    }
  }

  // 3. Generate and download ZIP
  const dateStr = new Date().toISOString().split("T")[0];
  const safeName = schoolName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const filename = `school-backup-${safeName}-${dateStr}.zip`;

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  saveAs(blob, filename);

  // 4. Log audit
  await logAudit(schoolId, "download_backup", "school", schoolId, {
    format,
    date: dateStr,
    filename,
  });

  return filename;
}
