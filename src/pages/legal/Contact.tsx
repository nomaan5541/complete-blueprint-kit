import { useEffect, useState } from "react";
import { z } from "zod";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, Phone, MapPin, ArrowLeft, Send, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteFooter } from "@/components/LegalLayout";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email").max(255),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message too long"),
});

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Contact Us | EDUPRIMEX";
    const meta = document.querySelector('meta[name="description"]');
    const prev = meta?.getAttribute("content") ?? "";
    meta?.setAttribute("content", "Get in touch with the EDUPRIMEX team for demos, support, or partnership inquiries.");
    return () => {
      document.title = prevTitle;
      meta?.setAttribute("content", prev);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse({ name, email, subject, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("Too many") ? "Too many messages submitted. Please try again later." : "Failed to send. Please try again.");
      return;
    }
    toast.success("Thanks! We'll get back to you within 24 hours.");
    setName(""); setEmail(""); setSubject(""); setMessage("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      <main className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">Get in touch</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Questions, demos, or partnership inquiries — we'd love to hear from you.
              We typically reply within 24 hours.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Contact info cards */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5">
                  <Mail className="h-5 w-5 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground mb-1">Email</h3>
                  <a href="mailto:Nomaankhangta@gmail.com" className="text-sm text-muted-foreground hover:text-primary break-all">
                    Nomaankhangta@gmail.com
                  </a>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <Phone className="h-5 w-5 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground mb-1">Phone & WhatsApp</h3>
                  <a href="tel:+918977397763" className="text-sm text-muted-foreground hover:text-primary">
                    +91 89773 97763
                  </a>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <MapPin className="h-5 w-5 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground mb-1">Location</h3>
                  <p className="text-sm text-muted-foreground">India</p>
                </CardContent>
              </Card>
            </div>

            {/* Contact form */}
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required disabled={submitting} />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required disabled={submitting} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="Demo request, support, partnership..." disabled={submitting} />
                  </div>
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} required rows={6} placeholder="Tell us about your school and what you're looking for..." disabled={submitting} />
                    <p className="text-xs text-muted-foreground mt-1 text-right">{message.length} / 2000</p>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Send message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
