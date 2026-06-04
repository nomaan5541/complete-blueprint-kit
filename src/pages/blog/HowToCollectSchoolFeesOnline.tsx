import BlogPost from "@/components/BlogPost";

export default function HowToCollectSchoolFeesOnline() {
  return (
    <BlogPost
      slug="how-to-collect-school-fees-online"
      title="How to Collect School Fees Online (UPI, Cards, NetBanking)"
      seoTitle="How to Collect School Fees Online in 2025 | UPI, Cards | EduPrimeX"
      description="A step-by-step guide to collecting school fees online — UPI, Razorpay, cards, NetBanking, auto-reminders, GST receipts, and reconciliation."
      keywords="online school fees collection, school fee payment software, UPI school fees, online fee management"
      datePublished="2025-02-08"
      intro={
        <p>
          Collecting school fees online in 2025 isn't optional — it's the single highest-ROI
          digitisation move a school can make. Schools that switch from cash/cheque to UPI + card
          payments report 25–40% faster collection and far fewer disputes.
        </p>
      }
      sections={[
        {
          heading: "Step 1: Define your fee structure",
          body: (
            <p>
              Break fees into <strong>tuition, transport, exam, lab, and uniform</strong> heads.
              Define term-wise (quarterly / monthly) due dates. Map every class &amp; section to a
              fee plan in your ERP.
            </p>
          ),
        },
        {
          heading: "Step 2: Connect a payment gateway",
          body: (
            <p>
              Razorpay, Cashfree, and PayU dominate Indian school payments. Their TDR (transaction
              discount rate) is 0% for UPI, ~2% for cards. Schools usually pass card charges to
              parents who choose cards; UPI stays free.
            </p>
          ),
        },
        {
          heading: "Step 3: Automate reminders",
          body: (
            <ul>
              <li>WhatsApp reminder 7 days before due date.</li>
              <li>SMS reminder on due date.</li>
              <li>Second WhatsApp at +7 days late.</li>
              <li>Phone-call list for the accountant at +14 days late.</li>
            </ul>
          ),
        },
        {
          heading: "Step 4: Auto-receipts &amp; reconciliation",
          body: (
            <p>
              Every successful payment should auto-generate a GST-compliant receipt PDF, email it
              to the parent, and update the dues ledger in the same second. Reconciliation should
              be one-click — match payment-gateway settlement to bank statement.
            </p>
          ),
        },
      ]}
      faqs={[
        {
          q: "What's the best way for schools to collect fees online?",
          a: "The best way for schools to collect fees online is via a school ERP integrated with a UPI-enabled payment gateway (Razorpay, Cashfree). Parents pay through a parent app or link, and the school auto-generates receipts and updates dues.",
        },
        {
          q: "Are there any charges on UPI school fee payments?",
          a: "UPI school fee payments currently have 0% TDR (transaction discount rate) in India under RBI/NPCI rules, making them effectively free for both the school and the parent.",
        },
        {
          q: "Can parents pay school fees in installments online?",
          a: "Yes. A good school ERP lets the school admin define term-wise or monthly installments, and parents pay each installment online when it's due.",
        },
        {
          q: "How are fee receipts generated automatically?",
          a: "When a parent pays online, the ERP auto-generates a PDF receipt with the school's logo, GSTIN, fee breakdown, and a unique receipt number, then emails/WhatsApps it to the parent.",
        },
      ]}
    />
  );
}
