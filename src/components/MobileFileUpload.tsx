import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, FileImage } from "lucide-react";
import CameraCapture from "./CameraCapture";
import { validateFileUpload } from "@/lib/fileValidation";
import { toast } from "sonner";

interface MobileFileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
  showCamera?: boolean;
}

export default function MobileFileUpload({
  onFileSelect,
  accept = "image/*,.pdf",
  label = "Upload File",
  showCamera = true,
}: MobileFileUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const err = validateFileUpload(file);
    if (err) { toast.error(err); return; }
    onFileSelect(file);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Regular file picker */}
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
        <Upload className="h-4 w-4" /> {label}
      </Button>
      <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

      {/* Native camera capture (for mobile gallery/camera) */}
      {showCamera && (
        <>
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => cameraRef.current?.click()}>
            <FileImage className="h-4 w-4" /> Gallery
          </Button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

          {/* In-app camera with preview */}
          <CameraCapture onCapture={onFileSelect}>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Camera className="h-4 w-4" /> Camera
            </Button>
          </CameraCapture>
        </>
      )}
    </div>
  );
}
