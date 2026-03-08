import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SchoolAdminLayout } from "@/components/SchoolAdminLayout";
import { TeacherLayout } from "@/components/TeacherLayout";
import { StudentLayout } from "@/components/StudentLayout";
import { useSchool } from "@/hooks/useSchool";
import OfflineBanner from "@/components/OfflineBanner";
import InstallApp from "@/pages/InstallApp";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Schools from "./pages/Schools";
import AddSchool from "./pages/AddSchool";
import SchoolDetail from "./pages/SchoolDetail";
import EditSchool from "./pages/EditSchool";
import Subscriptions from "./pages/Subscriptions";
import SubscriptionRequests from "./pages/SubscriptionRequests";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

// School Admin pages
import SchoolDashboard from "./pages/school/SchoolDashboard";
import AcademicYears from "./pages/school/AcademicYears";
import ClassesAndSections from "./pages/school/ClassesAndSections";
import Subjects from "./pages/school/Subjects";
import Students from "./pages/school/Students";
import Teachers from "./pages/school/Teachers";
import SchoolSettings from "./pages/school/SchoolSettings";
import FeeManagement from "./pages/school/FeeManagement";
import Attendance from "./pages/school/Attendance";
import ExamManagement from "./pages/school/ExamManagement";
import StudentPromotion from "./pages/school/StudentPromotion";
import SetupWizard from "./pages/school/SetupWizard";
import Timetable from "./pages/school/Timetable";
import Notifications from "./pages/school/Notifications";
import SchoolReports from "./pages/school/SchoolReports";
import ClassSubjectMapping from "./pages/school/ClassSubjectMapping";
import ReportCard from "./pages/school/ReportCard";
import StudentProfile from "./pages/school/StudentProfile";
import BulkStudentImport from "./pages/school/BulkStudentImport";
import FeeDues from "./pages/school/FeeDues";
import StudentTransfer from "./pages/school/StudentTransfer";
import StudentDocuments from "./pages/school/StudentDocuments";
import SchoolCalendar from "./pages/school/SchoolCalendar";
import Meetings from "./pages/school/Meetings";
import AuditLogs from "./pages/school/AuditLogs";
import StudentExamTake from "./pages/school/StudentExamTake";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherMarks from "./pages/teacher/TeacherMarks";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherTimetable from "./pages/teacher/TeacherTimetable";
import TeacherHomework from "./pages/teacher/TeacherHomework";
import TeacherExams from "./pages/teacher/TeacherExams";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import TeacherNotifications from "./pages/teacher/TeacherNotifications";
import TeacherAnalytics from "./pages/teacher/TeacherAnalytics";
import TeacherExamMonitor from "./pages/teacher/TeacherExamMonitor";
import TeacherMeetings from "./pages/teacher/TeacherMeetings";

// Student pages
import StudentDashboardPage from "./pages/student/StudentDashboard";
import StudentProfilePage from "./pages/student/StudentProfile";
import StudentAttendancePage from "./pages/student/StudentAttendance";
import StudentResultsPage from "./pages/student/StudentResults";
import StudentFeesPage from "./pages/student/StudentFees";
import StudentTimetablePage from "./pages/student/StudentTimetable";
import StudentNotificationsPage from "./pages/student/StudentNotifications";
import StudentHomeworkPage from "./pages/student/StudentHomework";
import StudentIDCardPage from "./pages/student/StudentIDCard";
import StudentStudyMaterialsPage from "./pages/student/StudentStudyMaterials";
import StudentOnlineExamsPage from "./pages/student/StudentOnlineExams";
import StudentMeetings from "./pages/student/StudentMeetings";

const queryClient = new QueryClient();

function SuperAdminRoutes() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/schools" element={<Schools />} />
        <Route path="/schools/add" element={<AddSchool />} />
        <Route path="/schools/:id" element={<SchoolDetail />} />
        <Route path="/schools/:id/edit" element={<EditSchool />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/subscription-requests" element={<SubscriptionRequests />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DashboardLayout>
  );
}

