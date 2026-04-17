import LegalLayout from "@/components/LegalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart, School, Users, Shield } from "lucide-react";

export default function About() {
  return (
    <LegalLayout
      title="About EDUPRIMEX"
      description="EDUPRIMEX is a multi-school management SaaS platform built for schools, colleges, and institutes."
    >
      <p className="text-lg">
        <strong>EDUPRIMEX</strong> is a complete multi-school management platform that helps
        schools, colleges, and institutes run their academic and administrative operations from a
        single, secure dashboard.
      </p>

      <h2>What we do</h2>
      <p>
        We replace scattered registers, spreadsheets, and disconnected tools with one unified
        system covering admissions, attendance, exams, fees, timetables, communication, AI report
        cards, and more — all designed for the realities of Indian schools.
      </p>

      <h2>Who it is for</h2>
      <ul>
        <li><strong>Schools</strong> — primary, secondary, and senior secondary.</li>
        <li><strong>Colleges & junior colleges</strong> — managing multiple streams and electives.</li>
        <li><strong>Coaching institutes & academies</strong> — handling batches, attendance, and fees.</li>
        <li><strong>School groups</strong> — centrally managing many branches with isolated data per branch.</li>
      </ul>

      <div className="not-prose grid sm:grid-cols-3 gap-4 my-8">
        <Card>
          <CardContent className="p-5">
            <Target className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-bold text-foreground mb-1">Mission</h3>
            <p className="text-sm text-muted-foreground">
              Make professional school management accessible to every institution, regardless of size or budget.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Eye className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-bold text-foreground mb-1">Vision</h3>
            <p className="text-sm text-muted-foreground">
              Become the most trusted school operating system across South Asia by 2030.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Heart className="h-6 w-6 text-primary mb-2" />
            <h3 className="font-bold text-foreground mb-1">Values</h3>
            <p className="text-sm text-muted-foreground">
              Privacy, simplicity, and genuine support for educators.
            </p>
          </CardContent>
        </Card>
      </div>

      <h2>Why schools choose us</h2>
      <div className="not-prose grid sm:grid-cols-3 gap-4 my-6">
        <div className="flex gap-3">
          <School className="h-5 w-5 text-primary mt-1 shrink-0" />
          <div>
            <h4 className="font-semibold text-foreground text-sm">Multi-tenant by design</h4>
            <p className="text-xs text-muted-foreground">Each school is fully isolated.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Users className="h-5 w-5 text-primary mt-1 shrink-0" />
          <div>
            <h4 className="font-semibold text-foreground text-sm">Built for 4 roles</h4>
            <p className="text-xs text-muted-foreground">Super Admin, School Admin, Teacher, Student.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Shield className="h-5 w-5 text-primary mt-1 shrink-0" />
          <div>
            <h4 className="font-semibold text-foreground text-sm">Secure by default</h4>
            <p className="text-xs text-muted-foreground">RLS, audit logs, and 2FA for admins.</p>
          </div>
        </div>
      </div>

      <h2>Get in touch</h2>
      <p>
        Want a demo for your school? Reach us at{" "}
        <a href="mailto:Nomaankhangta@gmail.com" className="text-primary underline">Nomaankhangta@gmail.com</a>{" "}
        or <a href="tel:+918977397763" className="text-primary underline">+91 89773 97763</a>.
      </p>
    </LegalLayout>
  );
}
