import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as zip from "https://deno.land/x/zipjs@v2.7.32/index.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tables that can be safely restored (must exist in the database)
const ALLOWED_TABLES = new Set([
  'academic_years', 'classes', 'sections', 'subjects', 'class_subjects',
  'students', 'student_master', 'student_documents',
  'teachers', 'teacher_assignments',
  'attendance',
  'exams', 'exam_questions', 'exam_options', 'exam_marks',
  'student_exam_attempts', 'student_answers',
  'fee_types', 'fee_structures', 'fee_payments',
  'grade_systems',
  'homework', 'meetings',
  'notifications', 'school_events', 'school_credentials',
  'timetable_slots', 'timetable_entries',
  'audit_logs',
]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // CRITICAL: Use service-role client to bypass RLS for restore operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify authentication using the user's JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    // Verify user is school admin
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("id")
      .eq("admin_id", user.id)
      .single();
    
    if (!school) {
      throw new Error("Only school admins can restore backups");
    }

    const { schoolId, filePath, restoreMode = "skip" } = await req.json();
    
    if (school.id !== schoolId) {
      throw new Error("Unauthorized: School ID mismatch");
    }

    // Validate filePath belongs to the requesting school's storage prefix
    const expectedPrefix = `${school.id}/backups/`;
    if (!filePath || typeof filePath !== "string" || !filePath.startsWith(expectedPrefix)) {
      throw new Error("Invalid file path: must be within your school's backup directory");
    }

    // Download backup file from storage (using admin client to bypass storage RLS)
    const { data: fileData, error: downloadErr } = await supabaseAdmin.storage
      .from("student-documents")
      .download(filePath);

    if (downloadErr) throw new Error(`Failed to download backup: ${downloadErr.message}`);

    // Parse ZIP file using the correct zip.js API
    const arrayBuffer = await fileData.arrayBuffer();
    const blob = new Blob([arrayBuffer]);
    const reader = new zip.ZipReader(new zip.BlobReader(blob));
    const entries = await reader.getEntries();

    let tablesProcessed = 0;
    let recordsRestored = 0;
    let recordsSkipped = 0;
    const errors: string[] = [];

    // Process each file in the backup
    for (const entry of entries) {
      if (entry.directory) continue;
      
      const fileName = entry.filename.split("/").pop() || "";
      if (!fileName.endsWith(".csv") && !fileName.endsWith(".json")) continue;
      if (fileName === "school_info.csv" || fileName === "school_info.json") continue;

      const tableName = fileName.replace(/\.(csv|json)$/, "");
      
      // Security: Only allow restoring specific safe tables
      if (!ALLOWED_TABLES.has(tableName)) {
        console.warn(`Skipping disallowed table: ${tableName}`);
        continue;
      }
      
      console.log(`Processing table: ${tableName}`);

      try {
        // Read file content
        const textWriter = new zip.TextWriter();
        const content = await entry.getData(textWriter);
        
        let records: any[];
        if (fileName.endsWith(".json")) {
          records = JSON.parse(content);
        } else {
          records = parseCsv(content);
        }

        if (!Array.isArray(records) || records.length === 0) continue;

        // Validate all records belong to this school (for tables with school_id)
        if (records[0].school_id !== undefined) {
          const foreignRecords = records.filter(r => r.school_id !== schoolId);
          if (foreignRecords.length > 0) {
            console.warn(`Skipping ${tableName}: contains ${foreignRecords.length} records from other schools`);
            errors.push(`${tableName}: skipped — contains data from other schools`);
            continue;
          }
        }

        // Process in batches of 50 for performance
        const BATCH_SIZE = 50;
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          const batch = records.slice(i, i + BATCH_SIZE);

          for (const record of batch) {
            try {
              // Remove any fields that might cause issues
              delete record.created_at; // Let the DB set timestamps
              // Keep updated_at only for merge mode

              if (restoreMode === "skip") {
                // Insert only if doesn't exist
                const { error } = await supabaseAdmin
                  .from(tableName)
                  .insert(record);
                
                if (error) {
                  if (error.code === "23505") { // Duplicate key
                    recordsSkipped++;
                  } else {
                    console.warn(`Skip insert error in ${tableName}: ${error.message} (code: ${error.code})`);
                    errors.push(`${tableName}: ${error.message}`);
                    recordsSkipped++;
                  }
                } else {
                  recordsRestored++;
                }
              } else if (restoreMode === "overwrite") {
                // Upsert (insert or update)
                const { error } = await supabaseAdmin
                  .from(tableName)
                  .upsert(record, { onConflict: "id" });
                
                if (error) {
                  console.warn(`Upsert error in ${tableName}: ${error.message}`);
                  errors.push(`${tableName}: ${error.message}`);
                  recordsSkipped++;
                } else {
                  recordsRestored++;
                }
              } else if (restoreMode === "merge") {
                // Check if exists, update if newer
                const { data: existing } = await supabaseAdmin
                  .from(tableName)
                  .select("id, updated_at")
                  .eq("id", record.id)
                  .single();
                
                if (!existing) {
                  const { error } = await supabaseAdmin
                    .from(tableName)
                    .insert(record);
                  
                  if (error) {
                    console.warn(`Insert error in ${tableName}: ${error.message}`);
                    errors.push(`${tableName}: ${error.message}`);
                    recordsSkipped++;
                  } else {
                    recordsRestored++;
                  }
                } else if (record.updated_at && existing.updated_at && 
                           new Date(record.updated_at) > new Date(existing.updated_at)) {
                  const { error } = await supabaseAdmin
                    .from(tableName)
                    .update(record)
                    .eq("id", record.id);
                  
                  if (error) {
                    console.warn(`Update error in ${tableName}: ${error.message}`);
                    errors.push(`${tableName}: ${error.message}`);
                    recordsSkipped++;
                  } else {
                    recordsRestored++;
                  }
                } else {
                  recordsSkipped++;
                }
              }
            } catch (recordErr: any) {
              console.warn(`Error processing record in ${tableName}:`, recordErr.message);
              recordsSkipped++;
            }
          }
        }

        tablesProcessed++;
      } catch (tableErr: any) {
        console.error(`Error processing table ${tableName}:`, tableErr.message);
        errors.push(`${tableName}: ${tableErr.message}`);
      }
    }

    await reader.close();

    // Log audit (using admin client to ensure it works)
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
        message: `Backup restored successfully. ${recordsRestored} records restored, ${recordsSkipped} skipped across ${tablesProcessed} tables.`,
        details: { tablesProcessed, recordsRestored, recordsSkipped, errors: errors.slice(0, 20) },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Restore backup error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Parse CSV content into an array of objects.
 * Handles quoted fields containing commas and newlines.
 */
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
      let value = values[index]?.trim() || "";
      
      // Try to parse JSON objects/arrays
      if (value.startsWith("{") || value.startsWith("[")) {
        try {
          record[header] = JSON.parse(value);
          return;
        } catch {
          // Not valid JSON, treat as string
        }
      }
      
      if (value === "" || value === "null" || value === "NULL") {
        record[header] = null;
      } else if (value === "true") {
        record[header] = true;
      } else if (value === "false") {
        record[header] = false;
      } else if (!isNaN(Number(value)) && value !== "" && !value.startsWith("0") || value === "0") {
        // Only convert to number if it's truly numeric (not a string starting with 0 like "001")
        const num = Number(value);
        if (Number.isFinite(num)) {
          record[header] = num;
        } else {
          record[header] = value;
        }
      } else {
        record[header] = value;
      }
    });
    
    records.push(record);
  }
  
  return records;
}

/**
 * Parse a single CSV line, handling quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  
  result.push(current);
  return result;
}
