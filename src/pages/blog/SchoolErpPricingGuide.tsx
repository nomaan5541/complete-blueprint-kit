import BlogPost from "@/components/BlogPost";

export default function SchoolErpPricingGuide() {
  return (
    <BlogPost
      slug="school-erp-pricing-guide"
      title="School ERP Pricing Guide: What Should You Actually Pay in 2025?"
      seoTitle="School ERP Pricing Guide 2025 | What Schools Should Pay | EduPrimeX"
      description="Per-student, per-module, and flat-fee school ERP pricing models explained, with real INR ranges and hidden cost traps to avoid."
      keywords="school ERP pricing, school management software cost, school software price India, school ERP cost per student"
      datePublished="2025-03-10"
      intro={
        <p>
          School ERP pricing in India ranges from <strong>free</strong> (open-source, self-hosted)
          to <strong>₹2,00,000+ per year</strong> (enterprise multi-campus suites). Knowing which
          pricing model fits your school size saves you 40–60% over a 3-year horizon.
        </p>
      }
      sections={[
        {
          heading: "Pricing model 1: Per-student per-year",
          body: (
            <p>
              ₹15–₹60 per student per year. Common with mid-market vendors. Predictable but scales
              linearly — a 2,000-student school pays ₹30,000–₹1,20,000 a year.
            </p>
          ),
        },
        {
          heading: "Pricing model 2: Flat tier",
          body: (
            <p>
              ₹12,000–₹50,000 per year regardless of student count, with tier limits (e.g. up to
              500, 1500, or unlimited). This is what EduPrimeX uses — Starter ₹1,200, Professional
              ₹1,800, Ultimate ₹2,400 per year per school.
            </p>
          ),
        },
        {
          heading: "Pricing model 3: Per-module",
          body: (
            <p>
              Base ERP free or cheap, but you pay separately for fees module, exam module, parent
              app, etc. Usually ends up the most expensive — schools end up needing every module.
            </p>
          ),
        },
        {
          heading: "Hidden cost traps",
          body: (
            <ul>
              <li>Per-SMS charges (₹0.18–₹0.30 each, adds up fast).</li>
              <li>Setup &amp; training fees (avoid vendors charging ₹25k+ here).</li>
              <li>Custom report charges.</li>
              <li>Storage overage fees.</li>
              <li>Annual maintenance contracts (AMC) on top of subscription.</li>
            </ul>
          ),
        },
      ]}
      faqs={[
        {
          q: "How much does school management software cost in India in 2025?",
          a: "School management software in India costs between ₹1,200/year (flat starter plans) and ₹2,00,000+/year (enterprise multi-campus). Most mid-size schools spend ₹15,000–₹50,000 per year.",
        },
        {
          q: "Is there free school management software?",
          a: "Yes — open-source ERPs like Fedena Community and OpenEduCat are free but require self-hosting, maintenance, and customisation. Most schools find hosted SaaS cheaper after counting hosting + dev time.",
        },
        {
          q: "What's the cheapest school ERP plan?",
          a: "EduPrimeX Starter at ₹1,200/year supports up to 200 students and includes attendance, fees, exams, and the parent app — making it the cheapest fully-featured school ERP in India.",
        },
        {
          q: "Are setup and training charges normal?",
          a: "No. Modern SaaS school ERPs include setup, data migration, and teacher training in the subscription. Walk away from vendors who charge ₹25,000+ just to onboard.",
        },
      ]}
    />
  );
}
