import { Suspense, type ReactNode } from 'react';
import { AdminHeader } from '@/components/admin-header';
import { AdminSidebar } from '@/components/admin-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div data-admin-shell>
      <TooltipProvider>
        <SidebarProvider>
          <Suspense fallback={<div className="hidden w-64 shrink-0 border-r md:block" />}>
            <AdminSidebar />
          </Suspense>
          <SidebarInset>
            <Suspense fallback={<div className="h-16 shrink-0 border-b" />}>
              <AdminHeader />
            </Suspense>
            <div className="flex flex-1 flex-col gap-6 p-4">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}
