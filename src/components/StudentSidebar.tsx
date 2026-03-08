import {
  LayoutDashboard, User, ClipboardCheck, FileText, IndianRupee, Bell, Calendar, BookOpen, LogOut, GraduationCap, Monitor, IdCard, FolderOpen, Video,
} from "lucide-react";
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
  { title: "Dashboard", url: "/student", icon: LayoutDashboard },
  { title: "My Profile", url: "/student/profile", icon: User },
  { title: "Attendance", url: "/student/attendance", icon: ClipboardCheck },
  { title: "Exam Results", url: "/student/results", icon: FileText },
  { title: "Online Exams", url: "/student/exam", icon: Monitor },
  { title: "Fees", url: "/student/fees", icon: IndianRupee },
  { title: "Timetable", url: "/student/timetable", icon: Calendar },
  { title: "Homework", url: "/student/homework", icon: BookOpen },
  { title: "Notifications", url: "/student/notifications", icon: Bell },
  { title: "Study Materials", url: "/student/materials", icon: FolderOpen },
  { title: "ID Card", url: "/student/id-card", icon: IdCard },
  { title: "Meetings", url: "/student/meetings", icon: Video, comingSoon: true },
];

export function StudentSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border/50 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sidebar-primary to-blue-400 text-sidebar-primary-foreground shadow-soft">
            <GraduationCap className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-primary-foreground tracking-tight">EDUPRIMEX</span>
              <span className="text-[11px] text-sidebar-foreground/50 font-medium">Student Portal</span>
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
                      {!collapsed && <span>{item.title}</span>}
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
