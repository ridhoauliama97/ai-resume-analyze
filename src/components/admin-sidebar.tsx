'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ExternalLinkIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
} from 'lucide-react';
import { SiteBrand } from '@/components/site-brand';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

const NAV_ITEMS = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboardIcon,
    match: (pathname: string) => pathname === '/admin',
  },
  {
    title: 'Riwayat Analisa',
    url: '/admin/analyze-history',
    icon: HistoryIcon,
    match: (pathname: string) =>
      pathname === '/admin/analyze-history' || pathname.startsWith('/admin/analyses/'),
  },
  {
    title: 'Pengaturan',
    url: '/admin/settings',
    icon: SettingsIcon,
    match: (pathname: string) => pathname === '/admin/settings',
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/admin" />} tooltip="Dashboard">
              <SiteBrand />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={item.match(pathname)}
                  tooltip={item.title}
                  render={<Link href={item.url} />}
                >
                  <item.icon aria-hidden="true" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Lihat website" render={<Link href="/" />}>
              <ExternalLinkIcon aria-hidden="true" />
              <span>Lihat website</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action="/api/auth/admin/logout" method="post" className="w-full">
              <SidebarMenuButton type="submit" tooltip="Keluar" className="w-full">
                <LogOutIcon aria-hidden="true" />
                <span>Keluar</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
