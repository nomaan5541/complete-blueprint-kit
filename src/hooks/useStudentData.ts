import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useStudentData() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [onlineExams, setOnlineExams] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      setProfile(prof);
      if (!prof?.school_id) { setLoading(false); return; }

      // Load school info
      const { data: schoolData } = await supabase.from("schools").select("*").eq("id", prof.school_id).maybeSingle();
      setSchool(schoolData);

      const { data: stud } = await supabase.from("students").select("*, classes(name), sections(name), academic_years(name)")
        .eq("user_id", user!.id).eq("status", "active").maybeSingle();
      setStudent(stud);
      if (!stud) { setLoading(false); return; }

      const results = await Promise.all([
        supabase.from("attendance").select("*").eq("student_id", stud.id).order("date", { ascending: false }).limit(60),
        supabase.from("exam_marks").select("*, subjects(name), exams(name, exam_type)").eq("student_id", stud.id),
        supabase.from("fee_payments").select("*, fee_types(name)").eq("student_id", stud.id).order("payment_date", { ascending: false }),
        supabase.from("notifications").select("*").eq("school_id", prof.school_id).order("created_at", { ascending: false }).limit(20),
        stud.class_id ? supabase.from("timetable_entries").select("*, subjects(name), teachers(name), timetable_slots(name, start_time, end_time, slot_order, is_break)").eq("class_id", stud.class_id) : Promise.resolve({ data: [] }),
        supabase.from("timetable_slots").select("*").eq("school_id", prof.school_id).order("slot_order"),
        stud.class_id ? supabase.from("fee_structures").select("*, fee_types(name)").eq("school_id", prof.school_id).eq("class_id", stud.class_id).eq("academic_year_id", stud.academic_year_id) : Promise.resolve({ data: [] }),
        stud.class_id ? supabase.from("exams").select("*, subjects(name)").eq("school_id", prof.school_id).eq("class_id", stud.class_id) : Promise.resolve({ data: [] }),
        supabase.from("student_exam_attempts" as any).select("*").eq("student_id", stud.id),
        stud.class_id ? supabase.from("homework" as any).select("*, subjects(name), teachers(name)").eq("class_id", stud.class_id).eq("school_id", prof.school_id).eq("status", "active").order("due_date", { ascending: true }) : Promise.resolve({ data: [] }),
      ]);

      setAttendance((results[0] as any).data || []);
      setMarks((results[1] as any).data || []);
      setFees((results[2] as any).data || []);
      setNotifications((results[3] as any).data || []);
      setTimetable((results[4] as any).data || []);
      setSlots((results[5] as any).data || []);
      setFeeStructures((results[6] as any).data || []);
      setOnlineExams((results[7] as any).data || []);
      setAttempts((results[8] as any).data || []);
      setHomeworkList((results[9] as any).data || []);
      setLoading(false);
    }
    fetch();
  }, [user]);

  const presentDays = attendance.filter((a) => a.status === "present").length;
  const totalDays = attendance.length;
  const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : "0";
  const totalPaid = fees.reduce((sum, f) => sum + Number(f.amount), 0);

  const feeDues = feeStructures.map((fs: any) => {
    const paid = fees.filter((f: any) => f.fee_type_id === fs.fee_type_id).reduce((sum: number, f: any) => sum + Number(f.amount), 0);
    const due = Number(fs.amount) - paid;
    return { ...fs, paid, due: due > 0 ? due : 0 };
  });
  const totalDue = feeDues.reduce((sum, d) => sum + d.due, 0);
  const totalFeeAmount = feeStructures.reduce((sum, fs) => sum + Number(fs.amount), 0);

  return {
    profile, student, school, attendance, marks, fees, feeStructures, notifications,
    timetable, slots, onlineExams, attempts, homeworkList, loading,
    presentDays, totalDays, attendanceRate, totalPaid, feeDues, totalDue, totalFeeAmount,
  };
}
