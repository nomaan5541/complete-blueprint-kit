import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Download, GraduationCap } from "lucide-react";

export default function TeacherIDCard() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      
      setTeacher(teacherData);

      if (teacherData?.school_id) {
        const { data: schoolData } = await supabase
          .from("schools")
          .select("name, city, state, logo_url, address, phone")
          .eq("id", teacherData.school_id)
          .maybeSingle();
        setSchool(schoolData);
      }
      setLoading(false);
    }
    fetchData();
  }, [user]);

  const handleDownload = () => {
    if (!cardRef.current || !teacher) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Staff ID Card - ${teacher.name}</title>
      <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; font-family: system-ui, sans-serif; }
        .card { width: 340px; border: 2px solid #1a1a2e; border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e3a5f, #2d5a87); color: white; padding: 16px; text-align: center; }
        .header h1 { margin: 0; font-size: 16px; letter-spacing: 1px; }
        .header p { margin: 4px 0 0; font-size: 11px; opacity: 0.8; }
        .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 2px 10px; border-radius: 10px; font-size: 10px; margin-top: 6px; }
        .body { padding: 20px; display: flex; gap: 16px; }
        .photo { width: 80px; height: 100px; border-radius: 8px; object-fit: cover; border: 2px solid #e0e0e0; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #999; flex-shrink: 0; }
        .info { flex: 1; }
        .info .row { margin-bottom: 6px; }
        .info .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        .info .value { font-size: 13px; font-weight: 600; color: #333; }
        .footer { background: #f8f9fa; padding: 10px 20px; border-top: 1px solid #eee; text-align: center; font-size: 10px; color: #888; }
        @media print { body { background: white; } .card { box-shadow: none; } }
      </style></head><body>
      <div class="card">
        <div class="header">
          <h1>${school?.name || "EDUPRIMEX"}</h1>
          <p>${school?.city ? [school.city, school.state].filter(Boolean).join(", ") : "Staff Identity Card"}</p>
          <span class="badge">STAFF</span>
        </div>
        <div class="body">
          <div class="photo">${teacher.photo_url ? `<img src="${teacher.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" />` : teacher.name?.charAt(0)}</div>
          <div class="info">
            <div class="row"><div class="label">Name</div><div class="value">${teacher.name}</div></div>
            <div class="row"><div class="label">Employee ID</div><div class="value">${teacher.employee_id || "—"}</div></div>
            <div class="row"><div class="label">Department</div><div class="value">${teacher.specialization || "—"}</div></div>
            <div class="row"><div class="label">Joining Date</div><div class="value">${teacher.joining_date || "—"}</div></div>
            <div class="row"><div class="label">Emergency Contact</div><div class="value">${teacher.phone || "—"}</div></div>
          </div>
        </div>
        <div class="footer">Staff Identity Card · ${new Date().getFullYear()}</div>
      </div>
      <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!teacher) return <div className="text-center py-20 text-muted-foreground">No teacher record found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Staff ID Card</h1>
        <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download / Print</Button>
      </div>

      <div className="flex justify-center">
        <div ref={cardRef} className="w-[360px] rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              {school?.logo_url ? (
                <img src={school.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <GraduationCap className="h-6 w-6" />
              )}
              <h2 className="text-lg font-bold tracking-wide">{school?.name || "EDUPRIMEX"}</h2>
            </div>
            {school?.city && <p className="text-xs opacity-80">{[school.city, school.state].filter(Boolean).join(", ")}</p>}
            <span className="inline-block mt-2 bg-white/20 text-[10px] px-3 py-0.5 rounded-full font-medium tracking-wider">STAFF</span>
          </div>

          {/* Body */}
          <div className="bg-card p-5 flex gap-4">
            <Avatar className="h-24 w-28 rounded-lg shrink-0">
              <AvatarImage src={teacher.photo_url} className="object-cover" />
              <AvatarFallback className="rounded-lg text-2xl bg-primary/10 text-primary">{teacher.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1.5 text-sm">
              <IDField label="Name" value={teacher.name} />
              <IDField label="Employee ID" value={teacher.employee_id || "—"} />
              <IDField label="Department" value={teacher.specialization || "—"} />
              <IDField label="Joining Date" value={teacher.joining_date || "—"} />
              <IDField label="Emergency" value={teacher.phone || "—"} />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground border-t">
            Staff Identity Card · {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}

function IDField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <p className="font-semibold text-xs leading-tight">{value}</p>
    </div>
  );
}
