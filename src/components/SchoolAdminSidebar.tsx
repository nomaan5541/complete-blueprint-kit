import {
  LayoutDashboard, GraduationCap, Users, BookOpen, Calendar,
  Layers, Settings, LogOut, School, IndianRupee, ClipboardCheck,
  FileText, ArrowUpRight, Clock, Bell, BarChart3, FolderOpen,
  CalendarDays, Shield, Lock,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSchool } from "@/hooks/useSchool";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
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
  const { schoolName, isReadOnly } = useSchool();

  const handleLockedClick = (e: React.MouseEvent, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    toast.error(`"${title}" is locked. Please renew your subscription from Settings to unlock.`);
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
              <span className="text-[11px] text-sidebar-foreground/50 font-medium">School Admin</span>
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
                const isLocked = isReadOnly && !isUnlocked;

                if (isLocked) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={(e) => handleLockedClick(e, item.title)}
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
