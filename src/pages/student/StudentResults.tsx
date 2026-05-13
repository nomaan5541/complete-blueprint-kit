import { useStudentData } from "@/hooks/useStudentData";
import { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { StudentEmpty, StudentPanel } from "@/components/student/StudentUI";

export default function StudentResults() {
  const { student, marks, loading } = useStudentData();
  const examNames = useMemo(() => Array.from(new Set(marks.map((m: any) => m.exams?.name).filter(Boolean))), [marks]);
  const [exam, setExam] = useState<string>("");
  const current = exam || examNames[0] || "";
  if (loading) return <div className="pt-4 h-64 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />;
  if (!student) return <StudentEmpty title="No student record found" />;
  const examMarks = marks.filter((m: any) => m.exams?.name === current);
  const totalObtained = examMarks.reduce((s: number, m: any) => s + Number(m.marks_obtained || 0), 0);
  const totalMax = examMarks.reduce((s: number, m: any) => s + Number(m.max_marks || 0), 0);
  const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : "D";
  const highest = Math.max(...examMarks.map((m: any) => (m.max_marks ? (m.marks_obtained / m.max_marks) * 100 : 0)), 0);
  const gradeFor = (p: number) => p >= 90 ? "A+" : p >= 80 ? "A" : p >= 70 ? "B+" : p >= 60 ? "B" : p >= 50 ? "C" : "D";

  return <div className="space-y-5 pb-6 pt-2 animate-fade-in">
    {examNames.length > 1 && <select value={current} onChange={(e) => setExam(e.target.value)} className="w-full student-panel px-4 py-3 text-sm focus:outline-none"><>{examNames.map((n) => <option key={n} value={n} className="bg-[hsl(var(--student-surface))]">{n}</option>)}</></select>}
    {examMarks.length === 0 ? <StudentEmpty icon={BarChart3} title="No exam results yet" /> : <>
      <StudentPanel className="p-5 grid gap-4 sm:grid-cols-[160px_1fr] items-center">
        <div className="relative h-32 w-32 mx-auto">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90"><circle cx="50" cy="50" r="42" stroke="hsl(var(--student-border))" strokeWidth="8" fill="none" /><circle cx="50" cy="50" r="42" stroke="hsl(var(--student-primary))" strokeWidth="8" fill="none" strokeDasharray={`${(pct / 100) * 264} 264`} strokeLinecap="round" /></svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><p className="text-[10px] student-muted-text">Overall</p><p className="text-4xl font-extrabold text-[hsl(var(--student-amber))]">{grade}</p><p className="text-xs student-muted-text">{pct.toFixed(1)}%</p></div>
        </div>
        <div className="space-y-3 text-sm"><Row label="Highest Score" value={`${highest.toFixed(0)}%`} /><Row label="Class Average" value={`${pct.toFixed(0)}%`} /><Row label="Total" value={`${totalObtained}/${totalMax}`} /><Row label="Subjects" value={examMarks.length} /></div>
      </StudentPanel>
      <StudentPanel className="overflow-hidden">{examMarks.map((m: any) => { const p = m.max_marks > 0 ? (m.marks_obtained / m.max_marks) * 100 : 0; const g = m.grade || gradeFor(p); return <div key={m.id} className="px-4 py-3.5 flex items-center gap-3 border-b last:border-0 border-[hsl(var(--student-border)/0.55)]"><p className="font-bold text-sm flex-1 truncate">{m.subjects?.name || "—"}</p><p className="text-sm font-extrabold tabular-nums">{m.marks_obtained ?? 0} <span className="student-muted-text font-normal">/ {m.max_marks}</span></p><span className="student-chip">{g}</span></div>; })}</StudentPanel>
    </>}
  </div>;
}
function Row({ label, value }: { label: string; value: any }) { return <div className="flex items-center gap-2"><span className="text-[hsl(var(--student-green))]">◆</span><span className="student-muted-text flex-1">{label}</span><span className="font-extrabold">{value}</span></div>; }