function SchoolAdminRoutesWrapper() {
  const { setupCompleted, loading } = useSchool();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  
  if (!setupCompleted) {
    return (
      <Routes>
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="*" element={<Navigate to="/school/setup" replace />} />
      </Routes>
    );
  }

  return (
    <SchoolAdminLayout>
      <Routes>
        <Route path="/" element={<SchoolDashboard />} />
        <Route path="/academic-years" element={<AcademicYears />} />
        <Route path="/classes" element={<ClassesAndSections />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/subject-mapping" element={<ClassSubjectMapping />} />
        <Route path="/report-card" element={<ReportCard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/students/profile" element={<StudentProfile />} />
        <Route path="/students/import" element={<BulkStudentImport />} />
        <Route path="/students/transfer" element={<StudentTransfer />} />
        <Route path="/promotion" element={<StudentPromotion />} />
        <Route path="/fees/dues" element={<FeeDues />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/exams" element={<ExamManagement />} />
        <Route path="/fees" element={<FeeManagement />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reports" element={<SchoolReports />} />
        <Route path="/documents" element={<StudentDocuments />} />
        <Route path="/calendar" element={<SchoolCalendar />} />
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/settings" element={<SchoolSettings />} />
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SchoolAdminLayout>
  );
}

function TeacherRoutesWrapper() {
  return (
    <TeacherLayout>
      <Routes>
        <Route path="/" element={<TeacherDashboard />} />
        <Route path="/profile" element={<TeacherProfile />} />
        <Route path="/attendance" element={<TeacherAttendance />} />
        <Route path="/exams" element={<TeacherExams />} />
        <Route path="/marks" element={<TeacherMarks />} />
        <Route path="/exam-monitor" element={<TeacherExamMonitor />} />
        <Route path="/homework" element={<TeacherHomework />} />
        <Route path="/students" element={<TeacherStudents />} />
        <Route path="/timetable" element={<TeacherTimetable />} />
        <Route path="/notifications" element={<TeacherNotifications />} />
        <Route path="/analytics" element={<TeacherAnalytics />} />
        <Route path="/meetings" element={<TeacherMeetings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TeacherLayout>
  );
}

function StudentPortalWrapper() {
  return (
    <StudentLayout>
      <Routes>
        <Route path="/" element={<StudentDashboardPage />} />
        <Route path="/profile" element={<StudentProfilePage />} />
        <Route path="/attendance" element={<StudentAttendancePage />} />
        <Route path="/results" element={<StudentResultsPage />} />
        <Route path="/exam" element={<StudentOnlineExamsPage />} />
        <Route path="/exam-take" element={<StudentExamTake />} />
        <Route path="/fees" element={<StudentFeesPage />} />
        <Route path="/timetable" element={<StudentTimetablePage />} />
        <Route path="/homework" element={<StudentHomeworkPage />} />
        <Route path="/notifications" element={<StudentNotificationsPage />} />
        <Route path="/materials" element={<StudentStudyMaterialsPage />} />
        <Route path="/id-card" element={<StudentIDCardPage />} />
        <Route path="/meetings" element={<StudentMeetings />} />
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Routes>
    </StudentLayout>
  );
}

function ProtectedRoutes() {
  const { user, loading, role } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;

  if (role === "student") {
    return (
      <Routes>
        <Route path="/student/*" element={<StudentPortalWrapper />} />
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Routes>
    );
  }

  if (role === "teacher") {
    return (
      <Routes>
        <Route path="/teacher/*" element={<TeacherRoutesWrapper />} />
        <Route path="*" element={<Navigate to="/teacher" replace />} />
      </Routes>
    );
  }

  if (role === "school_admin") {
    return (
      <Routes>
        <Route path="/school/*" element={<SchoolAdminRoutesWrapper />} />
        <Route path="*" element={<Navigate to="/school" replace />} />
      </Routes>
    );
  }

  // Default: super_admin
  return (
    <Routes>
      <Route path="/admin/*" element={<SuperAdminRoutes />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  return (
    <Routes>
      <Route path="/" element={user ? <ProtectedRedirect /> : <LandingPage />} />
      <Route path="/login" element={user ? <ProtectedRedirect /> : <Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/install" element={<InstallApp />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

function ProtectedRedirect() {
  const { role } = useAuth();
  if (role === "super_admin") return <Navigate to="/admin" replace />;
  if (role === "school_admin") return <Navigate to="/school" replace />;
  if (role === "teacher") return <Navigate to="/teacher" replace />;
  if (role === "student") return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
