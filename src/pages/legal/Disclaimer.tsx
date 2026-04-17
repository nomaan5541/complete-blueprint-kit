import LegalLayout from "@/components/LegalLayout";

export default function Disclaimer() {
  return (
    <LegalLayout
      title="Disclaimer"
      description="Important disclaimers about the EDUPRIMEX platform and the information it provides."
      lastUpdated="April 2026"
    >
      <h2>1. General Information</h2>
      <p>
        The information, tools, and features provided by EDUPRIMEX are intended to help schools
        manage academic and operational workflows. While we make reasonable efforts to ensure
        accuracy and reliability, EDUPRIMEX is provided <strong>"as is"</strong> and <strong>"as
        available"</strong> without warranties of any kind, express or implied.
      </p>

      <h2>2. No Guarantee of Uninterrupted Service</h2>
      <p>
        We do not guarantee that the platform will always be available, error-free, or free from
        interruptions. Service may be affected by scheduled maintenance, third-party outages
        (cloud providers, payment gateways, SMS/email gateways), or unforeseen technical issues.
      </p>

      <h2>3. Accuracy of Data</h2>
      <p>
        Data displayed within EDUPRIMEX (attendance, marks, fees, report cards, AI-generated
        analytics) is based on inputs provided by schools, teachers, or students. EDUPRIMEX is not
        responsible for incorrect decisions made on the basis of inaccurate or incomplete data.
      </p>

      <h2>4. AI-Generated Content</h2>
      <p>
        The platform includes AI-powered features (AI Report Card, AI School Analytics, Student AI
        Chat). AI outputs are generated automatically and may occasionally contain errors,
        omissions, or biases. AI content should be reviewed by qualified staff before being acted
        upon and is not a substitute for professional academic, medical, legal, or financial
        advice.
      </p>

      <h2>5. Data Loss</h2>
      <p>
        We perform daily automated backups, but we are not liable for data loss caused by:
      </p>
      <ul>
        <li>User error (accidental deletion or overwriting).</li>
        <li>Unauthorized access due to weak or shared passwords.</li>
        <li>Force majeure events such as natural disasters or cyber-attacks.</li>
      </ul>
      <p>Schools are encouraged to use the Backup & Restore module to download regular exports.</p>

      <h2>6. Third-Party Links & Services</h2>
      <p>
        The platform may link to or integrate with third-party services (Google Meet, Razorpay,
        Stripe, MSG91, Brevo). EDUPRIMEX is not responsible for the content, policies, or
        practices of these third parties.
      </p>

      <h2>7. No Professional Advice</h2>
      <p>
        EDUPRIMEX is a software tool. It does not provide legal, accounting, medical, or
        regulatory advice. Schools must consult appropriate professionals for compliance matters.
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions about this Disclaimer? Email{" "}
        <a href="mailto:Nomaankhangta@gmail.com" className="text-primary underline">Nomaankhangta@gmail.com</a>.
      </p>
    </LegalLayout>
  );
}
