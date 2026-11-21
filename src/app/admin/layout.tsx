import type { ReactNode } from 'react';
import { AdminHeader } from '@/components/admin-header';
import { AdminSidebar } from '@/components/admin-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export const instant = false;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div data-admin-shell>
      <TooltipProvider>
        <SidebarProvider>
          <AdminSidebar />
          <SidebarInset>
            <AdminHeader />
            <div className="flex flex-1 flex-col gap-6 p-4">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}
