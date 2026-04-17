import LegalLayout from "@/components/LegalLayout";

export default function RefundPolicy() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      description="Our policy for subscription cancellations, refunds, and billing disputes."
      lastUpdated="April 2026"
    >
      <h2>1. Free Trial</h2>
      <p>
        Every new school is eligible for a <strong>30-day free trial</strong> with access to
        Starter features and selected premium tools. No payment is required during the trial. You
        may cancel at any time before the trial ends with no charge.
      </p>

      <h2>2. Subscription Plans</h2>
      <p>
        Paid plans (Starter, Professional, Ultimate) are billed in advance for the chosen
        duration (monthly or annual). Plan benefits, student limits, and teacher limits are
        applied immediately upon successful payment.
      </p>

      <h2>3. Cancellation</h2>
      <ul>
        <li>You may cancel your subscription at any time from the Subscription page.</li>
        <li>Cancellation takes effect at the end of your current billing cycle. You retain access until that date.</li>
        <li>After cancellation, the school account is moved to read-only mode. No new students, marks, or fees can be added, but existing data remains accessible for export for 30 days.</li>
      </ul>

      <h2>4. Refunds</h2>
      <p>
        <strong>Subscription fees are generally non-refundable.</strong> We do not offer pro-rated
        refunds for unused portions of a billing cycle. However, we may consider refunds in the
        following exceptional cases at our sole discretion:
      </p>
      <ul>
        <li>Duplicate payment caused by a technical error.</li>
        <li>Payment charged after a verified cancellation.</li>
        <li>Extended platform downtime materially affecting your school's operations.</li>
      </ul>

      <h2>5. How to Request a Refund</h2>
      <p>
        Email{" "}
        <a href="mailto:Nomaankhangta@gmail.com" className="text-primary underline">Nomaankhangta@gmail.com</a>{" "}
        within <strong>7 days</strong> of the disputed charge with:
      </p>
      <ul>
        <li>School name and registered email.</li>
        <li>Transaction ID and date.</li>
        <li>Reason for the refund request.</li>
      </ul>
      <p>
        We will respond within 5 business days. Approved refunds are processed back to the
        original payment method within 7–14 business days.
      </p>

      <h2>6. Plan Changes</h2>
      <ul>
        <li><strong>Upgrades</strong> take effect immediately and are pro-rated for the remainder of the billing cycle.</li>
        <li><strong>Downgrades</strong> take effect at the start of the next billing cycle.</li>
      </ul>

      <h2>7. Failed Payments</h2>
      <p>
        If a renewal payment fails, we will attempt to retry over 7 days and notify you by email.
        If the issue is not resolved, the account moves to read-only mode until payment succeeds.
      </p>

      <h2>8. Contact</h2>
      <p>
        Billing questions? Email{" "}
        <a href="mailto:Nomaankhangta@gmail.com" className="text-primary underline">Nomaankhangta@gmail.com</a>{" "}
        or call <a href="tel:+918977397763" className="text-primary underline">+91 89773 97763</a>.
      </p>
    </LegalLayout>
  );
}
