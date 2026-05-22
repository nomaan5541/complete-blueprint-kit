import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const CACHE_PREFIX = "student_cache_v1:";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function readCache(userId: string) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(userId: string, data: any) {
  try {
    localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // quota — best effort
  }
}

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

  const hydrateFromCache = (cached: any) => {
    if (!cached) return false;
    setProfile(cached.profile ?? null);
    setStudent(cached.student ?? null);
    setSchool(cached.school ?? null);
    setAttendance(cached.attendance ?? []);
    setMarks(cached.marks ?? []);
    setFees(cached.fees ?? []);
    setFeeStructures(cached.feeStructures ?? []);
    setNotifications(cached.notifications ?? []);
    setTimetable(cached.timetable ?? []);
    setSlots(cached.slots ?? []);
    setOnlineExams(cached.onlineExams ?? []);
    setAttempts(cached.attempts ?? []);
    setHomeworkList(cached.homeworkList ?? []);
    return true;
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    // 1) Instant paint from cache (stale-while-revalidate)
    const cached = readCache(user.id);
    const hadCache = hydrateFromCache(cached);
    if (hadCache) setLoading(false);

    async function fetchFresh() {
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (cancelled) return;
      setProfile(prof);
      if (!prof?.school_id) { setLoading(false); return; }

      const { data: schoolData } = await supabase.from("schools").select("*").eq("id", prof.school_id).maybeSingle();
      if (cancelled) return;
      setSchool(schoolData);

      const { data: stud } = await supabase.from("students").select("*, classes(name), sections(name), academic_years(name)")
        .eq("user_id", user!.id).eq("status", "active").maybeSingle();
      if (cancelled) return;
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

      if (cancelled) return;

      const fresh = {
        profile: prof,
        student: stud,
        school: schoolData,
        attendance: (results[0] as any).data || [],
        marks: (results[1] as any).data || [],
        fees: (results[2] as any).data || [],
        notifications: (results[3] as any).data || [],
        timetable: (results[4] as any).data || [],
        slots: (results[5] as any).data || [],
        feeStructures: (results[6] as any).data || [],
        onlineExams: (results[7] as any).data || [],
        attempts: (results[8] as any).data || [],
        homeworkList: (results[9] as any).data || [],
      };

      setAttendance(fresh.attendance);
      setMarks(fresh.marks);
      setFees(fresh.fees);
      setNotifications(fresh.notifications);
      setTimetable(fresh.timetable);
      setSlots(fresh.slots);
      setFeeStructures(fresh.feeStructures);
      setOnlineExams(fresh.onlineExams);
      setAttempts(fresh.attempts);
      setHomeworkList(fresh.homeworkList);
      setLoading(false);

      writeCache(user!.id, fresh);
    }

    // If offline and we have cache, skip network; otherwise fetch
    if (!navigator.onLine && hadCache) {
      setLoading(false);
    } else {
      fetchFresh().catch(() => { if (!cancelled) setLoading(false); });
    }

    return () => { cancelled = true; };
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
