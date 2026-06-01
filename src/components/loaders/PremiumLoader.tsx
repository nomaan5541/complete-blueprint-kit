import { useEffect, useRef, useState, type ImgHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ----------------------------- Skeleton ----------------------------- */
export function Skeleton({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("lv-shimmer rounded-md", className)} {...rest} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-4 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <SkeletonText lines={2} />
    </div>
  );
}

/** Shimmer rows for table loading states. Renders a single <tr> with a colSpan cell containing N shimmer bars. */
export function SkeletonTableRows({ rows = 5, colSpan }: { rows?: number; colSpan: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border/40">
          <td colSpan={colSpan} className="py-3 px-4">
            <Skeleton className="h-4 w-full" />
          </td>
        </tr>
      ))}
    </>
  );
}

/** Generic stats grid skeleton (4 KPI cards). */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/40 bg-card/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Dashboard skeleton: header + stats grid + 2 large panels. */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6 lv-blur-in">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-3 w-40" />
      </div>
      <SkeletonStats count={4} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    </div>
  );
}

/* --------------------------- TopProgressBar -------------------------- */
/** Indeterminate easing bar shown during route/Suspense changes. */
export function TopProgressBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] overflow-hidden bg-transparent pointer-events-none">
      <div
        className="h-full w-1/3 rounded-r-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--primary)), hsl(var(--accent)), transparent)",
          animation: "lv-progress 1.1s cubic-bezier(.4,0,.2,1) infinite",
          boxShadow: "0 0 12px hsl(var(--primary) / 0.6)",
        }}
      />
    </div>
  );
}

/* -------------------------- CinematicLoader -------------------------- */
const STAGES = [
  "Preparing experience",
  "Optimizing assets",
  "Securing session",
  "Almost ready",
];

/** Full-screen staged loader with fake-but-realistic progress + particles. */
export function CinematicLoader({ label }: { label?: string }) {
  const [pct, setPct] = useState(8);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (t: number) => {
      const elapsed = (t - start) / 1000;
      // logistic-ish curve toward 92%, then crawl
      const target = 92 * (1 - Math.exp(-elapsed * 0.9)) + Math.min(7, elapsed * 0.4);
      setPct((p) => Math.min(99, Math.max(p, target)));
      const next = Math.min(STAGES.length - 1, Math.floor(elapsed / 0.9));
      setStage(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-background/80 backdrop-blur-xl lv-blur-in">
      {/* particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              width: `${4 + (i % 4) * 2}px`,
              height: `${4 + (i % 4) * 2}px`,
              background: `hsl(var(--primary) / ${0.18 + (i % 3) * 0.08})`,
              filter: "blur(1px)",
              animation: `lv-float ${3 + (i % 5)}s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative w-[88%] max-w-sm rounded-3xl border border-border/40 bg-card/60 backdrop-blur-2xl p-7 shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.35)] lv-rise">
        <div className="flex flex-col items-center gap-5">
          {/* liquid morph spinner with neon ring */}
          <div className="relative h-16 w-16">
            <div
              className="absolute inset-0 lv-spin-morph"
              style={{
                background: "conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))",
                filter: "blur(.5px)",
              }}
            />
            <div className="absolute inset-[3px] rounded-[40%] bg-card" />
            <div className="absolute inset-0 rounded-full lv-glow-pulse" />
          </div>

          <div className="w-full text-center space-y-1">
            <div className="text-sm font-semibold tracking-wide text-foreground">
              {label || STAGES[stage]}
              <span className="inline-block ml-0.5 w-[1px] h-3 align-middle bg-foreground" style={{ animation: "lv-caret 1s steps(1) infinite" }} />
            </div>
            <div className="text-[11px] text-muted-foreground tabular-nums">{Math.floor(pct)}%</div>
          </div>

          {/* progress track */}
          <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden relative">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
                boxShadow: "0 0 18px hsl(var(--primary) / 0.6)",
              }}
            />
            {/* scanning gleam */}
            <div
              className="absolute inset-y-0 w-1/3"
              style={{
                background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.35), transparent)",
                animation: "lv-progress 1.4s cubic-bezier(.4,0,.2,1) infinite",
                mixBlendMode: "overlay",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- RouteSuspense wrapper ---------------------- */
/** Suspense fallback combining a top bar + cinematic loader. */
export function RouteFallback({ label }: { label?: string }) {
  return (
    <>
      <TopProgressBar active />
      <CinematicLoader label={label} />
    </>
  );
}

/* -------------------------- ProgressiveImage ------------------------ */
export function ProgressiveImage({
  src,
  className,
  wrapperClassName,
  alt = "",
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & { wrapperClassName?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-muted/40", wrapperClassName)}>
      {!loaded && <div className="absolute inset-0 lv-shimmer" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          "w-full h-full object-cover transition-all duration-700 will-change-[filter,opacity]",
          loaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-md scale-[1.03]",
          className,
        )}
        {...rest}
      />
    </div>
  );
}

/* ---------------------------- PageReveal ---------------------------- */
/** Wrap a page to fade+blur-in on mount, and stagger top-level children. */
export function PageReveal({ children, stagger = false, className }: { children: ReactNode; stagger?: boolean; className?: string }) {
  return <div className={cn("lv-blur-in", stagger && "lv-stagger", className)}>{children}</div>;
}

/* --------------------------- Button spinner ------------------------- */
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin", className)}
      aria-hidden
    />
  );
}

/* ----------------------- useDelayed (avoid flash) -------------------- */
/** Returns true only after `delay`ms — prevents loader flashing for fast loads. */
export function useDelayedTrue(active: boolean, delay = 180) {
  const [show, setShow] = useState(false);
  const t = useRef<number | null>(null);
  useEffect(() => {
    if (active) {
      t.current = window.setTimeout(() => setShow(true), delay);
    } else {
      if (t.current) window.clearTimeout(t.current);
      setShow(false);
    }
    return () => { if (t.current) window.clearTimeout(t.current); };
  }, [active, delay]);
  return show;
}
