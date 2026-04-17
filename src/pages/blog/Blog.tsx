import { Link } from "react-router-dom";
import LegalLayout from "@/components/LegalLayout";
import SEO from "@/components/SEO";
import { ArrowRight } from "lucide-react";

const posts = [
  {
    slug: "what-is-school-management-system",
    title: "What is a School Management System and Why Schools Need It",
    excerpt:
      "A school management system (SMS) is a centralized ERP platform that digitises admissions, attendance, fees, exams, communication, and reporting. Here's why every modern school needs one.",
    date: "2025-01-15",
  },
  {
    slug: "manage-multiple-schools-with-erp",
    title: "How to Manage Multiple Schools Efficiently with ERP Software",
    excerpt:
      "Running a network of schools from a single dashboard requires the right multi-tenant ERP. Learn the architecture, workflows, and KPIs that make multi-school management work at scale.",
    date: "2025-01-20",
  },
];

export default function Blog() {
  return (
    <LegalLayout
      title="EduPrimeX Blog"
      description="Insights, guides, and best practices on school management software, multi-school ERP, and education technology."
      lastUpdated="January 2025"
    >
      <SEO
        title="Blog | EduPrimeX – School Management System Insights"
        description="Read the latest articles on school management software, multi-school ERP, and best practices for digital school administration."
        keywords="school management blog, school ERP guide, education technology articles"
      />
      <p>
        Welcome to the EduPrimeX blog — practical insights for school owners, principals, and
        administrators on running modern, digital-first institutions.
      </p>
      <div className="not-prose grid gap-4 mt-8">
        {posts.map((p) => (
          <Link
            key={p.slug}
            to={`/blog/${p.slug}`}
            className="block p-5 rounded-xl border border-border/60 bg-card hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {p.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">{p.excerpt}</p>
            <span className="inline-flex items-center gap-1 mt-3 text-sm text-primary font-medium">
              Read article <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </LegalLayout>
  );
}
