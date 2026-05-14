import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStudentData } from "@/hooks/useStudentData";
import { Download, FileText, Video, BookOpen, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { StudentEmpty, StudentPanel } from "@/components/student/StudentUI";

const TYPE_CONFIG: Record<string, { label: string; icon: typeof FileText; tone: string }> = {
  notes: { label: "Notes", icon: BookOpen, tone: "student-tone-blue" },
  pdf: { label: "PDF", icon: FileText, tone: "student-tone-rose" },
  video: { label: "Video", icon: Video, tone: "student-tone-violet" },
  assignment: { label: "Assignment", icon: ClipboardList, tone: "student-tone-amber" },
};

const FILTERS = ["all", "notes", "pdf", "video", "assignment"] as const;

export default function StudentStudyMaterials() {
  const { student, loading: studentLoading } = useStudentData();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<typeof FILTERS[number]>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  useEffect(() => {
    if (!student) return;
    (async () => {
      const { data } = await supabase
        .from("study_materials")
        .select("*, subjects(name), classes(name)")
        .eq("class_id", student.class_id)
        .eq("school_id", student.school_id)
        .order("created_at", { ascending: false });

      const withUrls = await Promise.all(
        (data || []).map(async (m: any) => {
          if (m.file_url) {
            const pathMatch = m.file_url.match(/study-materials\/(.+)$/);
            if (pathMatch) {
              const { data: signedData } = await supabase.storage
                .from("study-materials")
                .createSignedUrl(pathMatch[1], 3600);
              return { ...m, file_url: signedData?.signedUrl || m.file_url };
            }
          }
          return m;
        })
      );

      setMaterials(withUrls);
      setLoading(false);
    })();
  }, [student]);

  if (studentLoading || loading) return <div className="pt-4 h-64 rounded-3xl bg-[hsl(var(--student-surface)/0.65)] animate-pulse" />;
  if (!student) return <StudentEmpty title="No student record found" />;

  const subjects = [...new Set(materials.map((m) => m.subjects?.name).filter(Boolean))] as string[];
  const filtered = materials.filter((m) => {
    if (filterType !== "all" && m.material_type !== filterType) return false;
    if (filterSubject !== "all" && m.subjects?.name !== filterSubject) return false;
    return true;
  });

  return (
    <div className="space-y-4 pb-6 pt-2 animate-fade-in">
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none">
        {FILTERS.map((t) => {
          const active = filterType === t;
          return (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition capitalize ${
                active
                  ? "bg-[hsl(var(--student-primary))] text-[hsl(var(--student-foreground))] shadow-[0_8px_18px_hsl(var(--student-primary)/0.32)]"
                  : "bg-[hsl(var(--student-surface)/0.65)] border border-[hsl(var(--student-border)/0.6)] text-[hsl(var(--student-foreground))]"
              }`}
            >
              {t === "all" ? "All Types" : t}
            </button>
          );
        })}
      </div>

      {subjects.length > 1 && (
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none">
          <button
            onClick={() => setFilterSubject("all")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition ${
              filterSubject === "all" ? "bg-[hsl(var(--student-blue)/0.2)] text-[hsl(var(--student-blue))]" : "bg-[hsl(var(--student-surface)/0.55)] student-muted-text"
            }`}
          >
            All subjects
          </button>
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setFilterSubject(s)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition ${
                filterSubject === s ? "bg-[hsl(var(--student-blue)/0.2)] text-[hsl(var(--student-blue))]" : "bg-[hsl(var(--student-surface)/0.55)] student-muted-text"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <StudentEmpty icon={BookOpen} title="No study materials" text="Materials uploaded by your teachers will appear here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const config = TYPE_CONFIG[m.material_type] || TYPE_CONFIG.notes;
            const Icon = config.icon;
            return (
              <StudentPanel key={m.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className={`student-mini-icon ${config.tone} h-11 w-11 shrink-0`}><Icon className="h-5 w-5" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-sm leading-snug">{m.title}</p>
                    {m.description && <p className="text-xs student-muted-text mt-1 line-clamp-2">{m.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold">
                  <span className={`px-2 py-0.5 rounded-full ${config.tone}`}>{config.label}</span>
                  {m.subjects?.name && <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--student-surface-2)/0.7)] student-muted-text">{m.subjects.name}</span>}
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[11px] student-muted-text">{format(new Date(m.created_at), "dd MMM yyyy")}</span>
                  {m.file_url && (
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[hsl(var(--student-primary)/0.15)] text-[hsl(var(--student-primary))] text-[11px] font-bold border border-[hsl(var(--student-primary)/0.25)] active:scale-95 transition"
                    >
                      <Download className="h-3 w-3" /> Open
                    </a>
                  )}
                </div>
              </StudentPanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
