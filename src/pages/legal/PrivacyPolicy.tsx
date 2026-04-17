import LegalLayout from "@/components/LegalLayout";

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="How EDUPRIMEX collects, uses, and protects school, staff, and student data."
      lastUpdated="April 2026"
    >
      <p>
        EDUPRIMEX ("we", "our", "us") provides a multi-school management SaaS platform for schools,
        colleges, and institutes. This Privacy Policy explains what information we collect when you
        use our platform, how we use it, and the rights you have over your data.
      </p>

      <h2>1. Information We Collect</h2>
      <h3>Account & Identity Data</h3>
      <ul>
        <li>Names, email addresses, phone numbers, and roles of school administrators, teachers, and students.</li>
        <li>School identity information (name, address, registration number, principal name, logo).</li>
        <li>Login credentials (passwords are stored using one-way cryptographic hashing — we never see them).</li>
      </ul>
      <h3>Academic & Operational Data</h3>
      <ul>
        <li>Student admission records, class & section assignments, attendance, exam marks, and report cards.</li>
        <li>Teacher assignments, timetables, homework, and study materials.</li>
        <li>Fee structures, payments, receipts, and dues.</li>
        <li>Notifications, audit logs, and meeting records.</li>
      </ul>
      <h3>Uploaded Files</h3>
      <ul>
        <li>Student documents, school logos, ID-card signatures, study materials, and exam images.</li>
      </ul>
      <h3>Usage Data</h3>
      <ul>
        <li>Browser type, device information, IP address, and pages accessed for security and performance.</li>
      </ul>

      <h2>2. How We Use Data</h2>
      <ul>
        <li>To operate the platform and deliver requested features (attendance, exams, fees, reports).</li>
        <li>To authenticate users and enforce role-based access (Super Admin, School Admin, Teacher, Student).</li>
        <li>To send transactional notifications (absence alerts, exam updates, fee reminders) via email, SMS, or WhatsApp where configured.</li>
        <li>To improve reliability, prevent abuse, and comply with legal obligations.</li>
      </ul>

      <h2>3. Multi-Tenant Data Isolation</h2>
      <p>
        Each school operates inside its own logically isolated environment. Row-Level Security (RLS)
        policies and path-scoped storage ensure that one school cannot access another school's data.
      </p>

      <h2>4. Cookies & Local Storage</h2>
      <p>
        We use essential cookies and browser local storage to keep you logged in, remember your
        theme preference, and maintain session security. We do not use advertising cookies or
        third-party tracking pixels.
      </p>

      <h2>5. Third-Party Services</h2>
      <p>We share limited data with the following service providers strictly to deliver the platform:</p>
      <ul>
        <li><strong>Cloud infrastructure:</strong> hosting, databases, and file storage (encrypted in transit and at rest).</li>
        <li><strong>Email & messaging:</strong> Brevo SMTP (email), MSG91 (SMS / WhatsApp) for transactional alerts when a school enables them.</li>
        <li><strong>Payments:</strong> Razorpay / Stripe for subscription and fee processing. Card and bank details are handled by these providers and never stored by us.</li>
      </ul>

      <h2>6. Data Security</h2>
      <ul>
        <li>HTTPS encryption for all traffic.</li>
        <li>Row-Level Security on every database table.</li>
        <li>Role-based access control and audit logging of sensitive actions.</li>
        <li>Single-session locking for teacher accounts and 2FA for Super Admins.</li>
        <li>Daily automated backups.</li>
      </ul>

      <h2>7. Children's Data</h2>
      <p>
        Student records (which may include minors) are entered and managed by the school as the
        data controller. EDUPRIMEX acts as a data processor on behalf of the school. Parents may
        contact their school administrator to request access, correction, or deletion of their
        child's records.
      </p>

      <h2>8. Data Retention</h2>
      <p>
        We retain school data for as long as the school's account is active. On account closure,
        data is exported (on request) and then permanently deleted within 90 days, except where
        retention is required by law.
      </p>

      <h2>9. Your Rights</h2>
      <ul>
        <li>Access and download your personal data.</li>
        <li>Request correction of inaccurate data.</li>
        <li>Request deletion of your account.</li>
        <li>Withdraw consent for non-essential communications.</li>
      </ul>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this Policy from time to time. Material changes will be communicated via
        email or in-app notification.
      </p>

      <h2>11. Contact</h2>
      <p>
        For privacy questions or data requests, email{" "}
        <a href="mailto:Nomaankhangta@gmail.com" className="text-primary underline">Nomaankhangta@gmail.com</a>{" "}
        or call <a href="tel:+918977397763" className="text-primary underline">+91 89773 97763</a>.
      </p>
    </LegalLayout>
  );
}
