import { Link } from "react-router-dom";
import { GraduationCap, Mail, Phone, MapPin, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface LegalLayoutProps {
  title: string;
  description: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, description, lastUpdated, children }: LegalLayoutProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | EDUPRIMEX`;
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? "";
    meta?.setAttribute("content", description);
    return () => {
      document.title = prevTitle;
      meta?.setAttribute("content", prevDesc);
    };
  }, [title, description]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-bold text-foreground tracking-tight">EDUPRIMEX</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />Home</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-12">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-10 pb-6 border-b border-border/50">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground/70 mt-3">Last updated: {lastUpdated}</p>
            )}
          </header>
          <div className="prose prose-slate dark:prose-invert max-w-none text-foreground/90 leading-relaxed [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-8 [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:mt-6 [&>h3]:mb-2 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-1 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-1 [&>ol]:mb-4">
            {children}
          </div>
        </article>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 py-10 bg-muted/20 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-4 gap-8 mb-8">
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-bold text-foreground text-sm">EDUPRIMEX</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Multi-school management SaaS for schools, colleges & institutes.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
              <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms & Conditions</Link></li>
              <li><Link to="/disclaimer" className="text-muted-foreground hover:text-foreground">Disclaimer</Link></li>
              <li><Link to="/refund-policy" className="text-muted-foreground hover:text-foreground">Refund Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:Nomaankhangta@gmail.com" className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Mail className="h-3.5 w-3.5" />Nomaankhangta@gmail.com</a></li>
              <li><a href="tel:+918977397763" className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Phone className="h-3.5 w-3.5" />+91 89773 97763</a></li>
              <li><span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />India</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} EDUPRIMEX. All rights reserved. Made for schools, colleges & institutes.
        </div>
      </div>
    </footer>
  );
}
