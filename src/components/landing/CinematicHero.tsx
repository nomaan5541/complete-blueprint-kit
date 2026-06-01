import { ArrowRight, Play, GraduationCap, Sparkles, BookOpen, Trophy, Users, ClipboardCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  onPrimary: () => void;
};

/**
 * Cinematic, education-themed hero.
 * Pure CSS: aurora gradient + animated grid + orbiting glyphs + staged reveals.
 * No external video assets — fully adapted to school management theme.
 */
export function CinematicHero({ onPrimary }: Props) {
  return (
    <section className="relative isolate overflow-hidden min-h-[92vh] flex items-center">
      {/* Backdrops */}
      <div className="cine-aurora" aria-hidden />
      <div className="cine-grid" aria-hidden />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 100%, hsl(var(--background)) 0%, transparent 60%)",
        }}
      />

      {/* Orbiting education glyphs (decorative, hidden on small screens) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden lg:block" aria-hidden>
        <div className="relative h-[420px] w-[420px]">
          <div className="cine-orbit absolute inset-0">
            <div className="cine-card rounded-2xl p-3 flex items-center gap-2 text-xs absolute -top-4 left-1/2 -translate-x-1/2">
              <ClipboardCheck className="h-4 w-4 text-emerald-500" /> Attendance synced
            </div>
          </div>
          <div className="cine-orbit slow absolute inset-0">
            <div className="cine-card rounded-2xl p-3 flex items-center gap-2 text-xs absolute -top-4 left-1/2 -translate-x-1/2">
              <Trophy className="h-4 w-4 text-amber-500" /> Report cards ready
            </div>
          </div>
          <div className="cine-orbit reverse absolute inset-0">
            <div className="cine-card rounded-2xl p-3 flex items-center gap-2 text-xs absolute -top-4 left-1/2 -translate-x-1/2">
              <Users className="h-4 w-4 text-blue-500" /> 1,248 students
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center w-full">
        <Badge
          variant="secondary"
          className="cine-headline mb-6 px-4 py-1.5 text-sm font-medium backdrop-blur-md bg-background/60 border border-border/60"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
          The Operating System for Modern Schools
        </Badge>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-5xl mx-auto leading-[1.05]">
          <span className="cine-headline block">Run your entire school</span>
          <span className="cine-headline-2 block mt-2 cine-text-gradient">
            from a single screen.
          </span>
        </h1>

        <p className="cine-sub mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Admissions, attendance, exams, fees and parent updates — EduPrimeX brings every part
          of school life into one beautiful, lightning-fast workspace.
        </p>

        <div className="cine-cta mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={onPrimary}
            className="h-14 px-10 text-base rounded-2xl cine-cta-glow bg-gradient-to-r from-primary via-primary to-accent hover:brightness-110 transition"
          >
            Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 px-10 text-base rounded-2xl backdrop-blur-md bg-background/50 border-border/60 hover:bg-background/80"
          >
            <a href="#features">
              <Play className="mr-2 h-4 w-4" /> See it in motion
            </a>
          </Button>
        </div>

        {/* Floating preview cards */}
        <div className="cine-sub mt-16 grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {[
            { icon: GraduationCap, label: "Admissions", value: "+128 this term" },
            { icon: ClipboardCheck, label: "Attendance", value: "97.4%" },
            { icon: BookOpen, label: "Assignments", value: "324 active" },
            { icon: Trophy, label: "Avg. score", value: "A grade" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="cine-card rounded-2xl p-4 text-left cine-tilt"
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              <s.icon className="h-5 w-5 text-primary mb-2" />
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-base font-bold tabular-nums">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-14 flex items-center justify-center text-muted-foreground">
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
