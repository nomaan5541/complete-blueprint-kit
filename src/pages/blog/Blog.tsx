import { Link } from "react-router-dom";
import LegalLayout from "@/components/LegalLayout";
import SEO from "@/components/SEO";
import { ArrowRight } from "lucide-react";
import { blogPosts } from "./posts";

export default function Blog() {
  return (
    <LegalLayout
      title="EduPrimeX Blog"
      description="Insights, guides, and best practices on school management software, multi-school ERP, fee collection, attendance, online exams, and education technology."
      lastUpdated="April 2025"
    >
      <SEO
        title="Blog | EduPrimeX – School Management System Insights & Guides"
        description="Read 15+ in-depth articles on school management software, multi-school ERP, online fee collection, attendance, exams, report cards, and parent communication."
        keywords="school management blog, school ERP guide, education technology articles, school software India, online fee collection, school attendance"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "EduPrimeX Blog",
          url: "https://eduprimex.lovable.app/blog",
          description:
            "Insights and guides on school management software, multi-school ERP, and education technology.",
          blogPost: blogPosts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: `https://eduprimex.lovable.app/blog/${p.slug}`,
            datePublished: p.date,
            description: p.excerpt,
          })),
        }}
      />
      <p>
        Practical insights for school owners, principals, administrators, and EdTech buyers — on
        running modern, digital-first institutions in India and beyond.
      </p>
      <div className="not-prose grid gap-4 mt-8">
        {blogPosts.map((p) => (
          <Link
            key={p.slug}
            to={`/blog/${p.slug}`}
            className="block p-5 rounded-xl border border-border/60 bg-card hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {p.category}
              </span>
              <span className="text-xs text-muted-foreground">{p.date}</span>
            </div>
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
