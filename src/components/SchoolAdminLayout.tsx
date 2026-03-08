import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SchoolAdminSidebar } from "@/components/SchoolAdminSidebar";
import { AcademicYearProvider } from "@/hooks/useAcademicYear";
import { AcademicYearSwitcher } from "@/components/AcademicYearSwitcher";

export function SchoolAdminLayout({ children }: { children: ReactNode }) {
  return (
    <AcademicYearProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <SchoolAdminSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center border-b bg-card px-4 gap-4">
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
