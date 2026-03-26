import { useState } from "react";
import { useSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, AlertCircle, CheckCircle2, Loader2, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type RestoreMode = "skip" | "overwrite" | "merge";

export default function BackupRestore() {
  const { schoolId } = useSchool();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoreMode, setRestoreMode] = useState<RestoreMode>("skip");
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTable, setCurrentTable] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        toast.error("Please select a ZIP backup file");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File size must be less than 20MB");
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile || !schoolId) return;

    setRestoring(true);
    setProgress(0);
    setCurrentTable("Uploading...");
    setResult(null);

    try {
      // Upload backup file to storage
      const fileName = `backup-restore-${Date.now()}.zip`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("student-documents")
        .upload(`${schoolId}/backups/${fileName}`, selectedFile);

      if (uploadError) throw uploadError;

      setProgress(20);
      setCurrentTable("Processing backup...");

      // Call edge function to restore backup
      const { data, error } = await supabase.functions.invoke("restore-backup", {
        body: {
          schoolId,
          filePath: uploadData.path,
          restoreMode,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setProgress(100);
      setCurrentTable("Complete");
      setResult({
        success: true,
        message: data.message || "Backup restored successfully",
        details: data.details,
      });
      toast.success("Backup restored successfully");
      
      // Clean up uploaded file
      await supabase.storage
        .from("student-documents")
        .remove([uploadData.path]);
        
    } catch (err: any) {
      console.error("Restore error:", err);
      setResult({
        success: false,
        message: err.message || "Failed to restore backup",
      });
      toast.error(err.message || "Failed to restore backup");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Restore Backup</h1>
        <p className="text-muted-foreground">Upload and restore your school data from a backup file</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Only restore backups that were exported from this school. Restoring incorrect data may cause issues.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Backup
            </CardTitle>
            <CardDescription>
              Select a ZIP backup file to restore
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-file">Backup File (.zip)</Label>
              <input
                id="backup-file"
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                disabled={restoring}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Restore Mode
            </CardTitle>
            <CardDescription>
              Choose how to handle existing data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={restoreMode} onValueChange={(v) => setRestoreMode(v as RestoreMode)} disabled={restoring}>
              <div className="flex items-start space-x-2 space-y-0">
                <RadioGroupItem value="skip" id="skip" />
                <div className="space-y-1">
                  <Label htmlFor="skip" className="cursor-pointer">
                    Skip Existing (Recommended)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Only add new records, skip if already exists
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2 space-y-0">
                <RadioGroupItem value="overwrite" id="overwrite" />
                <div className="space-y-1">
                  <Label htmlFor="overwrite" className="cursor-pointer">
                    Overwrite Existing
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Replace existing records with backup data
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2 space-y-0">
                <RadioGroupItem value="merge" id="merge" />
                <div className="space-y-1">
                  <Label htmlFor="merge" className="cursor-pointer">
                    Merge Data
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Update existing records with newer data
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      {restoring && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{currentTable}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <strong>{result.success ? "Success:" : "Error:"}</strong> {result.message}
            {result.details && (
              <div className="mt-2 text-sm space-y-1">
                <p>Tables processed: {result.details.tablesProcessed || 0}</p>
                <p>Records restored: {result.details.recordsRestored || 0}</p>
                <p>Records skipped: {result.details.recordsSkipped || 0}</p>
                {result.details.errors && result.details.errors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-destructive/20">
                    <p className="font-medium text-destructive">Errors:</p>
                    <ul className="list-disc list-inside text-xs text-destructive space-y-0.5 mt-1 max-h-32 overflow-auto">
                      {result.details.errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleRestore}
          disabled={!selectedFile || restoring}
          size="lg"
        >
          {restoring ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Restoring...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Restore Backup
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
