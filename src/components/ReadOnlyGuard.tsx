import { ReactNode, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useSchool } from "@/hooks/useSchool";
import { toast } from "sonner";

const READ_ONLY_MSG = "School is in read-only mode. Subscription renewal is required to make changes.";

/**
 * Wraps any interactive element. When school is in read-only mode,
 * clicks are intercepted and a toast is shown instead.
 */
export function ReadOnlyGuard({ children, fallbackMessage }: { children: ReactNode; fallbackMessage?: string }) {
  const { isReadOnly } = useSchool();

  if (!isReadOnly) return <>{children}</>;

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toast.error(fallbackMessage || READ_ONLY_MSG);
      }}
      className="contents cursor-not-allowed"
    >
      <div className="pointer-events-none opacity-50">
        {children}
      </div>
    </div>
  );
}

/**
 * Page-level read-only overlay. Intercepts all button clicks, form submissions,
 * and input interactions when the school is in read-only mode.
 * Wraps the entire page content — view/read interactions still work.
 */
export function ReadOnlyOverlay({ children }: { children: ReactNode }) {
  const { isReadOnly } = useSchool();
  const location = useLocation();

  // Pages that remain fully functional even when read-only
  const EXEMPT_PATHS = ["/school/settings", "/school"];
  const isExemptPage = EXEMPT_PATHS.includes(location.pathname);

  const handleCapture = useCallback((e: React.MouseEvent) => {
    if (!isReadOnly || isExemptPage) return;

    const target = e.target as HTMLElement;
    const tag = target.tagName.toLowerCase();
    const role = target.getAttribute("role");
    const isInteractive =
      tag === "button" ||
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      role === "button" ||
      role === "menuitem" ||
      role === "option" ||
      role === "combobox" ||
      target.closest("button") ||
      target.closest("[role='dialog']") ||
      target.closest("[data-radix-collection-item]");

    // Allow navigation links and view-only buttons (Eye icon for viewing profiles)
    const closestLink = target.closest("a[href]");
    const closestViewBtn = target.closest("[data-action='view']");
    if (closestLink || closestViewBtn) return;

    if (isInteractive) {
      e.preventDefault();
      e.stopPropagation();
      toast.error(READ_ONLY_MSG);
    }
  }, [isReadOnly]);

  return (
    <div onClickCapture={handleCapture as any}>
      {children}
    </div>
  );
}

/**
 * Hook to check if the school is in read-only mode.
 * Use this in components to conditionally disable buttons/forms.
 */
export function useReadOnly() {
  const { isReadOnly } = useSchool();
  
  const guardAction = (action: () => void) => {
    if (isReadOnly) {
      toast.error(READ_ONLY_MSG);
      return;
    }
    action();
  };

  return { isReadOnly, guardAction };
}
