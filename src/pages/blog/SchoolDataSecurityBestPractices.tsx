import BlogPost from "@/components/BlogPost";

export default function SchoolDataSecurityBestPractices() {
  return (
    <BlogPost
      slug="school-data-security-best-practices"
      title="School Data Security: 10 Best Practices to Protect Student Records"
      seoTitle="School Data Security: 10 Best Practices | EduPrimeX"
      description="RLS, role-based access, encrypted backups, audit logs, and the security policies every school SaaS should follow to protect student data."
      keywords="school data security, student data protection, school ERP security, multi-tenant security schools"
      datePublished="2025-04-21"
      intro={
        <p>
          Schools handle some of the most sensitive personal data anywhere — minors' names,
          photos, parent contacts, marks, medical notes. A single breach destroys parent trust
          permanently. These ten practices are the floor, not the ceiling, of school data
          security.
        </p>
      }
      sections={[
        {
          heading: "The 10 practices",
          body: (
            <ol>
              <li><strong>Row-level security (RLS)</strong> — every query filtered by school_id at the DB layer, not just the app layer.</li>
              <li><strong>Role-based access (RBAC)</strong> — separate roles table, never store roles on the user profile.</li>
              <li><strong>2FA for super admin</strong> — mandatory, no exceptions.</li>
              <li><strong>HTTPS everywhere</strong> — TLS 1.2+ for all traffic, HSTS enabled.</li>
              <li><strong>Encrypted backups</strong> — daily, off-site, AES-256.</li>
              <li><strong>Audit logs</strong> — every login, edit, export logged with timestamp + user.</li>
              <li><strong>Per-school storage</strong> — uploads isolated by school_id with bucket policies.</li>
              <li><strong>Session timeout</strong> — auto sign-out after 30 minutes idle.</li>
              <li><strong>Password policy</strong> — minimum 8 chars, complexity required, breach-list check.</li>
              <li><strong>Right to export &amp; delete</strong> — schools can download all their data anytime, delete on exit.</li>
            </ol>
          ),
        },
        {
          heading: "What to ask your vendor",
          body: (
            <ul>
              <li>Are backups daily and encrypted?</li>
              <li>Where are servers physically located?</li>
              <li>Is there an SLA on uptime &amp; restore time?</li>
              <li>Have you ever had a breach? What happened?</li>
              <li>Is RLS enforced or just app-layer checks?</li>
            </ul>
          ),
        },
      ]}
      faqs={[
        {
          q: "How do schools protect student data?",
          a: "Schools protect student data with row-level security (RLS), role-based access (RBAC), 2FA, encrypted backups, audit logs, per-school storage isolation, and strict password policies. All 10 best practices are listed above.",
        },
        {
          q: "What is row-level security in a school ERP?",
          a: "Row-level security (RLS) ensures every database query automatically filters records by school_id, so users from one school can never see data from another — enforced at the database layer, not just in app code.",
        },
        {
          q: "Are school SaaS platforms GDPR-compliant?",
          a: "Mature school SaaS platforms follow GDPR-style principles — right to access, export, and delete personal data. EduPrimeX provides one-click full data export and account deletion for any school.",
        },
        {
          q: "How often should school data be backed up?",
          a: "School data should be backed up at least daily, with encrypted off-site copies, and a tested one-click restore process. EduPrimeX runs encrypted daily backups for every school with point-in-time restore.",
        },
      ]}
    />
  );
}
