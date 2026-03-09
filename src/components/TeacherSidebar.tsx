import {
  LayoutDashboard, User, ClipboardCheck, FileText, Clock, GraduationCap, LogOut, School, BookOpen, PenLine, Bell, BarChart3, Monitor, Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/teacher", icon: LayoutDashboard },
  { title: "My Profile", url: "/teacher/profile", icon: User },
  { title: "Attendance", url: "/teacher/attendance", icon: ClipboardCheck },
  { title: "My Exams", url: "/teacher/exams", icon: FileText },
  { title: "Enter Marks", url: "/teacher/marks", icon: PenLine },
  { title: "Exam Monitor", url: "/teacher/exam-monitor", icon: Monitor },
  { title: "Homework", url: "/teacher/homework", icon: BookOpen },
  { title: "My Students", url: "/teacher/students", icon: GraduationCap },
  { title: "Timetable", url: "/teacher/timetable", icon: Clock },
  { title: "Notifications", url: "/teacher/notifications", icon: Bell },
  { title: "Analytics", url: "/teacher/analytics", icon: BarChart3 },
  { title: "Meetings", url: "/teacher/meetings", icon: Video },
];

export function TeacherSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border/50 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sidebar-primary to-blue-400 text-sidebar-primary-foreground shadow-soft">
            <School className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-primary-foreground tracking-tight">EDUPRIMEX</span>
              <span className="text-[11px] text-sidebar-foreground/50 font-medium">Teacher Portal</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink
                      to={item.url}
                      end
                      className="rounded-xl transition-all duration-200 hover:bg-sidebar-accent/60 group"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-soft"
                    >
                      <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                      {!collapsed && (
                        <span className="flex items-center gap-2">
                          {item.title}
                          {(item as any).comingSoon && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 leading-tight">Soon</Badge>}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
