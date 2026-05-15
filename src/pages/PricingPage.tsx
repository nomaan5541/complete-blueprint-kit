import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Check, X, ArrowLeft, Crown, Star, Zap, MessageSquare } from "lucide-react";
import { PLAN_FEATURE_LABELS } from "@/hooks/useSubscriptionPlan";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import SEO from "@/components/SEO";

interface PlanData {
  id: string;
  name: string;
  price: number;
  duration_months: number;
  max_students: number | null;
  max_teachers: number | null;
  features: any;
  is_active: boolean;
}

const planIcons: Record<string, any> = {
  "Free Trial": Zap, Starter: Star, Professional: Crown, Ultimate: Crown,
};
const planColors: Record<string, string> = {
  "Free Trial": "from-emerald-500 to-teal-600",
  Starter: "from-blue-500 to-indigo-600",
  Professional: "from-purple-500 to-pink-600",
  Ultimate: "from-amber-500 to-orange-600",
};
const planBadges: Record<string, string> = {
  Starter: "Save 33%", Professional: "Most Popular", Ultimate: "Best Value",
};

export default function PricingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [customOpen, setCustomOpen] = useState(false);
  const [customForm, setCustomForm] = useState({ name: "", email: "", school: "", message: "" });

  useEffect(() => {
    supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true })
      .then(({ data }) => {
        setPlans((data as any) || []);
        setLoading(false);
      });
  }, []);

  const handleCustomRequest = () => {
    if (!customForm.name || !customForm.email) {
      toast.error("Please fill name and email"); return;
    }
    toast.success("Your customization request has been submitted! We'll get back to you within 24 hours.");
    setCustomOpen(false);
    setCustomForm({ name: "", email: "", school: "", message: "" });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading plans...</div>;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Pricing Plans | EduPrimeX School ERP"
        description="Compare EduPrimeX subscription plans — Free Trial, Starter, Professional, and Ultimate. Transparent pricing for single and multi-school setups."
        canonical="https://eduprimex.lovable.app/pricing"
        keywords="school ERP pricing, school management system price, EduPrimeX plans"
      />
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">Pricing Plans</Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Choose the Perfect Plan for Your School</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Flexible pricing designed for schools of all sizes. Start free and scale as you grow.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = planIcons[plan.name] || Star;
            const gradient = planColors[plan.name] || "from-gray-500 to-gray-600";
            const badge = planBadges[plan.name];
            const isPro = plan.name === "Professional";
            const durationLabel = plan.duration_months > 1 ? `${plan.duration_months} months` : `${plan.duration_months} month`;

            return (
              <Card key={plan.id} className={`relative overflow-hidden text-left transition-all hover:shadow-xl ${isPro ? "ring-2 ring-primary scale-105 z-10" : ""}`}>
                {badge && (
                  <div className="absolute top-3 right-3">
                    <Badge className={`bg-gradient-to-r ${gradient} border-0 text-xs`}>{badge}</Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    {plan.price === 0 ? (
                      <div className="text-3xl font-bold text-foreground">Free</div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-foreground">₹{plan.price.toLocaleString()}</span>
                        <span className="text-muted-foreground text-sm">/{durationLabel}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Students</span>
                      <span className="font-medium">{plan.max_students ?? "Unlimited"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Teachers</span>
                      <span className="font-medium">{plan.max_teachers ?? "Unlimited"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{durationLabel}</span>
                    </div>
                  </div>
                  <Button className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90`} onClick={() => navigate("/login?role=school_admin")}>
                    {plan.price === 0 ? "Start Free" : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Custom Plan CTA */}
        <div className="mt-16 max-w-2xl mx-auto">
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="py-8 text-center">
              <MessageSquare className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-bold mb-2">Need a Custom Plan?</h3>
              <p className="text-muted-foreground mb-4">Have specific requirements? We'll create a customized plan tailored to your school's needs.</p>
              <Button onClick={() => setCustomOpen(true)} variant="default" size="lg">Request Custom Plan</Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison */}
        <div className="mt-16 max-w-5xl mx-auto text-left">
          <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Feature</th>
                  <th className="text-center py-3 px-2 font-semibold text-sm">Free Trial</th>
                  <th className="text-center py-3 px-2 font-semibold text-sm">Starter</th>
                  <th className="text-center py-3 px-2 font-semibold text-sm">Professional</th>
                  <th className="text-center py-3 px-2 font-semibold text-sm">Ultimate</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_FEATURE_LABELS.map((feat, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">{feat.label}</td>
                    {[feat.trial, feat.starter, feat.professional, feat.ultimate].map((v, j) => (
                      <td key={j} className="text-center py-3 px-2">
                        {v ? <Check className="h-4 w-4 text-primary mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Custom Plan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Your Name *</Label>
              <Input value={customForm.name} onChange={(e) => setCustomForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={customForm.email} onChange={(e) => setCustomForm((p) => ({ ...p, email: e.target.value }))} placeholder="your@email.com" />
            </div>
            <div className="space-y-1">
              <Label>School Name</Label>
              <Input value={customForm.school} onChange={(e) => setCustomForm((p) => ({ ...p, school: e.target.value }))} placeholder="School name" />
            </div>
            <div className="space-y-1">
              <Label>Requirements</Label>
              <Textarea value={customForm.message} onChange={(e) => setCustomForm((p) => ({ ...p, message: e.target.value }))} placeholder="Describe your specific needs..." rows={4} />
            </div>
            <Button onClick={handleCustomRequest} className="w-full">Submit Request</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
