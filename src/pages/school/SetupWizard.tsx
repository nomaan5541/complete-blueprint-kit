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
import { Loader2, ArrowRight, ArrowLeft, Check, GraduationCap, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  // Step 3: Configure sections per auto-seeded class
  const [autoClasses, setAutoClasses] = useState<any[]>([]);
  const [classSections, setClassSections] = useState<Record<string, string>>({});

  // Step 4: Grade System
  const [grades, setGrades] = useState(DEFAULT_GRADES);

  // Step 5: Fee Structure (optional)
  const [setupFees, setSetupFees] = useState(false);
  const [defaultFeeTypes, setDefaultFeeTypes] = useState([
    { name: "Admission Fee", amount: "" },
    { name: "Tuition Fee", amount: "" },
    { name: "Annual Fee", amount: "" },
    { name: "Exam Fee", amount: "" },
  ]);

  // Auto-seeded data info
  const [autoSubjects, setAutoSubjects] = useState<any[]>([]);
  const [autoRoles, setAutoRoles] = useState<any[]>([]);

  // Load school info + auto-seeded data
  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      supabase.from("schools").select("*").eq("id", schoolId).single(),
      supabase.from("classes").select("*").eq("school_id", schoolId).order("display_order"),
      supabase.from("subjects").select("*").eq("school_id", schoolId),
      supabase.from("school_roles").select("*").eq("school_id", schoolId),
    ]).then(([schoolRes, classRes, subRes, roleRes]) => {
      if (schoolRes.data) {
        setSchoolInfo({
          name: schoolRes.data.name || "",
          principal_name: schoolRes.data.principal_name || "",
          website: schoolRes.data.website || "",
          school_start_time: schoolRes.data.school_start_time || "09:00",
          school_end_time: schoolRes.data.school_end_time || "16:00",
        });
      }
      const classes = classRes.data || [];
      setAutoClasses(classes);
      const sectionMap: Record<string, string> = {};
      classes.forEach((c: any) => { sectionMap[c.id] = "1"; });
      setClassSections(sectionMap);
      setAutoSubjects(subRes.data || []);
      setAutoRoles(roleRes.data || []);
    });
  }, [schoolId]);

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

      // 3. Create sections for each auto-seeded class
      for (const cls of autoClasses) {
        const sectionCount = parseInt(classSections[cls.id]) || 1;
        for (let s = 0; s < sectionCount; s++) {
          const sectionName = String.fromCharCode(65 + s);
          await supabase.from("sections").insert({
            class_id: cls.id,
            school_id: schoolId,
            name: sectionName,
          });
        }

        // Map all subjects to each class
        for (const sub of autoSubjects) {
          await supabase.from("class_subjects").insert({
            school_id: schoolId,
            class_id: cls.id,
            subject_id: sub.id,
          });
        }
      }

      // 4. Create grade system
      for (const g of grades) {
        await supabase.from("grade_systems").insert({
          school_id: schoolId,
          min_marks: g.min,
          max_marks: g.max,
          grade: g.grade,
        });
      }

      // 5. Create default timetable slots
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

      // 6. Create fee types if opted
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

  const totalSteps = 6;

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
              <div key={i} className={`h-2 w-12 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: School Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">School Information</h3>
              <p className="text-sm text-muted-foreground">Pre-filled from Super Admin. You can update details.</p>

              {/* Auto-seeded summary */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Auto-configured for your school
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Classes</p>
                    <p className="font-medium">{autoClasses.length} classes created</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Subjects</p>
                    <p className="font-medium">{autoSubjects.length} subjects added</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Roles</p>
                    <p className="font-medium">{autoRoles.length} roles defined</p>
                  </div>
                </div>
              </div>

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

          {/* Step 3: Configure Sections per Class */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Configure Sections</h3>
              <p className="text-sm text-muted-foreground">
                Classes and subjects were auto-created. Set the number of sections for each class.
              </p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {autoClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="font-medium text-sm">{cls.name}</span>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Sections:</Label>
                      <Input
                        type="number" min="1" max="10" className="w-16 h-8"
                        value={classSections[cls.id] || "1"}
                        onChange={(e) => setClassSections(p => ({ ...p, [cls.id]: e.target.value }))}
                      />
                      <span className="text-xs text-muted-foreground w-24">
                        ({Array.from({ length: parseInt(classSections[cls.id]) || 1 }, (_, i) => String.fromCharCode(65 + i)).join(", ")})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="text-muted-foreground">Auto-seeded subjects:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {autoSubjects.map((s) => <Badge key={s.id} variant="secondary" className="text-xs">{s.name}</Badge>)}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Grade System */}
          {step === 4 && (
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

          {/* Step 5: Fee Structure (Optional) */}
          {step === 5 && (
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

          {/* Step 6: Confirmation */}
          {step === 6 && (
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
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Classes & Sections</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {autoClasses.map((cls) => (
                      <Badge key={cls.id} variant="secondary" className="text-xs">
                        {cls.name} ({Array.from({ length: parseInt(classSections[cls.id]) || 1 }, (_, i) => String.fromCharCode(65 + i)).join(",")})
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Subjects (auto-seeded)</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {autoSubjects.map((s) => <Badge key={s.id} variant="outline" className="text-xs">{s.name}</Badge>)}
                  </div>
                </div>
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
