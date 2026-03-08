import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SchoolAdminSidebar } from "@/components/SchoolAdminSidebar";
import { AcademicYearProvider } from "@/hooks/useAcademicYear";
import { AcademicYearSwitcher } from "@/components/AcademicYearSwitcher";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";

export function SchoolAdminLayout({ children }: { children: ReactNode }) {
  return (
    <AcademicYearProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full relative">
          <div className="animated-bg" />
          <SchoolAdminSidebar />
          <div className="flex-1 flex flex-col">
            <SubscriptionBanner />
            <header className="h-14 flex items-center border-b border-border/50 glass-subtle px-4 gap-4 sticky top-0 z-30">
              <SidebarTrigger />
              <AcademicYearSwitcher />
            </header>
            <main className="flex-1 p-6 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AcademicYearProvider>
  );
}
