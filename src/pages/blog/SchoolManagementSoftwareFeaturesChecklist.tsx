import BlogPost from "@/components/BlogPost";

export default function SchoolManagementSoftwareFeaturesChecklist() {
  return (
    <BlogPost
      slug="school-management-software-features-checklist"
      title="School Management Software Features Checklist (50+ Must-Haves)"
      seoTitle="School Management Software Features Checklist 2025 | 50+ Must-Haves"
      description="A 50-point checklist of features every school ERP should have in 2025 — academics, admin, communication, security, and analytics."
      keywords="school management software features, school ERP checklist, school software features list"
      datePublished="2025-03-22"
      intro={
        <p>
          Print this checklist and tick the boxes during your next school software demo. If a
          vendor can't demo 40+ of these live, walk away.
        </p>
      }
      sections={[
        {
          heading: "Academics (12)",
          body: (
            <ul>
              <li>Academic year management</li>
              <li>Classes &amp; sections</li>
              <li>Subjects &amp; class-subject mapping</li>
              <li>Timetable with clash detection</li>
              <li>Substitution management</li>
              <li>Lesson plans</li>
              <li>Homework with attachments</li>
              <li>Study materials library</li>
              <li>Online exams + question bank</li>
              <li>Offline exam marks entry</li>
              <li>AI report card remarks</li>
              <li>Multi-board report templates</li>
            </ul>
          ),
        },
        {
          heading: "Admin (12)",
          body: (
            <ul>
              <li>Admissions / enquiry management</li>
              <li>Bulk student import (Excel, UDISE+)</li>
              <li>Student promotion / transfer / archive</li>
              <li>Staff records &amp; payroll inputs</li>
              <li>Fee structure setup</li>
              <li>Online fee collection (UPI / cards)</li>
              <li>Auto-receipts (GST-compliant)</li>
              <li>Dues tracking + reminders</li>
              <li>ID card generator</li>
              <li>Document management</li>
              <li>Inventory / library</li>
              <li>Transport routes &amp; tracking</li>
            </ul>
          ),
        },
        {
          heading: "Attendance (6)",
          body: (
            <ul>
              <li>Manual attendance (mobile)</li>
              <li>Biometric integration</li>
              <li>Face-recognition attendance</li>
              <li>Period-wise attendance</li>
              <li>Auto SMS / WhatsApp on absence</li>
              <li>Attendance analytics &amp; heatmaps</li>
            </ul>
          ),
        },
        {
          heading: "Communication (6)",
          body: (
            <ul>
              <li>Notifications with audience targeting</li>
              <li>WhatsApp Business templates</li>
              <li>DLT-compliant SMS</li>
              <li>Email broadcasts</li>
              <li>Parent app (PWA)</li>
              <li>Meeting / PTM scheduling</li>
            </ul>
          ),
        },
        {
          heading: "Security &amp; ops (8)",
          body: (
            <ul>
              <li>Role-based access (RBAC)</li>
              <li>Row-level security (multi-tenant)</li>
              <li>2FA for super admin</li>
              <li>Audit logs</li>
              <li>Daily encrypted backups</li>
              <li>One-click restore</li>
              <li>GDPR-style data export</li>
              <li>Offline mode for students</li>
            </ul>
          ),
        },
        {
          heading: "Analytics (6)",
          body: (
            <ul>
              <li>Principal dashboard</li>
              <li>Owner / multi-school dashboard</li>
              <li>Fee collection trends</li>
              <li>Attendance heatmaps</li>
              <li>Exam performance analytics</li>
              <li>AI-powered insights</li>
            </ul>
          ),
        },
      ]}
      faqs={[
        {
          q: "What are the must-have features of school management software?",
          a: "Must-have features include student management, attendance, online fee collection, exam &amp; report cards, timetable, parent app, notifications, and multi-tenant security. A full 50-point checklist is provided above.",
        },
        {
          q: "How many modules should a school ERP have?",
          a: "A complete school ERP has 50+ features grouped into 6 module areas: academics, admin, attendance, communication, security/ops, and analytics. EduPrimeX includes all of these.",
        },
        {
          q: "Is a parent app a must-have in 2025?",
          a: "Yes. Without a parent app (or PWA equivalent), schools cannot send real-time attendance alerts, online fee reminders, or report cards — the three highest-ROI features for parents.",
        },
        {
          q: "What's the difference between LMS and school ERP features?",
          a: "An LMS focuses on courses, quizzes, and content delivery. A school ERP covers the full school operation including fees, admissions, attendance, exams, and parent communication. Most schools need ERP first, LMS later.",
        },
      ]}
    />
  );
}
