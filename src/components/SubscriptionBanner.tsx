import { AlertTriangle, Lock } from "lucide-react";
import { useSchool } from "@/hooks/useSchool";
import { format } from "date-fns";

export function SubscriptionBanner() {
  const { isReadOnly, subscriptionExpired, subscriptionEndDate, schoolStatus } = useSchool();

  if (!isReadOnly) return null;

  let message = "";
  let icon = <AlertTriangle className="h-4 w-4 shrink-0" />;

  if (subscriptionExpired) {
    message = `Your subscription expired${subscriptionEndDate ? ` on ${format(new Date(subscriptionEndDate), "dd MMM yyyy")}` : ""}. The school is now in read-only mode. Please contact the platform administrator to renew your subscription.`;
    icon = <Lock className="h-4 w-4 shrink-0" />;
  } else if (schoolStatus === "suspended") {
    message = "Your school has been suspended by the platform administrator. All editing is disabled.";
  } else if (schoolStatus === "inactive") {
    message = "Your school is currently inactive. Please contact the platform administrator.";
  }

  return (
    <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-2.5 flex items-center gap-3 text-sm">
      {icon}
      <span className="font-medium">{message}</span>
    </div>
  );
}
