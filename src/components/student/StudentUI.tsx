import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode, ElementType } from "react";

export function StudentPanel({
  children,
  className,
  as: Comp = "div",
  ...props
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  [key: string]: any;
}) {
  return (
    <Comp className={cn("student-panel", className)} {...props}>
      {children}
    </Comp>
  );
}

export function StudentEmpty({ icon: Icon, title, text }: { icon?: LucideIcon; title: string; text?: string }) {
  return (
    <div className="student-panel p-8 text-center flex flex-col items-center justify-center min-h-36">
      {Icon && (
        <div className="student-icon-frame mb-3">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="font-bold text-sm">{title}</p>
      {text && <p className="student-muted-text text-xs mt-1 max-w-sm">{text}</p>}
    </div>
  );
}

export function StudentIconTile({
  icon: Icon,
  label,
  badge,
  tone = "violet",
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  badge?: number;
  tone?: "violet" | "blue" | "green" | "amber" | "rose" | "cyan" | "pink" | "orange";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="student-tile group relative min-h-[92px] sm:min-h-[108px] flex flex-col items-center justify-center gap-2 p-2.5 active:scale-95 transition"
    >
      {!!badge && badge > 0 && (
        <span className="absolute top-2 right-2 min-w-5 h-5 px-1 rounded-full bg-[hsl(var(--student-danger))] text-[hsl(var(--student-foreground))] text-[10px] font-extrabold flex items-center justify-center shadow-lg">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      <span className={cn("student-icon-frame", toneClass(tone))}>
        <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.9} />
      </span>
      <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight text-[hsl(var(--student-foreground))] line-clamp-2">
        {label}
      </span>
    </button>
  );
}

export function StudentStatTile({
  label,
  value,
  subtitle,
  icon: Icon,
  tone = "violet",
  onClick,
}: {
  label: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  tone?: "violet" | "blue" | "green" | "amber" | "rose" | "cyan" | "pink" | "orange";
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="student-muted-text text-xs truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-extrabold mt-1 tabular-nums truncate">{value}</p>
          <p className="text-xs mt-1 text-[hsl(var(--student-primary))] truncate">{subtitle}</p>
        </div>
        <span className={cn("student-mini-icon", toneClass(tone))}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="student-panel p-3 sm:p-4 text-left min-w-0 active:scale-[0.98] transition">
        {content}
      </button>
    );
  }

  return (
    <div className="student-panel p-3 sm:p-4 text-left min-w-0 active:scale-[0.98] transition">
      {content}
    </div>
  );
}

export function TimelineRow({
  time,
  title,
  subtitle,
  status,
  tone = "violet",
}: {
  time: string;
  title: string;
  subtitle?: string;
  status?: string;
  tone?: "violet" | "blue" | "green" | "amber" | "rose" | "cyan" | "pink" | "orange";
}) {
  const [hour, suffix] = formatDisplayTime(time).split(" ");
  return (
    <div className="grid grid-cols-[72px_22px_minmax(0,1fr)] sm:grid-cols-[88px_24px_minmax(0,1fr)] gap-2 sm:gap-4 py-2.5">
      <div className={cn("rounded-xl px-2 py-2 text-center self-start", toneBg(tone))}>
        <p className="text-base sm:text-lg font-extrabold tabular-nums leading-none">{hour}</p>
        <p className="text-[10px] font-bold mt-1 opacity-90">{suffix || ""}</p>
      </div>
      <div className="flex flex-col items-center pt-4">
        <span className={cn("h-3 w-3 rounded-full ring-4 ring-[hsl(var(--student-bg))]", toneDot(tone))} />
        <span className="flex-1 w-px bg-[hsl(var(--student-border))] mt-2" />
      </div>
      <div className="student-panel-soft rounded-2xl px-4 py-3 flex items-center gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm sm:text-base truncate">{title}</p>
          {subtitle && <p className="student-muted-text text-xs mt-1 truncate">{subtitle}</p>}
        </div>
        {status && <span className="student-chip shrink-0">{status}</span>}
      </div>
    </div>
  );
}

export function formatDisplayTime(value?: string) {
  if (!value || value === "—") return "—";
  const [rawH, rawM = "00"] = value.slice(0, 5).split(":");
  const h = Number(rawH);
  if (Number.isNaN(h)) return value;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12.toString().padStart(2, "0")}:${rawM} ${suffix}`;
}

function toneClass(tone: string) {
  return {
    violet: "student-tone-violet",
    blue: "student-tone-blue",
    green: "student-tone-green",
    amber: "student-tone-amber",
    rose: "student-tone-rose",
    cyan: "student-tone-cyan",
    pink: "student-tone-pink",
    orange: "student-tone-orange",
  }[tone] || "student-tone-violet";
}

function toneBg(tone: string) {
  return {
    violet: "bg-[hsl(var(--student-violet)/0.16)] text-[hsl(var(--student-violet))]",
    blue: "bg-[hsl(var(--student-blue)/0.16)] text-[hsl(var(--student-blue))]",
    green: "bg-[hsl(var(--student-green)/0.16)] text-[hsl(var(--student-green))]",
    amber: "bg-[hsl(var(--student-amber)/0.16)] text-[hsl(var(--student-amber))]",
    rose: "bg-[hsl(var(--student-rose)/0.16)] text-[hsl(var(--student-rose))]",
    cyan: "bg-[hsl(var(--student-cyan)/0.16)] text-[hsl(var(--student-cyan))]",
    pink: "bg-[hsl(var(--student-pink)/0.16)] text-[hsl(var(--student-pink))]",
    orange: "bg-[hsl(var(--student-orange)/0.16)] text-[hsl(var(--student-orange))]",
  }[tone] || "bg-[hsl(var(--student-violet)/0.16)] text-[hsl(var(--student-violet))]";
}

function toneDot(tone: string) {
  return {
    violet: "bg-[hsl(var(--student-violet))]",
    blue: "bg-[hsl(var(--student-blue))]",
    green: "bg-[hsl(var(--student-green))]",
    amber: "bg-[hsl(var(--student-amber))]",
    rose: "bg-[hsl(var(--student-rose))]",
    cyan: "bg-[hsl(var(--student-cyan))]",
    pink: "bg-[hsl(var(--student-pink))]",
    orange: "bg-[hsl(var(--student-orange))]",
  }[tone] || "bg-[hsl(var(--student-violet))]";
}
