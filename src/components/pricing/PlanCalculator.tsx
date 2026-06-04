import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, Sparkles, Users, GraduationCap, TrendingDown } from "lucide-react";

interface PlanData {
  id: string;
  name: string;
  price: number;
  duration_months: number;
  max_students: number | null;
  max_teachers: number | null;
}

interface Props {
  plans: PlanData[];
  onChoosePlan: (planName: string) => void;
  onRequestCustom: () => void;
}

export default function PlanCalculator({ plans, onChoosePlan, onRequestCustom }: Props) {
  const [students, setStudents] = useState(250);
  const [teachers, setTeachers] = useState(20);

  const paid = useMemo(
    () => plans.filter((p) => p.price > 0).sort((a, b) => a.price - b.price),
    [plans],
  );

  const recommended = useMemo(() => {
    return paid.find(
      (p) =>
        (p.max_students == null || p.max_students >= students) &&
        (p.max_teachers == null || p.max_teachers >= teachers),
    );
  }, [paid, students, teachers]);

  const annual = recommended ? recommended.price * (12 / recommended.duration_months) : null;
  const perStudentMonth = recommended && students > 0 ? annual! / 12 / students : null;

  const needsCustom = !recommended && (students > 0 || teachers > 0);

  return (
    <Card className="max-w-5xl mx-auto text-left overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-2xl">Pricing Calculator</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Tell us your school size — we'll suggest the right plan.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-8 md:grid-cols-2 p-6 md:p-8">
        {/* Inputs */}
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base">
                <GraduationCap className="h-4 w-4 text-primary" /> Students
              </Label>
              <Input
                type="number"
                min={0}
                max={5000}
                value={students}
                onChange={(e) => setStudents(Math.max(0, Math.min(5000, Number(e.target.value) || 0)))}
                className="w-24 h-9 text-right"
              />
            </div>
            <Slider
              value={[students]}
              min={0}
              max={2000}
              step={10}
              onValueChange={(v) => setStudents(v[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span><span>500</span><span>1000</span><span>2000+</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-secondary" /> Teachers
              </Label>
              <Input
                type="number"
                min={0}
                max={500}
                value={teachers}
                onChange={(e) => setTeachers(Math.max(0, Math.min(500, Number(e.target.value) || 0)))}
                className="w-24 h-9 text-right"
              />
            </div>
            <Slider
              value={[teachers]}
              min={0}
              max={200}
              step={1}
              onValueChange={(v) => setTeachers(v[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span><span>50</span><span>100</span><span>200+</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Annual billing. GST extra. Need monthly billing or on-prem hosting?{" "}
            <button onClick={onRequestCustom} className="text-primary underline underline-offset-2">
              Ask for a custom quote
            </button>.
          </p>
        </div>

        {/* Result */}
        <div className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6 flex flex-col justify-between">
          {needsCustom ? (
            <div className="space-y-4 text-center">
              <Sparkles className="h-10 w-10 mx-auto text-primary" />
              <h3 className="text-xl font-bold">You're enterprise-scale</h3>
              <p className="text-sm text-muted-foreground">
                With {students} students and {teachers} teachers, we'll build a tailored
                multi-campus plan with volume discounts and priority onboarding.
              </p>
              <Button className="w-full" size="lg" onClick={onRequestCustom}>
                Request Custom Quote
              </Button>
            </div>
          ) : recommended ? (
            <>
              <div className="space-y-3">
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="text-3xl font-bold">{recommended.name}</h3>
                  <span className="text-sm text-muted-foreground">plan</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tabular-nums">
                    ₹{annual!.toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm text-muted-foreground">/ year</span>
                </div>
                {perStudentMonth !== null && students > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingDown className="h-4 w-4 text-emerald-500" />
                    Effective ₹{perStudentMonth.toFixed(1)} per student / month
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 my-6 text-sm">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-muted-foreground text-xs">Student cap</div>
                  <div className="font-semibold">{recommended.max_students ?? "Unlimited"}</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-muted-foreground text-xs">Teacher cap</div>
                  <div className="font-semibold">{recommended.max_teachers ?? "Unlimited"}</div>
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={() => onChoosePlan(recommended.name)}>
                Get Started with {recommended.name}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center my-auto">
              Adjust the sliders to see a recommendation.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
