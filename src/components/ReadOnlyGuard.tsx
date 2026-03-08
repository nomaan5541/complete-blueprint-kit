import { ReactNode } from "react";
import { useSchool } from "@/hooks/useSchool";
import { toast } from "sonner";

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
        toast.error(fallbackMessage || "School is in read-only mode. Subscription renewal is required to make changes.");
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
 * Hook to check if the school is in read-only mode.
 * Use this in components to conditionally disable buttons/forms.
 */
export function useReadOnly() {
  const { isReadOnly } = useSchool();
  
  const guardAction = (action: () => void) => {
    if (isReadOnly) {
      toast.error("School is in read-only mode. Subscription renewal is required to make changes.");
      return;
    }
    action();
  };

  return { isReadOnly, guardAction };
}
