import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, Check, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TELANGANA_SUBJECTS = [
  "Telugu", "Hindi", "English", "Mathematics", "General Science",
  "Social Studies", "Computer", "Physical Education", "Drawing",
];

const DEFAULT_CLASSES = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
];

const DEFAULT_GRADES = [
  { min: 90, max: 100, grade: "A+" },
  { min: 80, max: 89, grade: "A" },
  { min: 70, max: 79, grade: "B+" },
  { min: 60, max: 69, grade: "B" },
  { min: 50, max: 59, grade: "C" },
  { min: 40, max: 49, grade: "D" },
  { min: 0, max: 39, grade: "F" },
];

export default function SetupWizard() {
  const { schoolId } = useSchool();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: School Info
  const [schoolInfo, setSchoolInfo] = useState({
    name: "", principal_name: "", website: "",
    school_start_time: "09:00", school_end_time: "16:00",
  });

  // Step 2: Academic Year
  const [yearInfo, setYearInfo] = useState({ name: "2025-2026", start_date: "2025-06-01", end_date: "2026-04-30" });

  // Step 3: Classes
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());

  // Step 4: Subjects
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set(TELANGANA_SUBJECTS.slice(0, 6)));
  const [customSubject, setCustomSubject] = useState("");
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);

  // Step 5: Grade System
  const [grades, setGrades] = useState(DEFAULT_GRADES);

  // Load school info
  useEffect(() => {
    if (!schoolId) return;
    supabase.from("schools").select("*").eq("id", schoolId).single().then(({ data }) => {
      if (data) {
        setSchoolInfo({
          name: data.name || "",
          principal_name: (data as any).principal_name || "",
          website: (data as any).website || "",
          school_start_time: (data as any).school_start_time || "09:00",
          school_end_time: (data as any).school_end_time || "16:00",
        });
      }
    });
  }, [schoolId]);

  const toggleClass = (name: string) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const toggleSubject = (name: string) => {
    setSelectedSubjects((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const addCustomSubject = () => {
    if (!customSubject.trim()) return;
    const name = customSubject.trim();
    setCustomSubjects((prev) => [...prev, name]);
    setSelectedSubjects((prev) => new Set([...prev, name]));
    setCustomSubject("");
  };

  const handleFinish = async () => {
    if (!schoolId) return;
    setSaving(true);
    try {
      // 1. Update school info
      await supabase.from("schools").update({
        name: schoolInfo.name,
        principal_name: schoolInfo.principal_name,
        website: schoolInfo.website,
        school_start_time: schoolInfo.school_start_time,
        school_end_time: schoolInfo.school_end_time,
        setup_completed: true,
      } as any).eq("id", schoolId);

      // 2. Create academic year
      await supabase.from("academic_years").insert({
        school_id: schoolId,
        name: yearInfo.name,
        start_date: yearInfo.start_date,
        end_date: yearInfo.end_date,
        status: "active",
      });

      // 3. Create classes with sections (default: Section A)
      const classNames = Array.from(selectedClasses);
      for (let i = 0; i < classNames.length; i++) {
        const { data: cls } = await supabase.from("classes").insert({
          school_id: schoolId,
          name: classNames[i],
          display_order: i,
        }).select().single();
        if (cls) {
          await supabase.from("sections").insert({
            class_id: cls.id,
            school_id: schoolId,
            name: "A",
          });
        }
      }

      // 4. Create subjects
      const allSubjects = Array.from(selectedSubjects);
      for (const subName of allSubjects) {
        await supabase.from("subjects").insert({
          school_id: schoolId,
          name: subName,
        });
      }

      // 5. Create grade system
      for (const g of grades) {
        await supabase.from("grade_systems").insert({
          school_id: schoolId,
          min_marks: g.min,
          max_marks: g.max,
          grade: g.grade,
        });
      }

      // 6. Create default timetable slots
      const defaultSlots = [
        { name: "Period 1", start_time: "09:00", end_time: "09:45", slot_order: 0, is_break: false },
        { name: "Period 2", start_time: "09:45", end_time: "10:30", slot_order: 1, is_break: false },
        { name: "Period 3", start_time: "10:30", end_time: "11:15", slot_order: 2, is_break: false },
        { name: "Break", start_time: "11:15", end_time: "11:30", slot_order: 3, is_break: true },
        { name: "Period 4", start_time: "11:30", end_time: "12:15", slot_order: 4, is_break: false },
        { name: "Period 5", start_time: "12:15", end_time: "13:00", slot_order: 5, is_break: false },
        { name: "Lunch", start_time: "13:00", end_time: "13:45", slot_order: 6, is_break: true },
        { name: "Period 6", start_time: "13:45", end_time: "14:30", slot_order: 7, is_break: false },
        { name: "Period 7", start_time: "14:30", end_time: "15:15", slot_order: 8, is_break: false },
      ];
      for (const slot of defaultSlots) {
        await supabase.from("timetable_slots").insert({ school_id: schoolId, ...slot });
      }

      toast.success("School setup completed! 🎉");
      navigate("/school");
    } catch (err: any) {
      toast.error(err.message || "Setup failed");
    }
    setSaving(false);
  };

  const totalSteps = 6;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-2">
            <GraduationCap className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">School Setup Wizard</CardTitle>
          <CardDescription>Step {step} of {totalSteps} — Configure your school</CardDescription>
          <div className="flex gap-1 justify-center mt-3">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className={`h-2 w-12 rounded-full ${i < step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: School Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">School Information</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1"><Label>School Name</Label><Input value={schoolInfo.name} onChange={(e) => setSchoolInfo(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Principal Name</Label><Input value={schoolInfo.principal_name} onChange={(e) => setSchoolInfo(p => ({ ...p, principal_name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Website</Label><Input value={schoolInfo.website} onChange={(e) => setSchoolInfo(p => ({ ...p, website: e.target.value }))} placeholder="https://" /></div>
                <div className="space-y-1"><Label>School Start Time</Label><Input type="time" value={schoolInfo.school_start_time} onChange={(e) => setSchoolInfo(p => ({ ...p, school_start_time: e.target.value }))} /></div>
                <div className="space-y-1"><Label>School End Time</Label><Input type="time" value={schoolInfo.school_end_time} onChange={(e) => setSchoolInfo(p => ({ ...p, school_end_time: e.target.value }))} /></div>
              </div>
            </div>
          )}

          {/* Step 2: Academic Year */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Academic Year Setup</h3>
              <p className="text-sm text-muted-foreground">Create the current academic year. Only one can be active.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1"><Label>Academic Year Name</Label><Input value={yearInfo.name} onChange={(e) => setYearInfo(p => ({ ...p, name: e.target.value }))} placeholder="2025-2026" /></div>
                <div className="space-y-1"><Label>Start Date</Label><Input type="date" value={yearInfo.start_date} onChange={(e) => setYearInfo(p => ({ ...p, start_date: e.target.value }))} /></div>
                <div className="space-y-1"><Label>End Date</Label><Input type="date" value={yearInfo.end_date} onChange={(e) => setYearInfo(p => ({ ...p, end_date: e.target.value }))} /></div>
              </div>
            </div>
          )}

          {/* Step 3: Classes */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Select Classes</h3>
              <p className="text-sm text-muted-foreground">Choose the classes your school offers. A default Section A will be created for each.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DEFAULT_CLASSES.map((cls) => (
                  <label key={cls} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50">
                    <Checkbox checked={selectedClasses.has(cls)} onCheckedChange={() => toggleClass(cls)} />
                    <span className="text-sm">{cls}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{selectedClasses.size} classes selected</p>
            </div>
          )}

          {/* Step 4: Subjects */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Select Subjects (Telangana SSC Based)</h3>
              <p className="text-sm text-muted-foreground">Choose subjects. You can also add custom subjects.</p>
              <div className="grid grid-cols-2 gap-3">
                {TELANGANA_SUBJECTS.map((sub) => (
                  <label key={sub} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50">
                    <Checkbox checked={selectedSubjects.has(sub)} onCheckedChange={() => toggleSubject(sub)} />
                    <span className="text-sm">{sub}</span>
                  </label>
                ))}
                {customSubjects.map((sub) => (
                  <label key={sub} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 bg-primary/5">
                    <Checkbox checked={selectedSubjects.has(sub)} onCheckedChange={() => toggleSubject(sub)} />
                    <span className="text-sm">{sub}</span>
                    <Badge variant="secondary" className="text-xs ml-auto">Custom</Badge>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} placeholder="Add custom subject" onKeyDown={(e) => e.key === "Enter" && addCustomSubject()} />
                <Button variant="outline" onClick={addCustomSubject}>Add</Button>
              </div>
            </div>
          )}

          {/* Step 5: Grade System */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Grade System</h3>
              <p className="text-sm text-muted-foreground">Define grading scale for report cards.</p>
              <div className="space-y-2">
                {grades.map((g, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <Input type="number" className="w-20 h-8" value={g.min} onChange={(e) => setGrades(prev => prev.map((gr, idx) => idx === i ? { ...gr, min: parseInt(e.target.value) || 0 } : gr))} />
                    <span className="text-muted-foreground">to</span>
                    <Input type="number" className="w-20 h-8" value={g.max} onChange={(e) => setGrades(prev => prev.map((gr, idx) => idx === i ? { ...gr, max: parseInt(e.target.value) || 0 } : gr))} />
                    <span className="text-muted-foreground">→</span>
                    <Input className="w-20 h-8" value={g.grade} onChange={(e) => setGrades(prev => prev.map((gr, idx) => idx === i ? { ...gr, grade: e.target.value } : gr))} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Confirmation */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Review & Finish</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">School</p>
                  <p className="font-medium">{schoolInfo.name}</p>
                  {schoolInfo.principal_name && <p>Principal: {schoolInfo.principal_name}</p>}
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Academic Year</p>
                  <p className="font-medium">{yearInfo.name}</p>
                  <p>{yearInfo.start_date} → {yearInfo.end_date}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Classes ({selectedClasses.size})</p>
                  <div className="flex flex-wrap gap-1 mt-1">{Array.from(selectedClasses).map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Subjects ({selectedSubjects.size})</p>
                  <div className="flex flex-wrap gap-1 mt-1">{Array.from(selectedSubjects).map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Grades</p>
                  <div className="flex flex-wrap gap-1 mt-1">{grades.map((g) => <Badge key={g.grade} variant="outline">{g.grade} ({g.min}-{g.max})</Badge>)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {step < totalSteps ? (
              <Button onClick={() => setStep(step + 1)}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Finish Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
