import LegalLayout from "@/components/LegalLayout";

export default function TermsConditions() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      description="The rules that govern your use of the EDUPRIMEX school management platform."
      lastUpdated="April 2026"
    >
      <p>
        These Terms & Conditions ("Terms") govern your access to and use of the EDUPRIMEX platform.
        By creating an account, subscribing to a plan, or using any feature, you agree to be bound
        by these Terms.
      </p>

      <h2>1. Eligibility & Accounts</h2>
      <ul>
        <li>School accounts are created by the EDUPRIMEX Super Admin after a request is verified.</li>
        <li>School Admins are responsible for creating, managing, and revoking accounts for their teachers and students.</li>
        <li>You must provide accurate information and keep it up to date.</li>
        <li>You are responsible for all activity under your account credentials.</li>
      </ul>

      <h2>2. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the platform for any unlawful, harmful, or fraudulent purpose.</li>
        <li>Attempt to bypass authentication, RLS, or any security control.</li>
        <li>Reverse engineer, decompile, or scrape platform data.</li>
        <li>Upload malware, illegal content, or content that infringes third-party rights.</li>
        <li>Use the platform to harass students, teachers, or parents.</li>
        <li>Resell, sublicense, or share your account with parties outside your school.</li>
      </ul>

      <h2>3. Subscription & Plans</h2>
      <ul>
        <li>Schools subscribe to a paid plan (Starter, Professional, Ultimate) with defined limits on students, teachers, and features.</li>
        <li>A 30-day free trial is offered to new schools.</li>
        <li>Exceeding plan limits may require an upgrade. Suspended or expired schools have read-only access to historical data only.</li>
      </ul>

      <h2>4. Service Availability</h2>
      <p>
        We strive for high availability but do not guarantee uninterrupted service. The platform
        may be temporarily unavailable due to maintenance, updates, third-party outages, or events
        beyond our control.
      </p>

      <h2>5. Data Ownership</h2>
      <ul>
        <li>The school owns all data it uploads (students, marks, fees, documents).</li>
        <li>EDUPRIMEX is a custodian and processes data only as required to deliver the service.</li>
        <li>Schools can request a full data export at any time via the Backup & Restore module.</li>
      </ul>

      <h2>6. Intellectual Property</h2>
      <p>
        The EDUPRIMEX brand, software, design, and content are the property of EDUPRIMEX. You are
        granted a limited, non-exclusive, non-transferable license to use the platform for the
        duration of your subscription.
      </p>

      <h2>7. Limitation of Liability</h2>
      <ul>
        <li>The platform is provided on an "as is" and "as available" basis.</li>
        <li>To the maximum extent permitted by law, EDUPRIMEX is not liable for indirect, incidental, or consequential damages, including loss of data, profits, or goodwill.</li>
        <li>Our total aggregate liability for any claim is limited to the fees you paid us in the preceding 12 months.</li>
      </ul>

      <h2>8. Termination</h2>
      <ul>
        <li>You may cancel your subscription at any time. See the Refund Policy for details.</li>
        <li>We may suspend or terminate accounts that violate these Terms, with notice where possible.</li>
        <li>On termination, you may export your data within 30 days, after which it will be deleted.</li>
      </ul>

      <h2>9. Changes to Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the platform after changes
        means you accept the revised Terms.
      </p>

      <h2>10. Governing Law</h2>
      <p>
        These Terms are governed by the laws of India. Any disputes will be subject to the
        exclusive jurisdiction of the courts of India.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms? Email{" "}
        <a href="mailto:Nomaankhangta@gmail.com" className="text-primary underline">Nomaankhangta@gmail.com</a>.
      </p>
    </LegalLayout>
  );
}
