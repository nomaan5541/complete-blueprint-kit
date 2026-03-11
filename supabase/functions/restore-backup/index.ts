import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { unzip } from "https://deno.land/x/zipjs@v2.7.32/index.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    // Verify user is school admin
    const { data: school } = await supabase
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

    // Download backup file from storage
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("student-documents")
      .download(filePath);

    if (downloadErr) throw new Error(`Failed to download backup: ${downloadErr.message}`);

    // Parse ZIP file
    const arrayBuffer = await fileData.arrayBuffer();
    const blob = new Blob([arrayBuffer]);
    const reader = new zip.ZipReader(new zip.BlobReader(blob));
    const entries = await reader.getEntries();

    let tablesProcessed = 0;
    let recordsRestored = 0;
    let recordsSkipped = 0;

    // Process each file in the backup
    for (const entry of entries) {
      if (entry.directory) continue;
      
      const fileName = entry.filename.split("/").pop() || "";
      if (!fileName.endsWith(".csv") && !fileName.endsWith(".json")) continue;
      if (fileName === "school_info.csv" || fileName === "school_info.json") continue;

      const tableName = fileName.replace(/\.(csv|json)$/, "");
      
      // Security: Only allow restoring specific safe tables
      const ALLOWED_TABLES = new Set([
        'students', 'student_master', 'attendance', 'exam_marks', 'fee_payments',
        'fee_structures', 'fee_types', 'homework', 'student_documents',
        'student_face_data', 'classes', 'sections', 'subjects', 'class_subjects',
        'academic_years', 'exams', 'exam_questions', 'exam_options',
        'grade_systems', 'meetings', 'notifications', 'school_events',
        'school_credentials', 'study_materials', 'student_chat_messages',
        'student_exam_attempts', 'student_answers'
      ]);
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
          // Parse CSV
          records = parseCsv(content);
        }

        if (!Array.isArray(records) || records.length === 0) continue;

        // Validate all records belong to this school
        const hasSchoolId = records.every(r => r.school_id === schoolId);
        if (!hasSchoolId) {
          console.warn(`Skipping ${tableName}: contains data from other schools`);
          continue;
        }

        // Process records based on restore mode
        for (const record of records) {
          try {
            if (restoreMode === "skip") {
              // Insert only if doesn't exist
              const { error } = await supabase
                .from(tableName)
                .insert(record)
                .select()
                .single();
              
              if (error) {
                if (error.code === "23505") { // Duplicate key
                  recordsSkipped++;
                } else {
                  console.warn(`Skip insert error in ${tableName}:`, error.message);
                  recordsSkipped++;
                }
              } else {
                recordsRestored++;
              }
            } else if (restoreMode === "overwrite") {
              // Upsert (insert or update)
              const { error } = await supabase
                .from(tableName)
                .upsert(record, { onConflict: "id" });
              
              if (error) {
                console.warn(`Upsert error in ${tableName}:`, error.message);
                recordsSkipped++;
              } else {
                recordsRestored++;
              }
            } else if (restoreMode === "merge") {
              // Check if exists, update if newer
              const { data: existing } = await supabase
                .from(tableName)
                .select("id, updated_at")
                .eq("id", record.id)
                .single();
              
              if (!existing) {
                // Insert new record
                const { error } = await supabase
                  .from(tableName)
                  .insert(record);
                
                if (error) {
                  console.warn(`Insert error in ${tableName}:`, error.message);
                  recordsSkipped++;
                } else {
                  recordsRestored++;
                }
              } else if (record.updated_at && existing.updated_at && 
                         new Date(record.updated_at) > new Date(existing.updated_at)) {
                // Update if backup data is newer
                const { error } = await supabase
                  .from(tableName)
                  .update(record)
                  .eq("id", record.id);
                
                if (error) {
                  console.warn(`Update error in ${tableName}:`, error.message);
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

        tablesProcessed++;
      } catch (tableErr: any) {
        console.error(`Error processing table ${tableName}:`, tableErr.message);
      }
    }

    await reader.close();

    // Log audit
    await supabase.from("audit_logs").insert({
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
        details: { tablesProcessed, recordsRestored, recordsSkipped },
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

function parseCsv(content: string): any[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(",").map(h => h.trim());
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const record: any = {};
    
    headers.forEach((header, index) => {
      let value = values[index]?.trim() || "";
      
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"');
      }
      
      // Try to parse JSON objects/arrays
      if (value.startsWith("{") || value.startsWith("[")) {
        try {
          record[header] = JSON.parse(value);
        } catch {
          record[header] = value;
        }
      } else if (value === "") {
        record[header] = null;
      } else {
        record[header] = value;
      }
    });
    
    records.push(record);
  }
  
  return records;
}
