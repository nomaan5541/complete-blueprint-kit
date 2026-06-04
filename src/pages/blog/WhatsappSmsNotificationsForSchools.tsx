import BlogPost from "@/components/BlogPost";

export default function WhatsappSmsNotificationsForSchools() {
  return (
    <BlogPost
      slug="whatsapp-sms-notifications-for-schools"
      title="WhatsApp and SMS Notifications for Schools: Setup, Cost, and Best Practices"
      seoTitle="WhatsApp & SMS Notifications for Schools | DLT Setup | EduPrimeX"
      description="How to set up WhatsApp Business API and SMS templates for attendance, fees, exams, and holidays — with DLT compliance for Indian schools."
      keywords="WhatsApp for schools, school SMS notifications, DLT SMS schools, WhatsApp Business school"
      datePublished="2025-04-15"
      intro={
        <p>
          SMS and WhatsApp are the two channels every Indian parent actually checks. Used right,
          they can lift fee collection 30%, cut absenteeism 40%, and almost eliminate "I didn't
          know" complaints. Used wrong, they get your sender ID blocked.
        </p>
      }
      sections={[
        {
          heading: "Why DLT registration matters",
          body: (
            <p>
              Since 2020, India's TRAI requires every business SMS to use DLT-registered sender
              IDs and pre-approved templates. Sending non-DLT SMS gets you blocked permanently.
              Your school ERP should handle the DLT template registration for you.
            </p>
          ),
        },
        {
          heading: "WhatsApp Business API basics",
          body: (
            <p>
              For high-volume school notifications, use the WhatsApp Business API (via MSG91,
              Gupshup, etc.) — not the consumer WhatsApp Business app. Templates must be
              pre-approved by Meta. Each template costs ~₹0.40–₹0.80 per message.
            </p>
          ),
        },
        {
          heading: "Templates every school needs",
          body: (
            <ul>
              <li>Absence alert</li>
              <li>Fee due reminder + payment link</li>
              <li>Fee paid receipt</li>
              <li>Exam schedule</li>
              <li>Result published</li>
              <li>Holiday announcement</li>
              <li>PTM invitation with RSVP link</li>
              <li>Emergency / weather closure</li>
            </ul>
          ),
        },
        {
          heading: "Best practices",
          body: (
            <ul>
              <li>Never spam — max 2 messages per parent per day.</li>
              <li>Send between 7am–9pm only.</li>
              <li>Include opt-out instructions every 30 days.</li>
              <li>Use parent's preferred language.</li>
              <li>Always include school name in the first 30 characters.</li>
            </ul>
          ),
        },
      ]}
      faqs={[
        {
          q: "How do schools send WhatsApp notifications to parents?",
          a: "Schools send WhatsApp notifications through the WhatsApp Business API, integrated into the school ERP. Templates (absence, fee, exam) must be pre-approved by Meta, and each message costs ~₹0.40–₹0.80.",
        },
        {
          q: "Is DLT registration mandatory for school SMS?",
          a: "Yes. Since 2020, TRAI mandates DLT registration for all transactional and promotional SMS in India. Non-DLT SMS will be blocked. Your school ERP vendor should handle DLT registration on your behalf.",
        },
        {
          q: "How much does WhatsApp Business cost for schools?",
          a: "WhatsApp Business API messages for schools cost ₹0.40–₹0.80 per template message via providers like MSG91 or Gupshup. A typical 500-student school spends ₹1,500–₹3,000/month.",
        },
        {
          q: "Can parents reply to school WhatsApp messages?",
          a: "Yes, parents can reply within a 24-hour service window. Inside that window, the school can send free-form messages back. After 24 hours, only template messages can be sent.",
        },
      ]}
    />
  );
}
