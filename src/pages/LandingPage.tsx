import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  GraduationCap, Users, BookOpen, Calendar, BarChart3, Shield,
  Bell, ClipboardList, CreditCard, Clock, CheckCircle, Star,
  School, UserCheck, Crown, ChevronRight, Loader2, ArrowRight,
  Smartphone, Globe, Zap, Award, FileText, Settings, X, Lock,
  Heart, TrendingUp, Sparkles, Gift, Timer, Phone, Mail, MapPin,
  Play, ChevronDown, Rocket, Target, Eye, MessageCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PLAN_FEATURE_LABELS } from "@/hooks/useSubscriptionPlan";

const features = [
  { icon: School, title: "Multi-School Management", desc: "Manage unlimited schools from a single dashboard with complete isolation." },
  { icon: Users, title: "Student Management", desc: "Admissions, profiles, bulk import, promotions, transfers & documents." },
  { icon: BookOpen, title: "Academic Management", desc: "Classes, sections, subjects, exams, report cards & grading systems." },
  { icon: Calendar, title: "Attendance Tracking", desc: "Daily attendance with auto SMS alerts to parents for absent students." },
  { icon: CreditCard, title: "Fee Management", desc: "Fee structures, payments, receipts, dues tracking & financial reports." },
  { icon: Clock, title: "Timetable", desc: "Create and manage class timetables with teacher assignments." },
  { icon: Bell, title: "Notifications", desc: "Send targeted notifications to students, teachers & parents." },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Comprehensive reports on attendance, fees, exams & school performance." },
  { icon: Shield, title: "Role-Based Access", desc: "Separate portals for Admin, Teachers & Students with proper security." },
  { icon: ClipboardList, title: "Exam Management", desc: "Create exams, enter marks, generate report cards with grades." },
  { icon: FileText, title: "Document Management", desc: "Upload and manage student documents securely in the cloud." },
  { icon: Settings, title: "School Settings", desc: "Customize receipts, SMS integration, academic years & more." },
];

const testimonials = [
  { name: "Dr. Priya Sharma", role: "Principal, Delhi Public Academy", text: "EDUPRIMEX transformed how we manage 2000+ students. Attendance, fees, report cards — everything in one place!", avatar: "PS", rating: 5 },
  { name: "Rajesh Kumar", role: "School Director, Sunrise International", text: "We saved 15 hours per week on admin work. The AI analytics feature is a game changer for our decision making.", avatar: "RK", rating: 5 },
  { name: "Anita Desai", role: "Admin Head, St. Mary's Convent", text: "Parents love the student portal. Fee collection improved by 40% since students and parents can track everything online.", avatar: "AD", rating: 5 },
  { name: "Vikram Singh", role: "Founder, Modern Valley School", text: "Best investment we made. Setup was free and the team trained our entire staff in just 2 days!", avatar: "VS", rating: 5 },
];

const whyChooseUs = [
  { icon: Rocket, title: "Go Live in 24 Hours", desc: "Free setup, data migration & staff training included with every plan." },
  { icon: Shield, title: "Bank-Level Security", desc: "256-bit encryption, role-based access, daily backups & audit logs." },
  { icon: Smartphone, title: "Works on Any Device", desc: "Fully responsive PWA. Works on phones, tablets & desktops — even offline." },
  { icon: MessageCircle, title: "WhatsApp & SMS Alerts", desc: "Auto-send absence alerts, fee reminders & exam notifications to parents." },
  { icon: Target, title: "AI-Powered Insights", desc: "Smart analytics, auto report cards & predictive attendance tracking." },
  { icon: Heart, title: "Dedicated Support", desc: "Priority WhatsApp support, video call training & regular feature updates." },
];

// Custom hook for scroll reveal
function useScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".scroll-reveal").forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);
}

// Animated counter hook
function useCounter(end: number, duration = 2000, shouldStart = false) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!shouldStart || started.current) return;
    started.current = true;
    const steps = 60;
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [end, duration, shouldStart]);

  return count;
}

