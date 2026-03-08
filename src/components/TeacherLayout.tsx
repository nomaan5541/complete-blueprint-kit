import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { ThemeToggle } from "@/components/ThemeToggle";

export function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <div className="animated-bg" />
        <TeacherSidebar />
        <div className="flex-1 flex flex-col">
          <SubscriptionBanner />
          <header className="h-14 flex items-center justify-between border-b border-border/50 glass-subtle px-4 sticky top-0 z-30">
            <SidebarTrigger className="mr-4" />
            <ThemeToggle />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
