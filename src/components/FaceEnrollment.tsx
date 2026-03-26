import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ScanFace, CheckCircle, AlertCircle, Camera, Check } from "lucide-react";
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
  userType?: "student" | "teacher";
  onEnrolled?: () => void;
}

export function FaceEnrollment({ open, onOpenChange, student, userType = "student", onEnrolled }: FaceEnrollmentProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading_models" | "detecting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [enrollMode, setEnrollMode] = useState<"photo" | "camera">("photo");
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const imgRef = useRef<HTMLImageElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    // Reset state when dialog opens/closes
    if (open) {
      setStatus("idle");
      setErrorMsg("");
      setEnrollMode("photo");
    } else {
      stopCamera();
    }
  }, [open, stopCamera]);

  const handleModeChange = (mode: string) => {
    setEnrollMode(mode as "photo" | "camera");
    if (mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (e) {
      toast.error("Cannot access camera. Please allow camera permission.");
      setEnrollMode("photo");
    }
  };

  if (!student) return null;

  const saveDescriptor = async (descriptor: Float32Array) => {
    const descriptorArr = descriptorToArray(descriptor);
    
    if (userType === "student") {
      const { error } = await supabase
        .from("student_face_data" as any)
        .upsert({
          student_id: student.id,
          school_id: student.school_id,
          face_descriptor: descriptorArr,
          updated_at: new Date().toISOString(),
        }, { onConflict: "student_id" });

      if (error) throw error;
    } else {
      // Store teacher face data in app_settings JSON to bypass missing teacher_face_data table
      const settingKey = `teacher_faces_${student.school_id}`;
      const { data: existingData } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", settingKey)
        .maybeSingle();

      const val = (existingData as any)?.value;
      const existingFaces = Array.isArray(val) ? val : [];
      // Remove existing entry for this teacher if any
      const updatedFaces = existingFaces.filter((f: any) => f.teacher_id !== student.id);
      
      updatedFaces.push({
        teacher_id: student.id,
        face_descriptor: descriptorArr,
        updated_at: new Date().toISOString()
      });

      const { error } = await supabase
        .from("app_settings" as any)
        .upsert({
          key: settingKey,
          value: updatedFaces,
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });
        
      if (error) throw error;
    }
  };

  const handleEnrollFromPhoto = async () => {
    if (!student.photo_url) {
      toast.error("Student has no photo. Please upload a photo first or use the camera.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      if (!isModelsLoaded()) {
        setStatus("loading_models");
        await loadFaceModels();
      }

      setStatus("detecting");

      await new Promise<void>((resolve, reject) => {
        const img = imgRef.current;
        if (!img) { reject(new Error("Image ref not found")); return; }
        if (img.complete && img.naturalWidth > 0) { resolve(); return; }
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load student photo"));
      });

      const descriptor = await extractFaceDescriptor(imgRef.current!);
      if (!descriptor) {
        throw new Error("No face detected in the photo. Please upload a clear face photo or use live capture.");
      }

      await saveDescriptor(descriptor);

      setStatus("success");
      toast.success(`Face enrolled for ${student.name}`);
      onEnrolled?.();
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e.message || "Failed to enroll face");
      toast.error("Enrollment failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollFromCamera = async () => {
    if (!videoRef.current || !cameraActive) {
      toast.error("Camera is not active");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      if (!isModelsLoaded()) {
        setStatus("loading_models");
        await loadFaceModels();
      }

      setStatus("detecting");

      const descriptor = await extractFaceDescriptor(videoRef.current);
      if (!descriptor) {
        throw new Error("No face detected. Please ensure your face is clearly visible in the camera.");
      }

      await saveDescriptor(descriptor);
      
      // Provide visual feedback by pausing the video briefly on the captured frame
      videoRef.current.pause();

      setStatus("success");
      toast.success(`Face enrolled for ${student.name}`);
      
      // Stop camera and notify parent after a short delay
      setTimeout(() => {
        stopCamera();
        onEnrolled?.();
      }, 1500);
      
    } catch (e: any) {
      if (videoRef.current) videoRef.current.play(); // resume if failed
      setStatus("error");
      setErrorMsg(e.message || "Failed to enroll face");
      toast.error("Enrollment failed: " + e.message);
    } finally {
      if (status !== "success") setLoading(false);
    }
  };

  const handleEnroll = () => {
    if (enrollMode === "photo") {
      handleEnrollFromPhoto();
    } else {
      handleEnrollFromCamera();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { 
      onOpenChange(v); 
      if (!v) stopCamera();
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanFace className="h-5 w-5 text-primary" />
            Face Enrollment — {student.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={enrollMode} onValueChange={handleModeChange} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="photo" className="flex-1">Existing Photo</TabsTrigger>
            <TabsTrigger value="camera" className="flex-1">Live Camera</TabsTrigger>
          </TabsList>
          
          <div className="space-y-4">
            <TabsContent value="photo" className="mt-0 outline-none">
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
                  <div className="w-48 h-48 rounded-xl bg-muted flex items-center justify-center p-4 text-center border-2 border-dashed border-border">
                    <p className="text-muted-foreground text-sm">
                      No photo available. Upload a student photo in their profile or use the Live Camera tab.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="camera" className="mt-0 outline-none">
              <div className="flex justify-center">
                <div className="relative w-48 h-48 rounded-xl overflow-hidden bg-black border-2 border-primary/50">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover transform scale-x-1"
                    muted
                    playsInline
                  />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
                      <Camera className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground px-4 text-center">Camera starting...</p>
                    </div>
                  )}
                  {cameraActive && status === "detecting" && (
                    <div className="absolute inset-0 border-[3px] border-primary/50 border-dashed rounded-xl animate-pulse pointer-events-none" />
                  )}
                  {status === "success" && enrollMode === "camera" && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex flex-col items-center justify-center backdrop-blur-[2px]">
                      <CheckCircle className="h-10 w-10 text-emerald-500 mb-2 drop-shadow-md" />
                      <span className="text-white font-medium drop-shadow-md">Captured!</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Ensure the face is clearly visible, well-lit, and directly facing the camera.
              </p>
            </TabsContent>

            {/* Status Messages */}
            <div className="h-10 flex flex-col justify-center">
              {status === "loading_models" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading face recognition models...
                </div>
              )}
              {status === "detecting" && (
                <div className="flex items-center gap-2 text-sm text-primary justify-center font-medium">
                  <ScanFace className="h-4 w-4 animate-pulse" />
                  Detecting and encoding face...
                </div>
              )}
              {status === "success" && (
                <div className="flex items-center gap-2 text-sm text-emerald-500 justify-center font-medium bg-emerald-500/10 py-2 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                  Face enrolled successfully!
                </div>
              )}
              {status === "error" && (
                <div className="flex items-center gap-2 text-sm text-destructive justify-center bg-destructive/10 p-2 rounded-md px-3 text-center">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              The face descriptor is extracted securely to identify the student during attendance scanning.
            </p>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button 
            onClick={handleEnroll} 
            disabled={
              loading || 
              status === "success" || 
              (enrollMode === "photo" && !student.photo_url) ||
              (enrollMode === "camera" && !cameraActive)
            }
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : enrollMode === "camera" ? (
              <Camera className="mr-2 h-4 w-4" />
            ) : (
              <ScanFace className="mr-2 h-4 w-4" />
            )}
            {status === "success" ? "Enrolled" : enrollMode === "camera" ? "Capture & Enroll" : "Enroll Face"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

