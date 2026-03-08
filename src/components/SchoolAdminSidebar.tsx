import {
  LayoutDashboard, GraduationCap, Users, BookOpen, Calendar,
  Layers, Settings, LogOut, School, IndianRupee, ClipboardCheck,
  FileText, ArrowUpRight, Clock, Bell, BarChart3,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSchool } from "@/hooks/useSchool";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/school", icon: LayoutDashboard },
  { title: "Academic Years", url: "/school/academic-years", icon: Calendar },
  { title: "Classes & Sections", url: "/school/classes", icon: Layers },
  { title: "Subjects", url: "/school/subjects", icon: BookOpen },
  { title: "Students", url: "/school/students", icon: GraduationCap },
  { title: "Promotion", url: "/school/promotion", icon: ArrowUpRight },
  { title: "Teachers", url: "/school/teachers", icon: Users },
  { title: "Attendance", url: "/school/attendance", icon: ClipboardCheck },
  { title: "Exams & Results", url: "/school/exams", icon: FileText },
  { title: "Fee Management", url: "/school/fees", icon: IndianRupee },
  { title: "Timetable", url: "/school/timetable", icon: Clock },
  { title: "Notifications", url: "/school/notifications", icon: Bell },
  { title: "Reports", url: "/school/reports", icon: BarChart3 },
  { title: "Settings", url: "/school/settings", icon: Settings },
];

export function SchoolAdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { schoolName } = useSchool();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <School className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-primary-foreground truncate max-w-[140px]">
                {schoolName || "My School"}
              </span>
              <span className="text-xs text-sidebar-foreground/60">School Admin</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && user && (
          <p className="mb-2 truncate text-xs text-sidebar-foreground/60 px-1">{user.email}</p>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
