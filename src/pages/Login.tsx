import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, Loader2, School, UserCheck, Crown, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const roleConfig: Record<string, { icon: any; title: string; subtitle: string; gradient: string }> = {
  school_admin: {
    icon: School,
    title: "School Admin Login",
    subtitle: "Manage your school's operations",
    gradient: "from-primary to-secondary",
  },
  teacher: {
    icon: UserCheck,
    title: "Teacher Login",
    subtitle: "Access your teaching portal",
    gradient: "from-secondary to-accent",
  },
  student: {
    icon: GraduationCap,
    title: "Student Login",
    subtitle: "View your academic portal",
    gradient: "from-accent to-primary",
  },
  super_admin: {
    icon: Crown,
    title: "Admin Access",
    subtitle: "Super Administrator Panel",
    gradient: "from-yellow-500 to-amber-600",
  },
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "school_admin";
  const config = roleConfig[role] || roleConfig.school_admin;
  const RoleIcon = config.icon;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Logged in successfully");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else {
      setResetSent(true);
      toast.success("Password reset link sent to your email");
    }
    setLoading(false);
  };

  if (forgotMode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="animated-bg" />
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <Card className="w-full max-w-md glass-strong border-0 animate-scale-in">
          <CardHeader className="text-center space-y-3">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${config.gradient} text-white shadow-lg`}>
              <RoleIcon className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              {resetSent ? "Check your email for the reset link" : "Enter your email to receive a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetSent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">We've sent a password reset link to <strong>{email}</strong>.</p>
                <Button variant="outline" className="w-full" onClick={() => { setForgotMode(false); setResetSent(false); }}>
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input id="reset-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
                <Button variant="link" className="w-full" onClick={() => setForgotMode(false)}>
                  Back to Login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="animated-bg" />
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </div>
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <Card className="w-full max-w-md glass-strong border-0 animate-scale-in">
        <CardHeader className="text-center space-y-3">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${config.gradient} text-white shadow-lg animate-float`}>
            <RoleIcon className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{config.title}</CardTitle>
          <CardDescription className="text-muted-foreground">{config.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-primary hover:underline transition-colors">Forgot password?</button>
              </div>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className={`w-full h-11 text-base bg-gradient-to-r ${config.gradient} hover:opacity-90`} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
