import { useState, useEffect } from "react";
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

export default function LandingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ school_name: "", contact_name: "", email: "", phone: "", message: "" });
  const [crownClicks, setCrownClicks] = useState(0);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("price").then(({ data }) => {
      setPlans(data || []);
    });
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
      toast.success("Request submitted! We'll contact you shortly.");
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

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">EDUPRIMEX</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</a>
              <ThemeToggle />
            </div>
            <div className="md:hidden"><ThemeToggle /></div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium animate-fade-in">
            <Zap className="h-3.5 w-3.5 mr-1.5" /> Trusted by Schools Across India
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
            Complete School Management
            <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mt-2">
              Made Simple
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Streamline admissions, attendance, fees, exams & more. One powerful platform for schools, teachers & students.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base shadow-lg" onClick={() => { setSelectedPlan(null); setRequestOpen(true); }}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <a href="#features">Explore Features</a>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { label: "Schools", value: "100+", icon: School },
              { label: "Students", value: "50K+", icon: Users },
              { label: "Teachers", value: "5K+", icon: UserCheck },
              { label: "Uptime", value: "99.9%", icon: CheckCircle },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-4 text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1">
              <Award className="h-3.5 w-3.5 mr-1.5" /> Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Everything Your School Needs</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">A comprehensive suite of tools designed specifically for Indian schools.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="glass border-0 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
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

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28">
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
              plans.map((plan) => {
                const isUltimate = plan.name?.toLowerCase() === "ultimate";
                const isProfessional = plan.name?.toLowerCase() === "professional";
                const planFeatures = Array.isArray(plan.features) ? plan.features : [];
                
                const offerTag = isUltimate
                  ? "BEST VALUE"
                  : isProfessional
                  ? "MOST POPULAR"
                  : "GREAT START";
                
                const originalPrice = isUltimate ? 29999 : isProfessional ? 14999 : 7999;
                const savings = originalPrice - Number(plan.price);
                const discount = Math.round((savings / originalPrice) * 100);
                const monthlyPrice = Math.round(Number(plan.price) / (plan.duration_months || 12));

                // Get feature counts for this plan tier
                const tierKey = isUltimate ? "ultimate" : isProfessional ? "professional" : "starter";
                const includedCount = PLAN_FEATURE_LABELS.filter(f => f[tierKey as keyof typeof f]).length;
                const lockedCount = PLAN_FEATURE_LABELS.length - includedCount;

                return (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                      isUltimate
                        ? "border-2 border-yellow-500/60 shadow-2xl scale-[1.04] bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-orange-950/20"
                        : isProfessional
                        ? "border-2 border-primary shadow-xl scale-[1.02]"
                        : "glass border-0 hover:shadow-lg"
                    }`}
                  >
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

                    <CardHeader className="pb-4 pt-8">
                      <CardTitle className={`text-xl ${isUltimate ? "text-amber-700 dark:text-amber-400 flex items-center gap-2" : ""}`}>
                        {isUltimate && <Crown className="h-5 w-5" />}
                        {plan.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Pricing with offer */}
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
                        <p className="text-xs text-muted-foreground mt-1">
                          Just ₹{monthlyPrice.toLocaleString("en-IN")}/month
                        </p>
                      </div>

                      {/* Student/Teacher limits */}
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
                        className={`w-full ${isUltimate ? "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white border-0 shadow-lg" : ""}`}
                        variant={isUltimate ? "default" : isProfessional ? "default" : "outline"}
                        onClick={() => { setSelectedPlan(plan); setRequestOpen(true); }}
                      >
                        {isUltimate ? "Get Ultimate Access" : isProfessional ? "Choose Professional" : "Get Started"} <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Compare plans button */}
          <div className="text-center mt-8">
            <Button variant="outline" size="lg" onClick={() => setShowComparison(true)} className="gap-2">
              <BarChart3 className="h-4 w-4" /> Compare All Features
            </Button>
          </div>
          
          {/* Trust badge */}
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
                    <div className="flex flex-col items-center gap-1">
                      <Zap className="h-4 w-4 text-emerald-500" />
                      Starter
                    </div>
                  </th>
                  <th className="text-center py-3 px-2 font-semibold text-primary">
                    <div className="flex flex-col items-center gap-1">
                      <Star className="h-4 w-4" />
                      Professional
                    </div>
                  </th>
                  <th className="text-center py-3 px-2 font-semibold text-amber-600 dark:text-amber-400">
                    <div className="flex flex-col items-center gap-1">
                      <Crown className="h-4 w-4" />
                      Ultimate
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLAN_FEATURE_LABELS.map((feature, idx) => (
                  <tr key={idx} className={`border-b border-border/50 ${idx % 2 === 0 ? "bg-muted/20" : ""}`}>
                    <td className="py-2.5 px-2 text-foreground">{feature.label}</td>
                    <td className="text-center py-2.5 px-2">
                      {feature.starter ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-2.5 px-2">
                      {feature.professional ? (
                        <CheckCircle className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-2.5 px-2">
                      {feature.ultimate ? (
                        <CheckCircle className="h-4 w-4 text-amber-500 mx-auto" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
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
      <section id="login" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Access Your Portal</h2>
            <p className="mt-4 text-muted-foreground">Select your role to sign in</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                role: "school_admin",
                icon: School,
                title: "School Admin",
                desc: "Manage your school's operations, students, teachers & finances.",
                gradient: "from-primary to-secondary",
              },
              {
                role: "teacher",
                icon: UserCheck,
                title: "Teacher",
                desc: "Mark attendance, enter exam marks & view your timetable.",
                gradient: "from-secondary to-accent",
              },
              {
                role: "student",
                icon: GraduationCap,
                title: "Student",
                desc: "View attendance, marks, fee status & school notifications.",
                gradient: "from-accent to-primary",
              },
            ].map((item) => (
              <Card
                key={item.role}
                className="glass border-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
                onClick={() => navigate(`/login?role=${item.role}`)}
              >
                <CardContent className="p-8 text-center">
                  <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{item.desc}</p>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Sign In <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer with hidden crown */}
      <footer className="border-t border-border/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-semibold text-foreground">EDUPRIMEX</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} EDUPRIMEX. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              {/* Hidden super admin access - triple click the crown */}
              <button
                onClick={handleCrownClick}
                className="text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors p-1"
                title=""
                aria-label="decoration"
              >
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
              {selectedPlan ? `Request ${selectedPlan.name} Plan` : "Request a Subscription"}
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
            <Button onClick={handleRequestSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
