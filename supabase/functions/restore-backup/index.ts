import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as zip from "https://deno.land/x/zipjs@v2.7.32/index.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tables that can be restored, in dependency order (parents first)
const RESTORE_ORDER = [
  "academic_years", "classes", "sections", "subjects", "class_subjects",
  "fee_types", "grade_systems",
  "student_master", "students",
  "teachers", "teacher_assignments",
  "attendance", "exams", "exam_questions", "exam_options", "exam_marks",
  "student_exam_attempts", "student_answers",
  "fee_structures", "fee_payments",
  "timetable_slots", "timetable_entries",
  "homework", "meetings", "notifications", "school_events",
  "student_documents", "student_face_data", "student_chat_messages",
  "school_credentials", "audit_logs",
];

const ALLOWED_TABLES = new Set(RESTORE_ORDER);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    // Verify user is school admin or super_admin
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const callerRoles = (roles || []).map((r: any) => r.role);
    const isSuperAdmin = callerRoles.includes("super_admin");

    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("id")
      .eq("admin_id", user.id)
      .single();

    if (!school && !isSuperAdmin) {
      throw new Error("Only school admins can restore backups");
    }

    const { schoolId, filePath, restoreMode = "skip" } = await req.json();

    if (!isSuperAdmin && school?.id !== schoolId) {
      throw new Error("Unauthorized: School ID mismatch");
    }

    // Validate filePath
    const expectedPrefix = `${schoolId}/backups/`;
    if (!filePath || typeof filePath !== "string" || !filePath.startsWith(expectedPrefix)) {
      throw new Error("Invalid file path: must be within your school's backup directory");
    }

    // Download backup file
    const { data: fileData, error: downloadErr } = await supabaseAdmin.storage
      .from("student-documents")
      .download(filePath);
    if (downloadErr) throw new Error(`Failed to download backup: ${downloadErr.message}`);

    // Parse ZIP file
    const arrayBuffer = await fileData.arrayBuffer();
    const blob = new Blob([arrayBuffer]);
    const reader = new zip.ZipReader(new zip.BlobReader(blob));
    const entries = await reader.getEntries();

    // Build a map of table -> records from the ZIP
    const tableData = new Map<string, any[]>();

    for (const entry of entries) {
      if (entry.directory) continue;
      const fileName = entry.filename.split("/").pop() || "";
      if (!fileName.endsWith(".csv") && !fileName.endsWith(".json")) continue;
      if (fileName === "school_info.csv" || fileName === "school_info.json") continue;

      const tableName = fileName.replace(/\.(csv|json)$/, "");
      if (!ALLOWED_TABLES.has(tableName)) {
        console.warn(`Skipping disallowed table: ${tableName}`);
        continue;
      }

      try {
        const textWriter = new zip.TextWriter();
        const content = await entry.getData(textWriter);

        let records: any[];
        if (fileName.endsWith(".json")) {
          records = JSON.parse(content);
        } else {
          records = parseCsv(content);
        }

        if (!Array.isArray(records) || records.length === 0) continue;

        // Validate all records belong to this school
        const validRecords = records.filter(r => r.school_id === schoolId);
        if (validRecords.length !== records.length) {
          console.warn(`${tableName}: filtered ${records.length - validRecords.length} cross-tenant records`);
        }
        if (validRecords.length > 0) {
          tableData.set(tableName, validRecords);
        }
      } catch (e: any) {
        console.error(`Error reading ${tableName}:`, e.message);
      }
    }
    await reader.close();

    let tablesProcessed = 0;
    let recordsRestored = 0;
    let recordsSkipped = 0;
    const errors: string[] = [];

    // Process tables in dependency order
    for (const tableName of RESTORE_ORDER) {
      const records = tableData.get(tableName);
      if (!records) continue;

      console.log(`Restoring ${tableName}: ${records.length} records (mode=${restoreMode})`);

      // Process in batches
      const BATCH = 50;
      for (let i = 0; i < records.length; i += BATCH) {
        const batch = records.slice(i, i + BATCH);

        try {
          if (restoreMode === "skip") {
            // Use upsert with ignoreDuplicates to skip existing
            const { error } = await supabaseAdmin
              .from(tableName as any)
              .upsert(batch, { onConflict: "id", ignoreDuplicates: true });
            if (error) {
              console.warn(`Batch skip error in ${tableName}:`, error.message);
              errors.push(`${tableName}: ${error.message}`);
              recordsSkipped += batch.length;
            } else {
              recordsRestored += batch.length;
            }
          } else if (restoreMode === "overwrite") {
            const { error } = await supabaseAdmin
              .from(tableName as any)
              .upsert(batch, { onConflict: "id" });
            if (error) {
              console.warn(`Batch upsert error in ${tableName}:`, error.message);
              errors.push(`${tableName}: ${error.message}`);
              recordsSkipped += batch.length;
            } else {
              recordsRestored += batch.length;
            }
          } else if (restoreMode === "merge") {
            // For merge, process individually to compare timestamps
            for (const record of batch) {
              try {
                const { data: existing } = await supabaseAdmin
                  .from(tableName as any)
                  .select("id, updated_at")
                  .eq("id", record.id)
                  .maybeSingle();

                if (!existing) {
                  const { error } = await supabaseAdmin.from(tableName as any).insert(record);
                  if (error) { recordsSkipped++; } else { recordsRestored++; }
                } else if (record.updated_at && existing.updated_at &&
                           new Date(record.updated_at) > new Date(existing.updated_at)) {
                  const { error } = await supabaseAdmin.from(tableName as any).update(record).eq("id", record.id);
                  if (error) { recordsSkipped++; } else { recordsRestored++; }
                } else {
                  recordsSkipped++;
                }
              } catch {
                recordsSkipped++;
              }
            }
          }
        } catch (batchErr: any) {
          console.error(`Batch error in ${tableName}:`, batchErr?.message, batchErr);
          errors.push(`${tableName}: failed to restore one or more rows`);
          recordsSkipped += batch.length;
        }
      }
      tablesProcessed++;
    }

    // Log audit
    await supabaseAdmin.from("audit_logs").insert({
      school_id: schoolId,
      user_id: user.id,
      action: "restore_backup",
      entity_type: "school",
      entity_id: schoolId,
      details: { restoreMode, tablesProcessed, recordsRestored, recordsSkipped },
    });

    return new Response(
      JSON.stringify({
        message: "Backup restored successfully",
        details: { tablesProcessed, recordsRestored, recordsSkipped, errors: errors.slice(0, 20) },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Restore backup error:", error);
    return new Response(
      JSON.stringify({ error: "Restore failed. Please verify your backup file and try again." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseCsv(content: string): any[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const record: any = {};

    headers.forEach((header, index) => {
      let value = values[index] ?? "";
      // Try to parse JSON
      if (value.startsWith("{") || value.startsWith("[")) {
        try { record[header] = JSON.parse(value); return; } catch { /* use string */ }
      }
      if (value === "") { record[header] = null; }
      else if (value === "true") { record[header] = true; }
      else if (value === "false") { record[header] = false; }
      else if (!isNaN(Number(value)) && value !== "" && !header.includes("phone") && !header.includes("pincode") && !header.includes("number")) {
        record[header] = Number(value);
      } else {
        record[header] = value;
      }
    });

    records.push(record);
  }

  return records;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}
