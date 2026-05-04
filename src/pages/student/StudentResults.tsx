import { useStudentData } from "@/hooks/useStudentData";
import { useState, useMemo } from "react";

export default function StudentResults() {
  const { student, marks, loading } = useStudentData();
  const examNames = useMemo(() => Array.from(new Set(marks.map((m: any) => m.exams?.name).filter(Boolean))), [marks]);
  const [exam, setExam] = useState<string>("");
  const current = exam || examNames[0] || "";

  if (loading) return <div className="pt-4 h-64 rounded-2xl bg-white/5 animate-pulse" />;
  if (!student) return <div className="text-center py-20 text-slate-400">No student record found</div>;

  const examMarks = marks.filter((m: any) => m.exams?.name === current);
  const totalObtained = examMarks.reduce((s: number, m: any) => s + Number(m.marks_obtained || 0), 0);
  const totalMax = examMarks.reduce((s: number, m: any) => s + Number(m.max_marks || 0), 0);
  const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : "D";
  const highest = Math.max(...examMarks.map((m: any) => (m.max_marks ? (m.marks_obtained / m.max_marks) * 100 : 0)), 0);

  function gradeFor(p: number) { return p >= 90 ? "A+" : p >= 80 ? "A" : p >= 70 ? "B+" : p >= 60 ? "B" : p >= 50 ? "C" : "D"; }
  function gradeColor(g: string) {
    if (g.startsWith("A")) return "text-emerald-300 bg-emerald-500/15";
    if (g.startsWith("B")) return "text-blue-300 bg-blue-500/15";
    if (g.startsWith("C")) return "text-amber-300 bg-amber-500/15";
    return "text-rose-300 bg-rose-500/15";
  }

  return (
    <div className="space-y-4 pb-6 pt-2">
      {examNames.length > 1 && (
        <select
          value={current}
          onChange={(e) => setExam(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
        >
          {examNames.map((n) => <option key={n} value={n} className="bg-[#0f1530]">{n}</option>)}
        </select>
      )}

      {examMarks.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-400 text-sm">
          No exam results yet
        </div>
      ) : (
        <>
          {/* Overall card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-center">
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                <circle cx="50" cy="50" r="42" stroke="url(#g1)" strokeWidth="8" fill="none"
                  strokeDasharray={`${(pct / 100) * 264} 264`} strokeLinecap="round" />
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[10px] text-slate-400 leading-none">Overall</p>
                <p className="text-2xl font-extrabold text-violet-300">{grade}</p>
                <p className="text-[10px] text-slate-300 leading-none">{pct.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2 text-xs">
              <Row label="Highest Score" value={`${highest.toFixed(0)}%`} />
              <Row label="Total" value={`${totalObtained}/${totalMax}`} />
              <Row label="Subjects" value={examMarks.length} />
            </div>
          </div>

          {/* Subjects list */}
          <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
            {examMarks.map((m: any) => {
              const p = m.max_marks > 0 ? (m.marks_obtained / m.max_marks) * 100 : 0;
              const g = m.grade || gradeFor(p);
              return (
                <div key={m.id} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{m.subjects?.name || "—"}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums">{m.marks_obtained ?? 0} <span className="text-slate-500 font-normal">/ {m.max_marks}</span></p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${gradeColor(g)}`}>{g}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-emerald-300">●</span>
      <span className="text-slate-400 flex-1">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
