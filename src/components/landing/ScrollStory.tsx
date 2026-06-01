import { useEffect, useRef, useState } from "react";
import { Shield, Users, GraduationCap, ClipboardCheck, Wallet, BookMarked, Bell } from "lucide-react";

type Panel = {
  eyebrow: string;
  title: string;
  body: string;
  bullets: { icon: any; text: string }[];
  accent: string; // tailwind text color class
};

const panels: Panel[] = [
  {
    eyebrow: "For school admins",
    title: "Command every classroom from one cockpit.",
    body: "Live dashboards, fee collections, staff activity and AI insights — all in real time, all on one screen.",
    bullets: [
      { icon: Shield, text: "Multi-tenant security & RLS" },
      { icon: Wallet, text: "Fees, receipts & dues in seconds" },
      { icon: Bell, text: "Auto SMS & WhatsApp to parents" },
    ],
    accent: "text-primary",
  },
  {
    eyebrow: "For teachers",
    title: "Less paperwork. More teaching.",
    body: "Mark attendance, enter marks, push assignments and chat with parents from any device — even offline.",
    bullets: [
      { icon: ClipboardCheck, text: "1-tap attendance with face scan" },
      { icon: BookMarked, text: "Homework & study material library" },
      { icon: Users, text: "Class-scoped student insights" },
    ],
    accent: "text-accent",
  },
  {
    eyebrow: "For students",
    title: "A school that finally feels modern.",
    body: "A premium, app-like portal for timetables, results, AI tutor, fees and announcements — installable on any phone.",
    bullets: [
      { icon: GraduationCap, text: "Personal AI study assistant" },
      { icon: BookMarked, text: "Live timetable & homework" },
      { icon: Bell, text: "Instant exam & event alerts" },
    ],
    accent: "text-secondary",
  },
];

export function ScrollStory() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            setActive(idx);
          }
        });
      },
      { threshold: 0.55 }
    );
    refs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="relative py-20 sm:py-32 overflow-hidden">
      <div className="cine-aurora opacity-50" aria-hidden />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12">
        {/* Sticky cinematic preview */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="relative aspect-square max-w-md mx-auto cine-card rounded-3xl p-8 overflow-hidden">
            <div className="absolute inset-0 cine-grid opacity-40" aria-hidden />
            {panels.map((p, i) => {
              const Icon = p.bullets[0].icon;
              return (
                <div
                  key={i}
                  className={`absolute inset-0 p-8 flex flex-col justify-between transition-all duration-700 ${
                    active === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
                  }`}
                >
                  <div className={`text-xs font-bold uppercase tracking-widest ${p.accent}`}>{p.eyebrow}</div>
                  <div className="flex items-center justify-center flex-1">
                    <div className="relative">
                      <Icon className={`h-32 w-32 ${p.accent} drop-shadow-[0_20px_40px_hsl(var(--primary)/0.4)]`} strokeWidth={1.2} />
                      <div className="absolute inset-0 cine-orbit slow">
                        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full ${p.accent} bg-current`} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {p.bullets.map((b) => (
                      <div key={b.text} className="flex items-center gap-2 text-sm cine-card rounded-xl px-3 py-2">
                        <b.icon className={`h-4 w-4 ${p.accent}`} /> {b.text}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrolling panels */}
        <div className="space-y-32">
          {panels.map((p, i) => (
            <div
              key={i}
              data-idx={i}
              ref={(el) => (refs.current[i] = el)}
              className="min-h-[60vh] flex flex-col justify-center"
            >
              <div className={`text-xs font-bold uppercase tracking-widest ${p.accent}`}>{p.eyebrow}</div>
              <h3 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">{p.title}</h3>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl">{p.body}</p>
              <ul className="mt-6 space-y-2">
                {p.bullets.map((b) => (
                  <li key={b.text} className="flex items-center gap-3 text-base">
                    <span className={`h-9 w-9 rounded-xl flex items-center justify-center bg-background/60 border border-border/60 ${p.accent}`}>
                      <b.icon className="h-5 w-5" />
                    </span>
                    {b.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