function AnimatedStat({ value, suffix, label, icon: Icon }: { value: number; suffix: string; label: string; icon: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const count = useCounter(value, 2000, visible);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="glass rounded-2xl p-5 text-center group hover:glow-primary transition-all duration-500 hover:-translate-y-1">
      <Icon className="h-6 w-6 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
      <div className="text-3xl font-extrabold text-foreground tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ school_name: "", contact_name: "", email: "", phone: "", message: "" });
  const [crownClicks, setCrownClicks] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [heroTextIndex, setHeroTextIndex] = useState(0);

  const heroTexts = ["Made Simple", "Made Powerful", "Made Smart", "Made for You"];

  useScrollReveal();

  useEffect(() => {
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("price").then(({ data }) => {
      setPlans(data || []);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroTextIndex((prev) => (prev + 1) % heroTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestSubmit = async () => {
    if (!form.school_name || !form.contact_name || !form.email) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("subscription_requests" as any).insert({
      school_name: form.school_name,
      contact_name: form.contact_name,
      email: form.email,
      phone: form.phone || null,
      plan_id: selectedPlan?.id || null,
      message: form.message || null,
    } as any);
    if (error) toast.error("Failed to submit request. Please try again.");
    else {
      toast.success("🎉 Request submitted! We'll contact you within 2 hours.");
      setRequestOpen(false);
      setForm({ school_name: "", contact_name: "", email: "", phone: "", message: "" });
      setSelectedPlan(null);
    }
    setSubmitting(false);
  };

  const handleCrownClick = () => {
    const newCount = crownClicks + 1;
    setCrownClicks(newCount);
    if (newCount >= 3) {
      navigate("/login?role=super_admin");
      setCrownClicks(0);
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="animated-bg" />
      <div className="texture-overlay" />

      {/* Floating orbs */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />

      {/* Top urgency banner */}
      <div className="bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground py-2.5 text-center text-sm font-medium urgency-pulse relative overflow-hidden">
        <div className="flex items-center justify-center gap-2">
          <Gift className="h-4 w-4" />
          <span>🎉 Limited Offer: <strong>Get 3 months FREE</strong> on yearly plans! </span>
          <Timer className="h-4 w-4" />
          <span className="hidden sm:inline font-bold">Offer ends soon!</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md hover:scale-110 transition-transform">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">EDUPRIMEX</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors story-link">Features</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors story-link">Pricing</a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors story-link">Reviews</a>
              <a href="#login" className="text-sm text-muted-foreground hover:text-foreground transition-colors story-link">Login</a>
              <ThemeToggle />
              <Button size="sm" onClick={() => { setSelectedPlan(null); setRequestOpen(true); }} className="glow-primary">
                Get Started <Sparkles className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <Button size="sm" onClick={() => { setSelectedPlan(null); setRequestOpen(true); }}>Start Free</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium animate-fade-in hover-scale cursor-default">
            <Zap className="h-3.5 w-3.5 mr-1.5" /> #1 School Management Platform in India
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-5xl mx-auto leading-[1.08]">
            Complete School Management
            <span className="block mt-2 h-[1.2em] relative overflow-hidden">
              <span
                key={heroTextIndex}
                className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent shimmer-text animate-fade-in"
                style={{ backgroundSize: "200% auto" }}
              >
                {heroTexts[heroTextIndex]}
              </span>
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in">
            Streamline admissions, attendance, fees, exams & more. One powerful platform for schools, teachers & students.
            <span className="block mt-2 text-base font-medium text-foreground">Join 100+ schools already using EDUPRIMEX 🚀</span>
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Button size="lg" className="h-14 px-10 text-base shadow-xl glow-primary hover:scale-105 transition-all duration-300" onClick={() => { setSelectedPlan(null); setRequestOpen(true); }}>
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 text-base hover:scale-105 transition-all duration-300 group" asChild>
              <a href="#features">
                <Play className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                See How It Works
              </a>
            </Button>
          </div>

          {/* Trust line */}
          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-muted-foreground animate-fade-in">
            <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-emerald-500" /> No credit card needed</span>
            <span className="hidden sm:flex items-center gap-1"><CheckCircle className="h-4 w-4 text-emerald-500" /> Free setup & training</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-emerald-500" /> Cancel anytime</span>
          </div>

          {/* Animated Stats */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <AnimatedStat value={100} suffix="+" label="Schools Onboarded" icon={School} />
            <AnimatedStat value={50000} suffix="+" label="Students Managed" icon={Users} />
            <AnimatedStat value={5000} suffix="+" label="Active Teachers" icon={UserCheck} />
            <AnimatedStat value={99} suffix=".9%" label="Platform Uptime" icon={CheckCircle} />
          </div>

          {/* Scroll hint */}
          <div className="mt-12 animate-bounce">
            <ChevronDown className="h-6 w-6 mx-auto text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 sm:py-28 scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Why Schools Love Us
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Why <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">100+ Schools</span> Trust EDUPRIMEX</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">We're not just another software. We're your school's technology partner.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {whyChooseUs.map((item, i) => (
              <div key={i} className="glass rounded-2xl p-6 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group cursor-default">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary mb-4 group-hover:from-primary group-hover:to-accent group-hover:text-primary-foreground transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1">
              <Award className="h-3.5 w-3.5 mr-1.5" /> 26+ Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Everything Your School Needs</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">A comprehensive suite of tools designed specifically for Indian schools.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {features.map((f, i) => (
              <Card key={i} className="glass border-0 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group cursor-default overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-6 relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section id="testimonials" className="py-20 sm:py-28 scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1">
              <Heart className="h-3.5 w-3.5 mr-1.5 text-red-500" /> Testimonials
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Loved by School Leaders</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Hear from principals and administrators who transformed their schools.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto stagger-children">
            {testimonials.map((t, i) => (
              <Card key={i} className="glass border-0 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, si) => (
                      <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-foreground italic leading-relaxed mb-5">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold text-sm">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 scroll-reveal">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent p-10 sm:p-16 text-center text-primary-foreground glow-primary">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
            <div className="relative z-10">
              <Sparkles className="h-10 w-10 mx-auto mb-4 opacity-80" />
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to Transform Your School?</h2>
              <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">Join 100+ schools. Start your free trial today — no credit card, no commitment.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="secondary" className="h-14 px-10 text-base font-bold hover:scale-105 transition-all duration-300 shadow-xl" onClick={() => { setSelectedPlan(null); setRequestOpen(true); }}>
                  🎉 Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-10 text-base bg-white/10 border-white/30 text-white hover:bg-white/20 hover:scale-105 transition-all duration-300" asChild>
                  <a href="#pricing">View Pricing</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Choose the plan that fits your school. All plans include free setup & onboarding.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
                Loading plans...
              </div>
            ) : (
              plans.map((plan, planIndex) => {
                const isUltimate = plan.name?.toLowerCase() === "ultimate";
                const isProfessional = plan.name?.toLowerCase() === "professional";
                const planFeatures = Array.isArray(plan.features) ? plan.features : [];
                
                const offerTag = isUltimate ? "BEST VALUE" : isProfessional ? "MOST POPULAR" : "GREAT START";
                const originalPrice = isUltimate ? 29999 : isProfessional ? 14999 : 7999;
                const savings = originalPrice - Number(plan.price);
                const discount = Math.round((savings / originalPrice) * 100);
                const monthlyPrice = Math.round(Number(plan.price) / (plan.duration_months || 12));

                const tierKey = isUltimate ? "ultimate" : isProfessional ? "professional" : "starter";
                const includedCount = PLAN_FEATURE_LABELS.filter(f => f[tierKey as keyof typeof f]).length;
                const lockedCount = PLAN_FEATURE_LABELS.length - includedCount;

                return (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden transition-all duration-500 hover:-translate-y-2 group ${
                      isUltimate
                        ? "border-2 border-amber-400/60 shadow-2xl scale-[1.04] bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/20 glow-amber"
                        : isProfessional
                        ? "border-2 border-primary shadow-xl scale-[1.02] glow-primary"
                        : "glass border-0 hover:shadow-lg"
                    }`}
                    style={{ animationDelay: `${planIndex * 0.15}s` }}
                  >
                    {/* Animated bg pattern */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div className={`absolute inset-0 ${isUltimate ? "bg-gradient-to-br from-amber-500/5 to-orange-500/5" : "bg-gradient-to-br from-primary/5 to-accent/5"}`} />
                    </div>

                    {/* Offer ribbon */}
                    <div className={`absolute top-0 right-0 px-4 py-1.5 text-xs font-bold rounded-bl-xl flex items-center gap-1.5 shadow-lg ${
                      isUltimate
                        ? "bg-gradient-to-l from-yellow-500 to-amber-500 text-white"
                        : isProfessional
                        ? "bg-primary text-primary-foreground"
                        : "bg-emerald-500 text-white"
                    }`}>
                      {isUltimate && <Crown className="h-3.5 w-3.5" />}
                      {isProfessional && <Star className="h-3 w-3" />}
                      {!isUltimate && !isProfessional && <Zap className="h-3 w-3" />}
                      {offerTag}
                    </div>

                    <CardHeader className="pb-4 pt-8 relative">
                      <CardTitle className={`text-xl ${isUltimate ? "text-amber-700 dark:text-amber-400 flex items-center gap-2" : ""}`}>
                        {isUltimate && <Crown className="h-5 w-5" />}
                        {plan.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-6 relative">
                      {/* Pricing */}
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-4xl font-extrabold ${isUltimate ? "text-amber-700 dark:text-amber-400" : "text-foreground"}`}>
                            ₹{Number(plan.price).toLocaleString("en-IN")}
                          </span>
                          <span className="text-muted-foreground">/year</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground line-through">₹{originalPrice.toLocaleString("en-IN")}</span>
                          <Badge variant="secondary" className={`text-xs font-semibold ${
                            isUltimate ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                          }`}>
                            SAVE {discount}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Just ₹{monthlyPrice.toLocaleString("en-IN")}/month</p>
                      </div>

                      {/* Limits */}
                      <div className="space-y-2 text-sm">
                        {plan.max_students ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className={`h-4 w-4 shrink-0 ${isUltimate ? "text-amber-500" : "text-primary"}`} />
                            Up to {plan.max_students.toLocaleString()} students
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground font-medium">
                            <CheckCircle className={`h-4 w-4 shrink-0 ${isUltimate ? "text-amber-500" : "text-primary"}`} />
                            Unlimited students
                          </div>
                        )}
                        {plan.max_teachers ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className={`h-4 w-4 shrink-0 ${isUltimate ? "text-amber-500" : "text-primary"}`} />
                            Up to {plan.max_teachers} teachers
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground font-medium">
                            <CheckCircle className={`h-4 w-4 shrink-0 ${isUltimate ? "text-amber-500" : "text-primary"}`} />
                            Unlimited teachers
                          </div>
                        )}
                      </div>

                      {/* Feature summary */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <CheckCircle className={`h-4 w-4 shrink-0 ${isUltimate ? "text-amber-500" : "text-primary"}`} />
                          {includedCount} features included
                        </div>
                        {lockedCount > 0 && (
                          <div className="flex items-center gap-2 text-muted-foreground/60">
                            <Lock className="h-4 w-4 shrink-0" />
                            {lockedCount} features locked
                          </div>
                        )}
                        {planFeatures.slice(0, 4).map((feat: string, fi: number) => (
                          <div key={fi} className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className={`h-4 w-4 shrink-0 ${isUltimate ? "text-amber-500" : "text-primary"}`} />
                            {feat}
                          </div>
                        ))}
                        {planFeatures.length > 4 && (
                          <p className="text-xs text-muted-foreground pl-6">+ {planFeatures.length - 4} more...</p>
                        )}
                      </div>

                      <Button
                        className={`w-full group/btn hover:scale-[1.02] transition-all duration-300 ${isUltimate ? "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white border-0 shadow-lg" : ""}`}
                        variant={isUltimate ? "default" : isProfessional ? "default" : "outline"}
                        onClick={() => { setSelectedPlan(plan); setRequestOpen(true); }}
                      >
                        {isUltimate ? "Get Ultimate Access" : isProfessional ? "Choose Professional" : "Get Started"} <ChevronRight className="ml-1 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>

                      {isUltimate && (
                        <p className="text-center text-xs text-amber-600 dark:text-amber-400 font-medium">
                          ⚡ Most schools choose this plan
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg" onClick={() => setShowComparison(true)} className="gap-2 hover:scale-105 transition-all duration-300">
              <BarChart3 className="h-4 w-4" /> Compare All Features
            </Button>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              30-day money-back guarantee · Free setup & training · No hidden charges
            </p>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Feature Comparison
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-semibold text-foreground">Feature</th>
                  <th className="text-center py-3 px-2 font-semibold text-foreground">
                    <div className="flex flex-col items-center gap-1"><Zap className="h-4 w-4 text-emerald-500" />Starter</div>
                  </th>
                  <th className="text-center py-3 px-2 font-semibold text-primary">
                    <div className="flex flex-col items-center gap-1"><Star className="h-4 w-4" />Professional</div>
                  </th>
                  <th className="text-center py-3 px-2 font-semibold text-amber-600 dark:text-amber-400">
                    <div className="flex flex-col items-center gap-1"><Crown className="h-4 w-4" />Ultimate</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLAN_FEATURE_LABELS.map((feature, idx) => (
                  <tr key={idx} className={`border-b border-border/50 ${idx % 2 === 0 ? "bg-muted/20" : ""}`}>
                    <td className="py-2.5 px-2 text-foreground">{feature.label}</td>
                    <td className="text-center py-2.5 px-2">
                      {feature.starter ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" /> : <Lock className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                    </td>
                    <td className="text-center py-2.5 px-2">
                      {feature.professional ? <CheckCircle className="h-4 w-4 text-primary mx-auto" /> : <Lock className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                    </td>
                    <td className="text-center py-2.5 px-2">
                      {feature.ultimate ? <CheckCircle className="h-4 w-4 text-amber-500 mx-auto" /> : <Lock className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowComparison(false)}>Close</Button>
            <Button onClick={() => { setShowComparison(false); setSelectedPlan(null); setRequestOpen(true); }}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Section */}
      <section id="login" className="py-20 sm:py-28 scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Access Your Portal</h2>
            <p className="mt-4 text-muted-foreground">Select your role to sign in</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto stagger-children">
            {[
              { role: "school_admin", icon: School, title: "School Admin", desc: "Manage your school's operations, students, teachers & finances.", gradient: "from-primary to-secondary" },
              { role: "teacher", icon: UserCheck, title: "Teacher", desc: "Mark attendance, enter exam marks & view your timetable.", gradient: "from-secondary to-accent" },
              { role: "student", icon: GraduationCap, title: "Student", desc: "View attendance, marks, fee status & school notifications.", gradient: "from-accent to-primary" },
            ].map((item) => (
              <Card
                key={item.role}
                className="glass border-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 cursor-pointer group overflow-hidden relative"
                onClick={() => navigate(`/login?role=${item.role}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-8 text-center relative">
                  <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <item.icon className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{item.desc}</p>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    Sign In <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold text-foreground">EDUPRIMEX</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">India's most trusted school management platform. Empowering 100+ schools with smart technology.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Quick Links</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                <a href="#testimonials" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
                <a href="#login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Login</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Contact Us</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4" /> support@eduprimex.com</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" /> +91 98765 43210</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> India</div>
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} EDUPRIMEX. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <button onClick={handleCrownClick} className="text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors p-1" title="" aria-label="decoration">
                <Crown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Subscription Request Dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedPlan ? `Request ${selectedPlan.name} Plan` : "Start Your Free Trial"}
            </DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
              <span className="font-semibold text-primary">{selectedPlan.name}</span> — ₹{Number(selectedPlan.price).toLocaleString()}/{selectedPlan.duration_months} months
            </div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>School Name *</Label>
                <Input value={form.school_name} onChange={(e) => setForm(p => ({ ...p, school_name: e.target.value }))} placeholder="ABC Public School" />
              </div>
              <div className="space-y-2">
                <Label>Contact Person *</Label>
                <Input value={form.contact_name} onChange={(e) => setForm(p => ({ ...p, contact_name: e.target.value }))} placeholder="Your name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="admin@school.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={form.message} onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Any specific requirements..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
            <Button onClick={handleRequestSubmit} disabled={submitting} className="glow-primary">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              🚀 Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
