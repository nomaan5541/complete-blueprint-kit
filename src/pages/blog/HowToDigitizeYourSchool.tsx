import BlogPost from "@/components/BlogPost";

export default function HowToDigitizeYourSchool() {
  return (
    <BlogPost
      slug="how-to-digitize-your-school"
      title="How to Digitize Your School in 30 Days (Step-by-Step Plan)"
      seoTitle="How to Digitize Your School in 30 Days | Step-by-Step | EduPrimeX"
      description="A practical 4-week rollout plan — data migration, teacher training, parent onboarding — to get your school fully digital in a month."
      keywords="digitize school, school digital transformation, school ERP rollout, school software implementation"
      datePublished="2025-03-28"
      intro={
        <p>
          Most schools think going digital takes a year. With the right plan, it takes 30 days.
          Here's the exact week-by-week rollout EduPrimeX uses to onboard new schools.
        </p>
      }
      sections={[
        {
          heading: "Week 1: Data &amp; setup",
          body: (
            <ul>
              <li>Day 1–2: Pick plan, sign up, set school logo &amp; details.</li>
              <li>Day 3–4: Import student data from Excel / UDISE+ (bulk import handles 25/batch).</li>
              <li>Day 5: Set up classes, sections, subjects, academic year.</li>
              <li>Day 6–7: Configure fee structure + payment gateway.</li>
            </ul>
          ),
        },
        {
          heading: "Week 2: Teachers",
          body: (
            <ul>
              <li>Day 8: Create teacher accounts (auto credentials).</li>
              <li>Day 9–10: 90-min training on attendance + marks entry.</li>
              <li>Day 11–12: Teachers practice marking attendance live.</li>
              <li>Day 13–14: First test exam created in question bank.</li>
            </ul>
          ),
        },
        {
          heading: "Week 3: Parents",
          body: (
            <ul>
              <li>Day 15: Generate student credentials in bulk.</li>
              <li>Day 16: PTM — show parents the parent app live.</li>
              <li>Day 17–18: Send first fee reminder via WhatsApp.</li>
              <li>Day 19–21: Track app installs (target 70%+).</li>
            </ul>
          ),
        },
        {
          heading: "Week 4: Go live &amp; iterate",
          body: (
            <ul>
              <li>Day 22–24: First full week of digital attendance + fee collection.</li>
              <li>Day 25–27: Run first online test for senior classes.</li>
              <li>Day 28: Principal reviews dashboards.</li>
              <li>Day 29–30: Collect feedback, lock processes.</li>
            </ul>
          ),
        },
      ]}
      faqs={[
        {
          q: "How long does it take to digitize a school?",
          a: "With a modern SaaS school ERP, a typical school goes fully digital in 30 days — Week 1 setup, Week 2 teacher training, Week 3 parent onboarding, Week 4 go-live.",
        },
        {
          q: "What's the first step to digitizing a school?",
          a: "The first step is importing your student and class data into a school ERP. EduPrimeX accepts Excel uploads and UDISE+ exports, handling 25 students per batch with automatic validation.",
        },
        {
          q: "Do teachers resist school digitisation?",
          a: "Initial resistance is normal but disappears within 2 weeks once teachers see attendance and marks entry taking 5 minutes instead of 30. Free training and a simple mobile-first UI are critical.",
        },
        {
          q: "How do we get parents to install the app?",
          a: "The highest install rates come from a live PTM demo + sending the install link via WhatsApp + showing parents their child's real attendance data on day one. A PWA (no Play Store) lifts install rates 2–3x.",
        },
      ]}
    />
  );
}
