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

interface ClassConfig {
  name: string;
  sections: string;
  subjects: Set<string>;
  customSubjects: string[];
}

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

  // Step 3: Classes selection
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());

  // Step 4: Per-class sections & subjects
  const [classConfigs, setClassConfigs] = useState<Record<string, ClassConfig>>({});
  const [customSubjectInput, setCustomSubjectInput] = useState<Record<string, string>>({});

  // Step 5: Grade System
  const [grades, setGrades] = useState(DEFAULT_GRADES);

  // Step 6: Fee Structure (optional)
  const [setupFees, setSetupFees] = useState(false);
  const [defaultFeeTypes, setDefaultFeeTypes] = useState([
    { name: "Admission Fee", amount: "" },
    { name: "Tuition Fee", amount: "" },
    { name: "Annual Fee", amount: "" },
    { name: "Exam Fee", amount: "" },
  ]);

  // Load school info
  useEffect(() => {
    if (!schoolId) return;
    supabase.from("schools").select("*").eq("id", schoolId).single().then(({ data }) => {
      if (data) {
        setSchoolInfo({
          name: data.name || "",
          principal_name: data.principal_name || "",
          website: data.website || "",
          school_start_time: data.school_start_time || "09:00",
          school_end_time: data.school_end_time || "16:00",
        });
      }
    });
  }, [schoolId]);

  // When classes are selected, initialize configs
  useEffect(() => {
    setClassConfigs((prev) => {
      const next = { ...prev };
      for (const cls of Array.from(selectedClasses)) {
        if (!next[cls]) {
          next[cls] = {
            name: cls,
            sections: "1",
            subjects: new Set(TELANGANA_SUBJECTS.slice(0, 6)),
            customSubjects: [],
          };
        }
      }
      // Remove unselected
      for (const key of Object.keys(next)) {
        if (!selectedClasses.has(key)) delete next[key];
      }
      return next;
    });
  }, [selectedClasses]);

  const toggleClass = (name: string) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const toggleSubjectForClass = (cls: string, subject: string) => {
    setClassConfigs((prev) => {
      const config = { ...prev[cls] };
      const subjects = new Set(config.subjects);
      subjects.has(subject) ? subjects.delete(subject) : subjects.add(subject);
      config.subjects = subjects;
      return { ...prev, [cls]: config };
    });
  };

  const setSectionsForClass = (cls: string, sections: string) => {
    setClassConfigs((prev) => ({
      ...prev,
      [cls]: { ...prev[cls], sections },
    }));
  };

  const addCustomSubjectForClass = (cls: string) => {
    const input = customSubjectInput[cls]?.trim();
    if (!input) return;
    setClassConfigs((prev) => {
      const config = { ...prev[cls] };
      config.customSubjects = [...config.customSubjects, input];
      config.subjects = new Set([...config.subjects, input]);
      return { ...prev, [cls]: config };
    });
    setCustomSubjectInput((prev) => ({ ...prev, [cls]: "" }));
  };

  const [activeClassTab, setActiveClassTab] = useState<string>("");

  useEffect(() => {
    const classes = Array.from(selectedClasses);
    if (classes.length > 0 && !selectedClasses.has(activeClassTab)) {
      setActiveClassTab(classes[0]);
    }
  }, [selectedClasses]);

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

      // 3. Collect all unique subjects
      const allSubjects = new Set<string>();
      Object.values(classConfigs).forEach((config) => {
        config.subjects.forEach((s) => allSubjects.add(s));
      });

      // 4. Create subjects
      const subjectIdMap: Record<string, string> = {};
      for (const subName of Array.from(allSubjects)) {
        const { data: sub } = await supabase.from("subjects").insert({
          school_id: schoolId,
          name: subName,
        }).select().single();
        if (sub) subjectIdMap[subName] = sub.id;
      }

      // 5. Create classes with sections and map subjects
      const classNames = Array.from(selectedClasses);
      for (let i = 0; i < classNames.length; i++) {
        const config = classConfigs[classNames[i]];
        const { data: cls } = await supabase.from("classes").insert({
          school_id: schoolId,
          name: classNames[i],
          display_order: i,
        }).select().single();
        
        if (cls) {
          // Create sections (A, B, C...)
          const sectionCount = parseInt(config.sections) || 1;
          for (let s = 0; s < sectionCount; s++) {
            const sectionName = String.fromCharCode(65 + s); // A, B, C...
            await supabase.from("sections").insert({
              class_id: cls.id,
              school_id: schoolId,
              name: sectionName,
            });
          }

          // Map subjects to this class
          for (const subName of Array.from(config.subjects)) {
            if (subjectIdMap[subName]) {
              await supabase.from("class_subjects").insert({
                school_id: schoolId,
                class_id: cls.id,
                subject_id: subjectIdMap[subName],
              });
            }
          }
        }
      }

      // 6. Create grade system
      for (const g of grades) {
        await supabase.from("grade_systems").insert({
          school_id: schoolId,
          min_marks: g.min,
          max_marks: g.max,
          grade: g.grade,
        });
      }

      // 7. Create default timetable slots
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

      // 8. Create fee types if opted
      if (setupFees) {
        for (const ft of defaultFeeTypes) {
          if (ft.name.trim()) {
            await supabase.from("fee_types").insert({
              school_id: schoolId,
              name: ft.name.trim(),
              description: ft.amount ? `Default: ₹${ft.amount}` : null,
            });
          }
        }
      }

      toast.success("School setup completed! 🎉");
      navigate("/school");
    } catch (err: any) {
      toast.error(err.message || "Setup failed");
    }
    setSaving(false);
  };

  const totalSteps = 7;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
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
              <p className="text-sm text-muted-foreground">Pre-filled from Super Admin. You can update details.</p>
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
              <p className="text-sm text-muted-foreground">Create the current academic year. Only one can be active at a time.</p>
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
              <p className="text-sm text-muted-foreground">Choose the classes your school offers.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DEFAULT_CLASSES.map((cls) => (
                  <label key={cls} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${selectedClasses.has(cls) ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                    <Checkbox checked={selectedClasses.has(cls)} onCheckedChange={() => toggleClass(cls)} />
                    <span className="text-sm font-medium">{cls}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{selectedClasses.size} classes selected</p>
            </div>
          )}

          {/* Step 4: Per-class Sections & Subjects */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Configure Sections & Subjects per Class</h3>
              <p className="text-sm text-muted-foreground">Set section count and select subjects for each class (Telangana SSC curriculum).</p>
              
              {/* Class tabs */}
              <div className="flex flex-wrap gap-2 border-b pb-2">
                {Array.from(selectedClasses).map((cls) => (
                  <button key={cls} onClick={() => setActiveClassTab(cls)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeClassTab === cls ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
                    {cls}
                  </button>
                ))}
              </div>

              {activeClassTab && classConfigs[activeClassTab] && (
                <div className="space-y-4">
                  {/* Sections */}
                  <div className="flex items-center gap-3">
                    <Label className="shrink-0">Number of Sections:</Label>
                    <Input type="number" min="1" max="10" className="w-20 h-8"
                      value={classConfigs[activeClassTab].sections}
                      onChange={(e) => setSectionsForClass(activeClassTab, e.target.value)} />
                    <span className="text-xs text-muted-foreground">
                      ({Array.from({ length: parseInt(classConfigs[activeClassTab].sections) || 1 }, (_, i) => String.fromCharCode(65 + i)).join(", ")})
                    </span>
                  </div>

                  {/* Subjects */}
                  <div>
                    <Label className="mb-2 block">Subjects for {activeClassTab}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {TELANGANA_SUBJECTS.map((sub) => (
                        <label key={sub} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm ${classConfigs[activeClassTab].subjects.has(sub) ? "border-primary/50 bg-primary/5" : "hover:bg-muted/50"}`}>
                          <Checkbox checked={classConfigs[activeClassTab].subjects.has(sub)} onCheckedChange={() => toggleSubjectForClass(activeClassTab, sub)} />
                          {sub}
                        </label>
                      ))}
                      {classConfigs[activeClassTab].customSubjects.map((sub) => (
                        <label key={sub} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm border-primary/50 bg-primary/5">
                          <Checkbox checked={classConfigs[activeClassTab].subjects.has(sub)} onCheckedChange={() => toggleSubjectForClass(activeClassTab, sub)} />
                          {sub}
                          <Badge variant="secondary" className="text-xs ml-auto">Custom</Badge>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Input
                        value={customSubjectInput[activeClassTab] || ""}
                        onChange={(e) => setCustomSubjectInput(p => ({ ...p, [activeClassTab]: e.target.value }))}
                        placeholder="Add custom subject"
                        className="h-8"
                        onKeyDown={(e) => e.key === "Enter" && addCustomSubjectForClass(activeClassTab)} />
                      <Button variant="outline" size="sm" onClick={() => addCustomSubjectForClass(activeClassTab)}>Add</Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{classConfigs[activeClassTab].subjects.size} subjects selected for {activeClassTab}</p>
                </div>
              )}
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

          {/* Step 6: Fee Structure (Optional) */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Fee Structure Setup (Optional)</h3>
              <p className="text-sm text-muted-foreground">Create default fee types now or skip and configure later.</p>
              <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer">
                <Checkbox checked={setupFees} onCheckedChange={(v) => setSetupFees(!!v)} />
                <span className="text-sm font-medium">Yes, I want to set up fee types now</span>
              </label>
              {setupFees && (
                <div className="space-y-3">
                  {defaultFeeTypes.map((ft, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <Input className="h-8" value={ft.name} placeholder="Fee Type Name"
                        onChange={(e) => setDefaultFeeTypes(prev => prev.map((f, idx) => idx === i ? { ...f, name: e.target.value } : f))} />
                      <Input className="h-8 w-28" type="number" placeholder="₹ Amount"
                        value={ft.amount}
                        onChange={(e) => setDefaultFeeTypes(prev => prev.map((f, idx) => idx === i ? { ...f, amount: e.target.value } : f))} />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setDefaultFeeTypes(prev => [...prev, { name: "", amount: "" }])}>
                    + Add More
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 7: Confirmation */}
          {step === 7 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Review & Finish</h3>
              <div className="space-y-3 text-sm max-h-[400px] overflow-y-auto">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">School</p>
                  <p className="font-medium">{schoolInfo.name}</p>
                  {schoolInfo.principal_name && <p>Principal: {schoolInfo.principal_name}</p>}
                  <p>Timings: {schoolInfo.school_start_time} — {schoolInfo.school_end_time}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Academic Year</p>
                  <p className="font-medium">{yearInfo.name}</p>
                  <p>{yearInfo.start_date} → {yearInfo.end_date}</p>
                </div>
                {Array.from(selectedClasses).map((cls) => {
                  const config = classConfigs[cls];
                  if (!config) return null;
                  return (
                    <div key={cls} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground">{cls}</p>
                      <p className="text-xs">Sections: {Array.from({ length: parseInt(config.sections) || 1 }, (_, i) => String.fromCharCode(65 + i)).join(", ")}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.from(config.subjects).map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                      </div>
                    </div>
                  );
                })}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Grades</p>
                  <div className="flex flex-wrap gap-1 mt-1">{grades.map((g) => <Badge key={g.grade} variant="outline">{g.grade} ({g.min}-{g.max})</Badge>)}</div>
                </div>
                {setupFees && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">Fee Types</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {defaultFeeTypes.filter(f => f.name.trim()).map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{f.name}{f.amount ? ` (₹${f.amount})` : ""}</Badge>
                      ))}
                    </div>
                  </div>
                )}
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
