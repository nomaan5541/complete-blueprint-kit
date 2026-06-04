import LegalLayout from "@/components/LegalLayout";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";

export interface FAQ {
  q: string;
  a: string;
}

export interface BlogPostProps {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  keywords: string;
  datePublished: string;
  lastUpdated?: string;
  intro: React.ReactNode;
  sections: { heading: string; body: React.ReactNode }[];
  faqs: FAQ[];
}

const BASE = "https://eduprimex.lovable.app";

export default function BlogPost({
  slug,
  title,
  seoTitle,
  description,
  keywords,
  datePublished,
  lastUpdated,
  intro,
  sections,
  faqs,
}: BlogPostProps) {
  const url = `${BASE}/blog/${slug}`;
  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      author: { "@type": "Organization", name: "EduPrimeX" },
      publisher: {
        "@type": "Organization",
        name: "EduPrimeX",
        logo: { "@type": "ImageObject", url: `${BASE}/pwa-512x512.png` },
      },
      datePublished,
      dateModified: lastUpdated ?? datePublished,
      mainEntityOfPage: url,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/blog` },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    },
  ];

  return (
    <LegalLayout title={title} description={description} lastUpdated={lastUpdated ?? datePublished}>
      <SEO
        title={seoTitle}
        description={description}
        keywords={keywords}
        canonical={url}
        jsonLd={jsonLd}
      />
      {intro}
      {sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          {s.body}
        </section>
      ))}
      <h2>Frequently asked questions</h2>
      {faqs.map((f) => (
        <div key={f.q}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}
      <h2>Get started with EduPrimeX</h2>
      <p>
        EduPrimeX is a multi-school SaaS ERP built for Indian schools, colleges, and coaching
        institutes — with AI report cards, WhatsApp/SMS automation, face-attendance, online exams,
        and a 30-day free trial.{" "}
        <Link to="/pricing" className="text-primary underline">See pricing</Link> or{" "}
        <Link to="/contact" className="text-primary underline">request a demo</Link>.
      </p>
      <h2>Related reading</h2>
      <ul>
        <li><Link to="/blog">All articles</Link></li>
        <li><Link to="/blog/what-is-school-management-system">What is a school management system?</Link></li>
        <li><Link to="/blog/manage-multiple-schools-with-erp">Manage multiple schools with ERP</Link></li>
      </ul>
    </LegalLayout>
  );
}
