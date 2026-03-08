import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Camera, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  children?: React.ReactNode;
}

export default function CameraCapture({ onCapture, children }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const startCamera = async (facing: "user" | "environment" = facingMode) => {
    try {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setCapturedImage(null);
    } catch {
      toast.error("Camera access denied or not available");
      setOpen(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setCapturedImage(null);
    setTimeout(() => startCamera(), 100);
  };

  const handleClose = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCapturedImage(null);
    setOpen(false);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  const toggleCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  };

  const confirm = () => {
    if (!capturedImage) return;
    fetch(capturedImage)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
        handleClose();
      });
  };

  return (
    <>
      <div onClick={handleOpen} className="cursor-pointer">
        {children || (
          <Button type="button" variant="outline" size="sm" className="gap-2">
            <Camera className="h-4 w-4" /> Take Photo
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Camera</DialogTitle>
          </DialogHeader>
          <div className="relative bg-black aspect-[4/3]">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <DialogFooter className="p-4 flex justify-center gap-3">
            {capturedImage ? (
              <>
                <Button variant="outline" onClick={() => { setCapturedImage(null); startCamera(); }} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Retake
                </Button>
                <Button onClick={confirm}>Use Photo</Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="icon" onClick={toggleCamera}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button size="lg" className="rounded-full w-16 h-16" onClick={capture}>
                  <Camera className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
