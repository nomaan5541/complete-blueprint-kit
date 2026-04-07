import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, ScanFace, CheckCircle, AlertCircle } from "lucide-react";
import {
  loadFaceModels,
  extractFaceDescriptor,
  descriptorToArray,
  isModelsLoaded,
} from "@/lib/faceRecognition";

interface FaceEnrollmentProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: { id: string; name: string; photo_url: string | null; school_id: string } | null;
  onEnrolled?: () => void;
}

export function FaceEnrollment({ open, onOpenChange, student, onEnrolled }: FaceEnrollmentProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading_models" | "detecting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);

  if (!student) return null;

  const handleEnroll = async () => {
    if (!student.photo_url) {
      toast.error("Student has no photo. Please upload a photo first.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // Load models if not already loaded
      if (!isModelsLoaded()) {
        setStatus("loading_models");
        await loadFaceModels();
      }

      setStatus("detecting");

      // Wait for image to load
      await new Promise<void>((resolve, reject) => {
        const img = imgRef.current;
        if (!img) { reject(new Error("Image ref not found")); return; }
        if (img.complete && img.naturalWidth > 0) { resolve(); return; }
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load student photo"));
      });

      const descriptor = await extractFaceDescriptor(imgRef.current!);
      if (!descriptor) {
        setStatus("error");
        setErrorMsg("No face detected in the photo. Please upload a clear face photo.");
        setLoading(false);
        return;
      }

      // Save to database
      const { error } = await supabase
        .from("student_face_data" as any)
        .upsert({
          student_id: student.id,
          school_id: student.school_id,
          face_descriptor: descriptorToArray(descriptor),
          updated_at: new Date().toISOString(),
        }, { onConflict: "student_id" });

      if (error) throw error;

      setStatus("success");
      toast.success(`Face enrolled for ${student.name}`);
      onEnrolled?.();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to enroll face";
      setStatus("error");
      setErrorMsg(errorMessage);
      toast.error("Enrollment failed: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); setStatus("idle"); setErrorMsg(""); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanFace className="h-5 w-5 text-primary" />
            Face Enrollment — {student.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Photo */}
          <div className="flex justify-center">
            {student.photo_url ? (
              <img
                ref={imgRef}
                src={student.photo_url}
                alt={student.name}
                crossOrigin="anonymous"
                className="w-48 h-48 rounded-xl object-cover border-2 border-border"
              />
            ) : (
              <div className="w-48 h-48 rounded-xl bg-muted flex items-center justify-center">
                <p className="text-muted-foreground text-sm text-center px-4">
                  No photo available. Upload a student photo first.
                </p>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {status === "loading_models" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading face recognition models...
            </div>
          )}
          {status === "detecting" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Detecting and encoding face...
            </div>
          )}
          {status === "success" && (
            <div className="flex items-center gap-2 text-sm text-emerald-500 justify-center">
              <CheckCircle className="h-4 w-4" />
              Face enrolled successfully!
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 text-sm text-destructive justify-center">
              <AlertCircle className="h-4 w-4" />
              {errorMsg}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            The face descriptor is extracted from the student's photo and stored securely.
            It will be used to automatically identify the student during attendance scanning.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleEnroll} disabled={loading || !student.photo_url || status === "success"}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanFace className="mr-2 h-4 w-4" />}
            {status === "success" ? "Enrolled" : "Enroll Face"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
