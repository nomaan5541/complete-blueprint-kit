import BlogPost from "@/components/BlogPost";

export default function CbseVsStateBoardSchoolSoftware() {
  return (
    <BlogPost
      slug="cbse-vs-state-board-school-software"
      title="CBSE vs State Board School Software: What's Different and Why It Matters"
      seoTitle="CBSE vs State Board School Software | Differences | EduPrimeX"
      description="Grading scales, report formats, attendance, and exam patterns differ. Here's how to pick school software that supports your board correctly."
      keywords="CBSE school software, state board school software, school ERP for CBSE, Telangana SSC school software"
      datePublished="2025-03-16"
      intro={
        <p>
          A school ERP built only for CBSE will quietly break the moment you try to use it for a
          Telangana SSC or Maharashtra State Board school — grade scales, report layouts, even
          minimum-attendance rules are different. Here's what to check.
        </p>
      }
      sections={[
        {
          heading: "Grading scale differences",
          body: (
            <ul>
              <li><strong>CBSE</strong>: A1, A2, B1, B2, C1, C2, D, E.</li>
              <li><strong>ICSE</strong>: marks-based, 1–9 grade indicator.</li>
              <li><strong>Telangana SSC</strong>: A1–E grade, FA/SA split.</li>
              <li><strong>Maharashtra SSC</strong>: A+ to F.</li>
            </ul>
          ),
        },
        {
          heading: "Report card layout",
          body: (
            <p>
              CBSE report cards must show co-scholastic areas separately. State boards usually
              have Formative Assessment (FA1–FA4) and Summative Assessment (SA1, SA2) columns,
              which CBSE does not.
            </p>
          ),
        },
        {
          heading: "Attendance policy",
          body: (
            <p>
              CBSE mandates 75% minimum attendance for board exam eligibility. Many state boards
              are stricter (80%). Your ERP should auto-flag students slipping below the threshold.
            </p>
          ),
        },
      ]}
      faqs={[
        {
          q: "Can the same school ERP support CBSE and State Board?",
          a: "Yes, if it ships with per-board templates and grade scales. EduPrimeX includes CBSE, ICSE, IB, and 28 State Board templates that the school admin can switch between.",
        },
        {
          q: "What's the minimum attendance for CBSE board exams?",
          a: "CBSE requires students to have at least 75% attendance to be eligible for board examinations, with relaxations only on medical grounds approved by the board.",
        },
        {
          q: "How is the CBSE A1–E grade calculated?",
          a: "CBSE assigns A1 to the top 1/8th of the passed students subject-wise, A2 to the next 1/8th, and so on down to E. The grade is rank-based, not absolute-marks based.",
        },
        {
          q: "Does EduPrimeX support Telangana SSC schools?",
          a: "Yes. EduPrimeX has built-in Telangana SSC formats including FA1–FA4, SA1, SA2, A1–E grading, and the state-prescribed report card layout.",
        },
      ]}
    />
  );
}
