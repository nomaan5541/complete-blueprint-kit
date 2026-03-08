import {
  LayoutDashboard, GraduationCap, Users, BookOpen, Calendar,
  Layers, Settings, LogOut, School, IndianRupee, ClipboardCheck,
  FileText, ArrowUpRight, Clock, Bell, BarChart3, FolderOpen,
  CalendarDays, Shield, Lock, Crown, Video,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSchool } from "@/hooks/useSchool";
import { useSubscriptionPlan } from "@/hooks/useSubscriptionPlan";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

const navItems = [
  { title: "Dashboard", url: "/school", icon: LayoutDashboard },
  { title: "Academic Years", url: "/school/academic-years", icon: Calendar },
  { title: "Classes & Sections", url: "/school/classes", icon: Layers },
  { title: "Subjects", url: "/school/subjects", icon: BookOpen },
  { title: "Subject Mapping", url: "/school/subject-mapping", icon: BookOpen },
  { title: "Students", url: "/school/students", icon: GraduationCap },
  { title: "Bulk Import", url: "/school/students/import", icon: GraduationCap },
  { title: "Transfer/Leaving", url: "/school/students/transfer", icon: GraduationCap },
  { title: "Promotion", url: "/school/promotion", icon: ArrowUpRight },
  { title: "Teachers", url: "/school/teachers", icon: Users },
  { title: "Attendance", url: "/school/attendance", icon: ClipboardCheck },
  { title: "Exams & Results", url: "/school/exams", icon: FileText },
  { title: "Report Card", url: "/school/report-card", icon: FileText },
  { title: "Fee Management", url: "/school/fees", icon: IndianRupee },
  { title: "Fee Dues", url: "/school/fees/dues", icon: IndianRupee },
  { title: "Timetable", url: "/school/timetable", icon: Clock },
  { title: "Notifications", url: "/school/notifications", icon: Bell },
  { title: "Reports", url: "/school/reports", icon: BarChart3 },
  { title: "Documents", url: "/school/documents", icon: FolderOpen },
  { title: "Calendar", url: "/school/calendar", icon: CalendarDays },
  { title: "Audit Logs", url: "/school/audit-logs", icon: Shield },
  { title: "Settings", url: "/school/settings", icon: Settings },
];

// Pages accessible even when subscription expired
const UNLOCKED_URLS = ["/school", "/school/settings"];

export function SchoolAdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { schoolId, schoolName, isReadOnly } = useSchool();
  const { planTier, planName, isFeatureAvailable, getRequiredPlan, loading: planLoading } = useSubscriptionPlan(schoolId);

  const handleLockedClick = (e: React.MouseEvent, title: string, reason: string) => {
    e.preventDefault();
    e.stopPropagation();
    toast.error(reason);
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border/50 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sidebar-primary to-blue-400 text-sidebar-primary-foreground shadow-soft">
            <School className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-primary-foreground truncate max-w-[140px] tracking-tight">
                {schoolName || "My School"}
              </span>
              {planName && (
                <Badge variant="outline" className="text-[10px] w-fit mt-0.5 px-1.5 py-0 border-sidebar-primary/30 text-sidebar-primary/80">
                  <Crown className="h-2.5 w-2.5 mr-1" />
                  {planName}
                </Badge>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold">Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isUnlocked = UNLOCKED_URLS.includes(item.url);
                const isExpiredLocked = isReadOnly && !isUnlocked;
                const isPlanLocked = !planLoading && planTier !== "none" && !isFeatureAvailable(item.url);

                if (isExpiredLocked) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={(e) => handleLockedClick(e, item.title, `"${item.title}" is locked. Please renew your subscription from Settings to unlock.`)}
                        className="rounded-xl transition-all duration-200 opacity-50 cursor-not-allowed hover:bg-transparent"
                      >
                        <div className="relative">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <Lock className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-destructive" />
                        </div>
                        {!collapsed && (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            {item.title}
                            <Lock className="h-3 w-3 text-destructive/70" />
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                if (isPlanLocked) {
                  const requiredPlan = getRequiredPlan(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            onClick={(e) => handleLockedClick(e, item.title, `"${item.title}" requires the ${requiredPlan} plan or higher. Upgrade from Settings.`)}
                            className="rounded-xl transition-all duration-200 opacity-40 cursor-not-allowed hover:bg-transparent"
                          >
                            <div className="relative">
                              <item.icon className="h-4 w-4 text-muted-foreground" />
                              <Crown className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-amber-500" />
                            </div>
                            {!collapsed && (
                              <span className="flex items-center gap-2 text-muted-foreground">
                                {item.title}
                                <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/40 text-amber-600">
                                  {requiredPlan}
                                </Badge>
                              </span>
                            )}
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>Upgrade to {requiredPlan} to unlock</p>
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                      <NavLink
                        to={item.url}
                        end
                        className="rounded-xl transition-all duration-200 hover:bg-sidebar-accent/60 group"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-soft"
                      >
                        <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 p-3">
        {!collapsed && user && (
          <p className="mb-2 truncate text-[11px] text-sidebar-foreground/40 px-1 font-medium">{user.email}</p>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground rounded-xl transition-all duration-200"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
