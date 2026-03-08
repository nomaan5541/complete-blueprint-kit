import { validatePassword } from "@/lib/passwordValidation";
import { Check, X } from "lucide-react";

export function PasswordStrengthIndicator({ password }: { password: string }) {
  const checks = validatePassword(password);
  if (!password) return null;

  return (
    <div className="space-y-1 mt-2">
      <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-1.5 text-xs">
          {c.met ? (
            <Check className="h-3 w-3 text-success shrink-0" />
          ) : (
            <X className="h-3 w-3 text-destructive shrink-0" />
          )}
          <span className={c.met ? "text-success" : "text-muted-foreground"}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}
