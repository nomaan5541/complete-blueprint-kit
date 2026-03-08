import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";

export default function ReportCard() {
  const { schoolId } = useSchool();
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [marks, setMarks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<{ total: number; present: number }>({ total: 0, present: 0 });
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!schoolId) return;
    async function fetch() {
      const [cRes, eRes, sRes, gRes] = await Promise.all([
        supabase.from("classes").select("*").eq("school_id", schoolId!).order("display_order"),
        supabase.from("exams").select("*, academic_years(name)").eq("school_id", schoolId!).order("created_at", { ascending: false }),
        supabase.from("schools").select("*").eq("id", schoolId!).single(),
        supabase.from("grade_systems").select("*").eq("school_id", schoolId!).order("min_marks", { ascending: false }),
      ]);
      setClasses(cRes.data || []);
      setExams(eRes.data || []);
      setSchool(sRes.data);
      setGrades(gRes.data || []);
      setLoading(false);
    }
    fetch();
  }, [schoolId]);

  useEffect(() => {
    if (!selectedClass || !schoolId) return;
    async function fetchStudents() {
      const { data } = await supabase.from("students")
        .select("id, name, admission_number, father_name, mother_name, date_of_birth, roll_number, photo_url, class_id")
        .eq("school_id", schoolId!).eq("class_id", selectedClass).eq("status", "active").order("name");
      setStudents(data || []);
    }
    fetchStudents();
  }, [selectedClass, schoolId]);

  useEffect(() => {
    if (!selectedStudent || !selectedExam) { setMarks([]); return; }
    async function fetchMarks() {
      const { data } = await supabase.from("exam_marks")
        .select("*, subjects(name)")
        .eq("student_id", selectedStudent)
        .eq("exam_id", selectedExam);
      setMarks(data || []);
    }
    fetchMarks();
  }, [selectedStudent, selectedExam]);

  // Fetch attendance for selected student
  useEffect(() => {
    if (!selectedStudent || !schoolId) { setAttendance({ total: 0, present: 0 }); return; }
    async function fetchAttendance() {
      const { data } = await supabase.from("attendance")
        .select("status")
        .eq("student_id", selectedStudent)
        .eq("school_id", schoolId!);
      const total = data?.length || 0;
      const present = data?.filter(a => a.status === "present").length || 0;
      setAttendance({ total, present });
    }
    fetchAttendance();
  }, [selectedStudent, schoolId]);

  const getGrade = (pct: number) => {
    if (grades.length > 0) {
      const g = grades.find(g => pct >= Number(g.min_marks) && pct <= Number(g.max_marks));
      return g?.grade || "—";
    }
    // Default grade scale
    if (pct >= 91) return "A1";
    if (pct >= 81) return "A2";
    if (pct >= 71) return "B1";
    if (pct >= 61) return "B2";
    if (pct >= 51) return "C1";
    if (pct >= 41) return "C2";
    if (pct >= 33) return "D";
    return "E";
  };

  const getRemarks = (pct: number) => {
    if (pct >= 91) return "Outstanding";
    if (pct >= 81) return "Excellent";
    if (pct >= 71) return "Very Good";
    if (pct >= 61) return "Good";
    if (pct >= 51) return "Fair";
    if (pct >= 41) return "Average";
    if (pct >= 33) return "Needs Improvement";
    return "Fail";
  };

  const totalObtained = marks.reduce((sum, m) => sum + (Number(m.marks_obtained) || 0), 0);
  const totalMax = marks.reduce((sum, m) => sum + Number(m.max_marks), 0);
  const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : "0";
  const overallGrade = getGrade(parseFloat(percentage));

  const student = students.find(s => s.id === selectedStudent);
  const exam = exams.find(e => e.id === selectedExam);
  const cls = classes.find(c => c.id === selectedClass);
  const attendancePct = attendance.total > 0 ? ((attendance.present / attendance.total) * 100).toFixed(1) : "0";

  const handlePrint = () => window.print();

  const defaultGradeScale = [
    { grade: "A1", range: "91–100", label: "Outstanding" },
    { grade: "A2", range: "81–90", label: "Excellent" },
    { grade: "B1", range: "71–80", label: "Very Good" },
    { grade: "B2", range: "61–70", label: "Good" },
    { grade: "C1", range: "51–60", label: "Fair" },
    { grade: "C2", range: "41–50", label: "Average" },
    { grade: "D", range: "33–40", label: "Needs Improvement" },
    { grade: "E", range: "Below 33", label: "Fail" },
  ];

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-3xl font-bold">Report Card</h1>
        <p className="text-muted-foreground">Generate and print student report cards</p>
      </div>

      <div className="flex flex-wrap gap-4 no-print">
        <div className="space-y-1">
          <Label>Class</Label>
          <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedStudent(""); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Exam</Label>
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select exam" /></SelectTrigger>
            <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Student</Label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.admission_number})</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {selectedStudent && selectedExam && marks.length > 0 && (
        <>
          <div className="no-print flex justify-end">
            <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Report Card</Button>
          </div>

          <div ref={printRef} className="print-area">
            <div className="max-w-[210mm] mx-auto bg-white text-black border-2 border-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
              {/* Decorative top border */}
              <div className="border-b-2 border-black">
                {/* School Header */}
                <div className="text-center pt-6 pb-4 px-8">
                  {school?.logo_url && (
                    <div className="flex justify-center mb-3">
                      <img src={school.logo_url} alt="School Logo" className="h-20 w-20 object-contain" />
                    </div>
                  )}
                  <h1 className="text-3xl font-bold uppercase tracking-wide">{school?.name}</h1>
                  {school?.address && (
                    <p className="text-sm mt-1">
                      {[school.address, school.city, school.state].filter(Boolean).join(", ")}
                      {school?.phone && ` | Phone: ${school.phone}`}
                    </p>
                  )}

                  {/* Report Card Title */}
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <span className="block w-16 border-t-2 border-black" />
                    <span className="text-xl font-bold tracking-widest">REPORT CARD</span>
                    <span className="block w-16 border-t-2 border-black" />
                  </div>

                  {/* Academic Year */}
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <span className="block w-24 border-t border-black" />
                    <span className="text-base font-semibold">{exam?.academic_years?.name || "2025-2026"}</span>
                    <span className="block w-24 border-t border-black" />
                  </div>
                </div>
              </div>

              {/* Student Information Section */}
              <div className="border-b-2 border-black px-8 py-5">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="block w-8 border-t border-black" />
                  <span className="font-bold text-sm uppercase tracking-wider bg-black text-white px-3 py-0.5">Student Information</span>
                  <span className="block w-8 border-t border-black" />
                </div>

                <div className="flex gap-6">
                  <div className="flex-1 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                      <div>
                        <span className="text-gray-600">Name: </span>
                        <strong className="text-base">{student?.name}</strong>
                      </div>
                      <div>
                        <span className="text-gray-600">Roll No: </span>
                        <strong>{student?.roll_number || "—"}</strong>
                      </div>
                      <div>
                        <span className="text-gray-600">Father's Name: </span>
                        <strong>{student?.father_name || "—"}</strong>
                      </div>
                      <div>
                        <span className="text-gray-600">Admission: </span>
                        <strong>{student?.admission_number}</strong>
                      </div>
                      <div>
                        <span className="text-gray-600">Mother's Name: </span>
                        <strong>{student?.mother_name || "—"}</strong>
                      </div>
                      <div>
                        <span className="text-gray-600">Class: </span>
                        <strong>{cls?.name}</strong>
                      </div>
                      <div>
                        <span className="text-gray-600">DOB: </span>
                        <strong>{student?.date_of_birth || "—"}</strong>
                      </div>
                      <div>
                        <span className="text-gray-600">Exam: </span>
                        <strong>{exam?.exam_type}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Student Photo */}
                  <div className="shrink-0">
                    {student?.photo_url ? (
                      <img src={student.photo_url} alt={student.name} className="w-24 h-28 object-cover border-2 border-black" />
                    ) : (
                      <div className="w-24 h-28 border-2 border-black flex items-center justify-center bg-gray-100">
                        <span className="text-xs text-gray-400 text-center">Student<br />Photo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Marks Table */}
              <div className="px-8 py-5 border-b-2 border-black">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border-2 border-black bg-gray-900 text-white px-3 py-2 text-left font-bold">SUBJECTS</th>
                      <th className="border-2 border-black bg-gray-900 text-white px-3 py-2 text-center font-bold w-20">MAX<br />MARKS</th>
                      <th className="border-2 border-black bg-gray-900 text-white px-3 py-2 text-center font-bold w-24">MARKS<br />OBTAINED</th>
                      <th className="border-2 border-black bg-gray-900 text-white px-3 py-2 text-center font-bold w-20">GRADE</th>
                      <th className="border-2 border-black bg-gray-900 text-white px-3 py-2 text-center font-bold w-28">REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((m) => {
                      const pct = Number(m.max_marks) > 0 ? (Number(m.marks_obtained || 0) / Number(m.max_marks)) * 100 : 0;
                      return (
                        <tr key={m.id}>
                          <td className="border-2 border-black px-3 py-2 font-medium">{m.subjects?.name}</td>
                          <td className="border-2 border-black px-3 py-2 text-center font-bold">{m.max_marks}</td>
                          <td className="border-2 border-black px-3 py-2 text-center font-bold">{m.marks_obtained ?? "—"}</td>
                          <td className="border-2 border-black px-3 py-2 text-center font-bold">{getGrade(pct)}</td>
                          <td className="border-2 border-black px-3 py-2 text-center">{m.remarks || getRemarks(pct)}</td>
                        </tr>
                      );
                    })}
                    {/* Grand Total Row */}
                    <tr className="font-bold bg-gray-100">
                      <td className="border-2 border-black px-3 py-2 font-bold">Grand Total</td>
                      <td className="border-2 border-black px-3 py-2 text-center">{totalMax}</td>
                      <td className="border-2 border-black px-3 py-2 text-center">{totalObtained}</td>
                      <td className="border-2 border-black px-3 py-2 text-center">{overallGrade}</td>
                      <td className="border-2 border-black px-3 py-2 text-center">{getRemarks(parseFloat(percentage))}</td>
                    </tr>
                    {/* Percentage Row */}
                    <tr className="font-bold">
                      <td className="border-2 border-black px-3 py-2" colSpan={2}>Overall Percentage</td>
                      <td className="border-2 border-black px-3 py-2 text-center text-lg" colSpan={3}>{percentage}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Attendance & Grade Scale */}
              <div className="px-8 py-5 border-b-2 border-black">
                <div className="grid grid-cols-3 gap-6 text-xs">
                  {/* Attendance */}
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <span className="block w-4 border-t border-black" />
                      <span className="font-bold text-sm uppercase">Attendance</span>
                      <span className="block w-4 border-t border-black" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>Total Days:</span><strong>{attendance.total}</strong></div>
                      <div className="flex justify-between"><span>Present:</span><strong>{attendance.present}</strong></div>
                      <div className="flex justify-between"><span>Percentage:</span><strong>{attendancePct}%</strong></div>
                    </div>
                  </div>

                  {/* Grade Scale - Left */}
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <span className="block w-4 border-t border-black" />
                      <span className="font-bold text-sm uppercase">Grades</span>
                      <span className="block w-4 border-t border-black" />
                    </div>
                    <div className="space-y-0.5">
                      {defaultGradeScale.slice(0, 4).map(g => (
                        <div key={g.grade} className="flex gap-2">
                          <strong className="w-6">{g.grade}</strong>
                          <span className="w-14">{g.range}</span>
                          <span>{g.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grade Scale - Right */}
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <span className="block w-4 border-t border-black" />
                      <span className="font-bold text-sm uppercase">Grades</span>
                      <span className="block w-4 border-t border-black" />
                    </div>
                    <div className="space-y-0.5">
                      {defaultGradeScale.slice(4).map(g => (
                        <div key={g.grade} className="flex gap-2">
                          <strong className="w-6">{g.grade}</strong>
                          <span className="w-14">{g.range}</span>
                          <span>{g.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="px-8 py-6">
                <div className="grid grid-cols-3 gap-4 text-sm text-center">
                  <div>
                    <div className="border-t-2 border-black mt-10 pt-2">Parent Signature</div>
                  </div>
                  <div>
                    <div className="border-t-2 border-black mt-10 pt-2">Class Teacher Signature</div>
                  </div>
                  <div>
                    <div className="border-t-2 border-black mt-10 pt-2">Principal Signature</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedStudent && selectedExam && marks.length === 0 && (
        <p className="text-muted-foreground text-center py-10">No marks found for this student in the selected exam.</p>
      )}
    </div>
  );
}
