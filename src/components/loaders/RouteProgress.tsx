import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { TopProgressBar, useDelayedTrue } from "./PremiumLoader";

/** Mounts a top progress bar that briefly animates on every route change. */
export function RouteProgress() {
  const location = useLocation();
  const key = location.pathname + location.search;
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const t = window.setTimeout(() => setActive(false), 550);
    return () => window.clearTimeout(t);
  }, [key]);

  const show = useDelayedTrue(active, 80);
  return <TopProgressBar active={show} />;
}
