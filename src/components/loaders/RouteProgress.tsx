import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { TopProgressBar, useDelayedTrue } from "./PremiumLoader";

/**
 * Mounts a top progress bar that briefly animates on every route change.
 * Uses a delay so fast in-cache navigations don't flash.
 */
export function RouteProgress() {
  const location = useLocation();
  const navType = useNavigationType();

  // Trigger on path change
  const active = useRouteTransitionFlag(location.pathname + location.search);
  const show = useDelayedTrue(active, 80);

  // navType used only to avoid TS unused warning; we trigger on path key
  useEffect(() => { void navType; }, [navType]);

  return <TopProgressBar active={show} />;
}

function useRouteTransitionFlag(key: string) {
  // Briefly true on key change, then auto-off.
  const [active, setActive] = useStateBool(false);
  useEffect(() => {
    setActive(true);
    const t = window.setTimeout(() => setActive(false), 600);
    return () => window.clearTimeout(t);
  }, [key]);
  return active;
}

function useStateBool(initial: boolean): [boolean, (v: boolean) => void] {
  // tiny wrapper to avoid importing useState twice in this file
  // (kept for clarity; behaves identical to React.useState)
  const [v, set] = (require("react") as typeof import("react")).useState(initial);
  return [v, set];
}
