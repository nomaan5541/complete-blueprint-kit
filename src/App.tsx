import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SchoolAdminLayout } from "@/components/SchoolAdminLayout";
import { TeacherLayout } from "@/components/TeacherLayout";
import { useSchool } from "@/hooks/useSchool";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Schools from "./pages/Schools";
import AddSchool from "./pages/AddSchool";
import SchoolDetail from "./pages/SchoolDetail";
import EditSchool from "./pages/EditSchool";
import Subscriptions from "./pages/Subscriptions";
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
import StudentPortal from "./pages/school/StudentPortal";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherMarks from "./pages/teacher/TeacherMarks";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherTimetable from "./pages/teacher/TeacherTimetable";

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
        <Route path="/students" element={<Students />} />
        <Route path="/promotion" element={<StudentPromotion />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/exams" element={<ExamManagement />} />
        <Route path="/fees" element={<FeeManagement />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reports" element={<SchoolReports />} />
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
        <Route path="/attendance" element={<TeacherAttendance />} />
        <Route path="/marks" element={<TeacherMarks />} />
        <Route path="/students" element={<TeacherStudents />} />
        <Route path="/timetable" element={<TeacherTimetable />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TeacherLayout>
  );
}

function StudentPortalWrapper() {
  return (
    <SchoolAdminLayout>
      <Routes>
        <Route path="/" element={<StudentPortal />} />
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Routes>
    </SchoolAdminLayout>
  );
}

function ProtectedRoutes() {
  const { user, loading, role } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

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
      <Route path="/*" element={<SuperAdminRoutes />} />
    </Routes>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
