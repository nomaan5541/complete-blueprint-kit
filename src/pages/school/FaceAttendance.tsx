import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Camera, Loader2, User, Users, Check, ScanFace, StopCircle, Save, Sparkles } from "lucide-react";
import { descriptorToArray } from "@/lib/faceRecognition";
import { format } from "date-fns";
import {
  loadFaceModels,
  extractFaceDescriptor,
  extractAllFaceDescriptors,
  arrayToDescriptor,
  findBestMatch,
  findAllMatches,
} from "@/lib/faceRecognition";

interface KnownFace {
  studentId: string;
  studentName: string;
  descriptor: Float32Array;
}

interface DetectedStudent {
  studentId: string;
  studentName: string;
  time: string;
  confidence: number;
}

export default function FaceAttendance() {
  const { schoolId } = useSchool();
  const { selectedYearId } = useAcademicYear();
  const { user } = useAuth();

  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [modelsReady, setModelsReady] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [knownFaces, setKnownFaces] = useState<KnownFace[]>([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);

  const [scanning, setScanning] = useState(false);
  const [detectedStudents, setDetectedStudents] = useState<DetectedStudent[]>([]);
  const [saving, setSaving] = useState(false);
  const [bulkEnrolling, setBulkEnrolling] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, ok: 0, fail: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load classes and sections
  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("sections").select("*").eq("school_id", schoolId),
    ]).then(([c, s]) => {
      setClasses(c.data || []);
      setSections(s.data || []);
    });
  }, [schoolId]);

  // Load face models
  const handleLoadModels = async () => {
    setLoadingModels(true);
    try {
      await loadFaceModels();
      setModelsReady(true);
      toast.success("Face recognition models loaded");
    } catch (e) {
      toast.error("Failed to load face recognition models");
      console.error(e);
    } finally {
      setLoadingModels(false);
    }
  };

  // Load known faces for selected class
  useEffect(() => {
    if (!schoolId || !selectedClass || !selectedYearId) return;

    async function loadFaces() {
      // Get students in class
      let studQuery = supabase
        .from("students")
        .select("id, name")
        .eq("school_id", schoolId!)
        .eq("class_id", selectedClass)
        .eq("academic_year_id", selectedYearId!)
        .eq("status", "active");
      if (selectedSection) studQuery = studQuery.eq("section_id", selectedSection);
      const { data: students } = await studQuery;
      setTotalStudents(students?.length || 0);

      if (!students?.length) {
        setKnownFaces([]);
        setEnrolledCount(0);
        return;
      }

      const studentIds = students.map((s) => s.id);
      const { data: faceData } = await supabase
        .from("student_face_data" as any)
        .select("student_id, face_descriptor")
        .eq("school_id", schoolId!)
        .in("student_id", studentIds);

      const faces: KnownFace[] = (faceData || []).map((fd: any) => {
        const student = students.find((s) => s.id === fd.student_id);
        return {
          studentId: fd.student_id,
          studentName: student?.name || "Unknown",
          descriptor: arrayToDescriptor(fd.face_descriptor as number[]),
        };
      });

      setKnownFaces(faces);
      setEnrolledCount(faces.length);
    }

    loadFaces();
  }, [schoolId, selectedClass, selectedSection, selectedYearId]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return true;
    } catch (e) {
      toast.error("Cannot access camera. Please allow camera permission.");
      return false;
    }
  };

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Single scan mode
  const handleSingleScan = async () => {
    if (!modelsReady) {
      toast.error("Please load face models first");
      return;
    }
    if (knownFaces.length === 0) {
      toast.error("No enrolled faces found for this class. Please enroll student photos first.");
      return;
    }

    const cameraReady = await startCamera();
    if (!cameraReady) return;
    setScanning(true);

    // Scan every 2 seconds
    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      try {
        const descriptor = await extractFaceDescriptor(videoRef.current);
        if (!descriptor) return;

        const match = findBestMatch(descriptor, knownFaces, 0.5);
        if (match) {
          setDetectedStudents((prev) => {
            if (prev.some((d) => d.studentId === match.studentId)) return prev;
            toast.success(`✅ Detected: ${match.studentName}`);
            return [
              ...prev,
              {
                studentId: match.studentId,
                studentName: match.studentName,
                time: format(new Date(), "hh:mm:ss a"),
                confidence: Math.round((1 - match.distance) * 100),
              },
            ];
          });
        }
      } catch (e) {
        console.error("Scan error:", e);
      }
    }, 2000);
  };

  // Group scan mode
  const handleGroupScan = async () => {
    if (!modelsReady) {
      toast.error("Please load face models first");
      return;
    }
    if (knownFaces.length === 0) {
      toast.error("No enrolled faces found for this class.");
      return;
    }

    const cameraReady = await startCamera();
    if (!cameraReady) return;
    setScanning(true);

    // Scan every 3 seconds for group mode
    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      try {
        const descriptors = await extractAllFaceDescriptors(videoRef.current);
        if (!descriptors.length) return;

        const matches = findAllMatches(descriptors, knownFaces, 0.5);
        if (matches.length > 0) {
          setDetectedStudents((prev) => {
            const newDetections = matches.filter(
              (m) => !prev.some((d) => d.studentId === m.studentId)
            );
            if (newDetections.length > 0) {
              toast.success(`Detected ${newDetections.length} new student(s)`);
            }
            return [
              ...prev,
              ...newDetections.map((m) => ({
                studentId: m.studentId,
                studentName: m.studentName,
                time: format(new Date(), "hh:mm:ss a"),
                confidence: Math.round((1 - m.distance) * 100),
              })),
            ];
          });
        }
      } catch (e) {
        console.error("Group scan error:", e);
      }
    }, 3000);
  };

  // Save detected attendance
  const handleSaveAttendance = async () => {
    if (!schoolId || !selectedClass || !selectedYearId || detectedStudents.length === 0) return;
    setSaving(true);

    try {
      // Get all students in this class to mark absent those not detected
      let studQuery = supabase
        .from("students")
        .select("id")
        .eq("school_id", schoolId)
        .eq("class_id", selectedClass)
        .eq("academic_year_id", selectedYearId)
        .eq("status", "active");
      if (selectedSection) studQuery = studQuery.eq("section_id", selectedSection);
      const { data: allStudents } = await studQuery;

      const detectedIds = new Set(detectedStudents.map((d) => d.studentId));

      const records = (allStudents || []).map((s) => ({
        school_id: schoolId,
        student_id: s.id,
        class_id: selectedClass,
        section_id: selectedSection || null,
        academic_year_id: selectedYearId,
        date: selectedDate,
        status: detectedIds.has(s.id) ? "present" : "absent",
        marked_by: user?.id || null,
      }));

      // Delete existing then insert fresh records
      await supabase
        .from("attendance")
        .delete()
        .eq("school_id", schoolId)
        .eq("class_id", selectedClass)
        .eq("date", selectedDate)
        .eq("academic_year_id", selectedYearId);

      const { error } = await supabase.from("attendance").insert(records);
      if (error) throw error;

      toast.success(
        `Attendance saved! ${detectedStudents.length} present, ${(allStudents?.length || 0) - detectedStudents.length} absent`
      );
      stopCamera();
    } catch (e: any) {
      toast.error("Failed to save attendance: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeDetected = (studentId: string) => {
    setDetectedStudents((prev) => prev.filter((d) => d.studentId !== studentId));
  };

  const filteredSections = sections.filter((s) => s.class_id === selectedClass);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ScanFace className="h-8 w-8 text-primary" />
          AI Face Attendance
        </h1>
        <p className="text-muted-foreground">
          Automatically detect and mark attendance using face recognition
        </p>
      </div>

      {/* Model loader */}
      {!modelsReady && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Load Face Recognition Models</p>
                <p className="text-sm text-muted-foreground">
                  One-time download (~6MB). Models run locally in your browser.
                </p>
              </div>
              <Button onClick={handleLoadModels} disabled={loadingModels}>
                {loadingModels ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                  </>
                ) : (
                  <>
                    <ScanFace className="mr-2 h-4 w-4" /> Load Models
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class/Section/Date selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class & Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSection(""); setDetectedStudents([]); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Section</Label>
              <Select value={selectedSection} onValueChange={(v) => { setSelectedSection(v); setDetectedStudents([]); }}>
                <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {filteredSections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Enrollment Status</Label>
              <div className="flex items-center h-10 gap-2">
                <Badge variant={enrolledCount > 0 ? "default" : "destructive"}>
                  {enrolledCount}/{totalStudents} enrolled
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanning area */}
      {selectedClass && modelsReady && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" /> Camera Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <p className="text-white/60 text-sm">Camera will activate when you start scanning</p>
                  </div>
                )}
                {scanning && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-red-500 text-white animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white mr-1.5 inline-block" />
                      SCANNING
                    </Badge>
                  </div>
                )}
              </div>

              <Tabs defaultValue="single" className="mt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="single" className="flex-1">
                    <User className="h-4 w-4 mr-1" /> One-by-One
                  </TabsTrigger>
                  <TabsTrigger value="group" className="flex-1">
                    <Users className="h-4 w-4 mr-1" /> Group Scan
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="single" className="mt-3">
                  <p className="text-sm text-muted-foreground mb-3">
                    Students walk up to the camera one at a time. Best accuracy.
                  </p>
                  {!scanning ? (
                    <Button onClick={handleSingleScan} className="w-full" disabled={enrolledCount === 0}>
                      <ScanFace className="mr-2 h-4 w-4" /> Start Single Scan
                    </Button>
                  ) : (
                    <Button onClick={stopCamera} variant="destructive" className="w-full">
                      <StopCircle className="mr-2 h-4 w-4" /> Stop Scanning
                    </Button>
                  )}
                </TabsContent>
                <TabsContent value="group" className="mt-3">
                  <p className="text-sm text-muted-foreground mb-3">
                    Point camera at a group of students. Detects multiple faces at once.
                  </p>
                  {!scanning ? (
                    <Button onClick={handleGroupScan} className="w-full" disabled={enrolledCount === 0}>
                      <Users className="mr-2 h-4 w-4" /> Start Group Scan
                    </Button>
                  ) : (
                    <Button onClick={stopCamera} variant="destructive" className="w-full">
                      <StopCircle className="mr-2 h-4 w-4" /> Stop Scanning
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Detected Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-500" />
                  Detected Students
                </span>
                <Badge variant="outline" className="text-lg">
                  {detectedStudents.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detectedStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ScanFace className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No students detected yet</p>
                  <p className="text-sm">Start scanning to detect students</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Match</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detectedStudents.map((d) => (
                        <TableRow key={d.studentId}>
                          <TableCell className="font-medium">{d.studentName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{d.time}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                d.confidence >= 80
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : d.confidence >= 60
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-destructive/10 text-destructive"
                              }
                            >
                              {d.confidence}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeDetected(d.studentId)}
                            >
                              ✕
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {detectedStudents.length > 0 && (
                <Button
                  className="w-full mt-4"
                  onClick={handleSaveAttendance}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Attendance ({detectedStudents.length} present, {totalStudents - detectedStudents.length} absent)
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
