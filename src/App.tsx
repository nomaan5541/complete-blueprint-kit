import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useSchool } from "@/hooks/useSchool";
import OfflineBanner from "@/components/OfflineBanner";

// Layouts - keep eager since they wrap routes
import { DashboardLayout } from "@/components/DashboardLayout";
import { SchoolAdminLayout } from "@/components/SchoolAdminLayout";
import { TeacherLayout } from "@/components/TeacherLayout";
import { StudentLayout } from "@/components/StudentLayout";

// Lazy-loaded pages
import LandingPage from "./pages/LandingPage";
const PricingPage = lazy(() => import("./pages/PricingPage"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const InstallApp = lazy(() => import("@/pages/InstallApp"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Super Admin pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Schools = lazy(() => import("./pages/Schools"));
const AddSchool = lazy(() => import("./pages/AddSchool"));
const SchoolDetail = lazy(() => import("./pages/SchoolDetail"));
const EditSchool = lazy(() => import("./pages/EditSchool"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const SubscriptionRequests = lazy(() => import("./pages/SubscriptionRequests"));
const Payments = lazy(() => import("./pages/Payments"));
const Reports = lazy(() => import("./pages/Reports"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AIAnalytics = lazy(() => import("./pages/AIAnalytics"));
const FestivalThemes = lazy(() => import("./pages/FestivalThemes"));

// School Admin pages
const SchoolDashboard = lazy(() => import("./pages/school/SchoolDashboard"));
const AcademicYears = lazy(() => import("./pages/school/AcademicYears"));
const ClassesAndSections = lazy(() => import("./pages/school/ClassesAndSections"));
const Subjects = lazy(() => import("./pages/school/Subjects"));
const Students = lazy(() => import("./pages/school/Students"));
const Teachers = lazy(() => import("./pages/school/Teachers"));
const SchoolSettings = lazy(() => import("./pages/school/SchoolSettings"));
const FeeManagement = lazy(() => import("./pages/school/FeeManagement"));
const Attendance = lazy(() => import("./pages/school/Attendance"));
const ExamManagement = lazy(() => import("./pages/school/ExamManagement"));
const StudentPromotion = lazy(() => import("./pages/school/StudentPromotion"));
const SetupWizard = lazy(() => import("./pages/school/SetupWizard"));
const Timetable = lazy(() => import("./pages/school/Timetable"));
const Notifications = lazy(() => import("./pages/school/Notifications"));
const SchoolReports = lazy(() => import("./pages/school/SchoolReports"));
const ClassSubjectMapping = lazy(() => import("./pages/school/ClassSubjectMapping"));
const ReportCard = lazy(() => import("./pages/school/ReportCard"));
const StudentProfile = lazy(() => import("./pages/school/StudentProfile"));
const BulkStudentImport = lazy(() => import("./pages/school/BulkStudentImport"));
const FeeDues = lazy(() => import("./pages/school/FeeDues"));
const StudentTransfer = lazy(() => import("./pages/school/StudentTransfer"));
const StudentDocuments = lazy(() => import("./pages/school/StudentDocuments"));
const SchoolCalendar = lazy(() => import("./pages/school/SchoolCalendar"));
const Meetings = lazy(() => import("./pages/school/Meetings"));
const AuditLogs = lazy(() => import("./pages/school/AuditLogs"));
const BackupRestore = lazy(() => import("./pages/school/BackupRestore"));
const StudentExamTake = lazy(() => import("./pages/school/StudentExamTake"));
const FaceAttendance = lazy(() => import("./pages/school/FaceAttendance"));
const AIReportCard = lazy(() => import("./pages/school/AIReportCard"));
const StudentArchive = lazy(() => import("./pages/school/StudentArchive"));
const BulkIDCardGenerator = lazy(() => import("./pages/school/BulkIDCardGenerator"));

// Teacher pages
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const TeacherAttendance = lazy(() => import("./pages/teacher/TeacherAttendance"));
const TeacherMarks = lazy(() => import("./pages/teacher/TeacherMarks"));
const TeacherStudents = lazy(() => import("./pages/teacher/TeacherStudents"));
const TeacherTimetable = lazy(() => import("./pages/teacher/TeacherTimetable"));
const TeacherHomework = lazy(() => import("./pages/teacher/TeacherHomework"));
const TeacherExams = lazy(() => import("./pages/teacher/TeacherExams"));
const TeacherProfile = lazy(() => import("./pages/teacher/TeacherProfile"));
const TeacherNotifications = lazy(() => import("./pages/teacher/TeacherNotifications"));
const TeacherAnalytics = lazy(() => import("./pages/teacher/TeacherAnalytics"));
const TeacherExamMonitor = lazy(() => import("./pages/teacher/TeacherExamMonitor"));
const TeacherMeetings = lazy(() => import("./pages/teacher/TeacherMeetings"));
const TeacherIDCard = lazy(() => import("./pages/teacher/TeacherIDCard"));
const TeacherStudyMaterials = lazy(() => import("./pages/teacher/TeacherStudyMaterials"));

// Student pages
const StudentDashboardPage = lazy(() => import("./pages/student/StudentDashboard"));
const StudentProfilePage = lazy(() => import("./pages/student/StudentProfile"));
const StudentAttendancePage = lazy(() => import("./pages/student/StudentAttendance"));
const StudentResultsPage = lazy(() => import("./pages/student/StudentResults"));
const StudentFeesPage = lazy(() => import("./pages/student/StudentFees"));
const StudentTimetablePage = lazy(() => import("./pages/student/StudentTimetable"));
const StudentNotificationsPage = lazy(() => import("./pages/student/StudentNotifications"));
const StudentHomeworkPage = lazy(() => import("./pages/student/StudentHomework"));
const StudentIDCardPage = lazy(() => import("./pages/student/StudentIDCard"));
const StudentStudyMaterialsPage = lazy(() => import("./pages/student/StudentStudyMaterials"));
const StudentOnlineExamsPage = lazy(() => import("./pages/student/StudentOnlineExams"));
const StudentMeetings = lazy(() => import("./pages/student/StudentMeetings"));
const StudentAIChatPage = lazy(() => import("./pages/student/StudentAIChat"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>
);

function SuperAdminRoutes() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ai-analytics" element={<AIAnalytics />} />
          <Route path="/schools" element={<Schools />} />
          <Route path="/schools/add" element={<AddSchool />} />
          <Route path="/schools/:id" element={<SchoolDetail />} />
          <Route path="/schools/:id/edit" element={<EditSchool />} />
          <Route path="/festival-themes" element={<FestivalThemes />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/subscription-requests" element={<SubscriptionRequests />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
}

function SchoolAdminRoutesWrapper() {
  const { setupCompleted, loading } = useSchool();
  
  if (loading) return <LoadingFallback />;
  
  if (!setupCompleted) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="*" element={<Navigate to="/school/setup" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <SchoolAdminLayout>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<SchoolDashboard />} />
          <Route path="/academic-years" element={<AcademicYears />} />
          <Route path="/classes" element={<ClassesAndSections />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/subject-mapping" element={<ClassSubjectMapping />} />
          <Route path="/report-card" element={<ReportCard />} />
          <Route path="/ai-report-card" element={<AIReportCard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/profile" element={<StudentProfile />} />
          <Route path="/students/import" element={<BulkStudentImport />} />
          <Route path="/students/id-cards" element={<BulkIDCardGenerator />} />
          <Route path="/students/transfer" element={<StudentTransfer />} />
          <Route path="/promotion" element={<StudentPromotion />} />
          <Route path="/archive" element={<StudentArchive />} />
          <Route path="/fees/dues" element={<FeeDues />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/face-attendance" element={<FaceAttendance />} />
          <Route path="/exams" element={<ExamManagement />} />
          <Route path="/fees" element={<FeeManagement />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/reports" element={<SchoolReports />} />
          <Route path="/documents" element={<StudentDocuments />} />
          <Route path="/calendar" element={<SchoolCalendar />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/backup-restore" element={<BackupRestore />} />
          <Route path="/settings" element={<SchoolSettings />} />
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </SchoolAdminLayout>
  );
}

function TeacherRoutesWrapper() {
  return (
    <TeacherLayout>
      <Suspense fallback={<LoadingFallback />}>
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
          <Route path="/id-card" element={<TeacherIDCard />} />
          <Route path="/materials" element={<TeacherStudyMaterials />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </TeacherLayout>
  );
}

function StudentPortalWrapper() {
  return (
    <StudentLayout>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<StudentDashboardPage />} />
          <Route path="/profile" element={<StudentProfilePage />} />
          <Route path="/chat" element={<StudentAIChatPage />} />
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
      </Suspense>
    </StudentLayout>
  );
}

function ProtectedRoutes() {
  const { user, loading, role } = useAuth();
  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/" replace />;
  if (!role) return <LoadingFallback />;

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

  return (
    <Routes>
      <Route path="/admin/*" element={<SuperAdminRoutes />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={user ? <ProtectedRedirect /> : <LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={user ? <ProtectedRedirect /> : <Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/install" element={<InstallApp />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </Suspense>
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

const App = () => {
  useEffect(() => {
    import("@/styles/deferred.css");
  }, []);

  return (
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
};

export default App;
