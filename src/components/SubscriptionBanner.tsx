import { AlertTriangle, Lock } from "lucide-react";
import { useSchool } from "@/hooks/useSchool";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";

export function SubscriptionBanner() {
  const { isReadOnly, subscriptionExpired, subscriptionEndDate, schoolStatus } = useSchool();
  const { role } = useAuth();

  if (!isReadOnly) return null;

  // Teachers and students should contact school admin, not platform admin
  const isSchoolUser = role === "teacher" || role === "student";
  const contactText = isSchoolUser 
    ? "Please contact your school administrator." 
    : "Please contact the platform administrator to renew your subscription.";

  let message = "";
  let icon = <AlertTriangle className="h-4 w-4 shrink-0" />;

  if (subscriptionExpired) {
    message = `Your school's subscription has expired${subscriptionEndDate ? ` on ${format(new Date(subscriptionEndDate), "dd MMM yyyy")}` : ""}. The school is now in read-only mode. ${contactText}`;
    icon = <Lock className="h-4 w-4 shrink-0" />;
  } else if (schoolStatus === "suspended") {
    message = `Your school has been suspended. All editing is disabled. ${contactText}`;
  } else if (schoolStatus === "inactive") {
    message = `Your school is currently inactive. ${contactText}`;
  }

  return (
    <div className="sticky top-0 z-40 bg-destructive/10 border-b border-destructive/30 text-destructive px-4 py-2.5 flex items-center gap-3 text-sm">
      {icon}
      <span className="font-medium">{message}</span>
    </div>
  );
}
