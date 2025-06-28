import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { SiteHeader } from '@/app/sections/header/SiteHeader';
import { AppSidebar } from '../sections/sidebar/AppSidebar';
import { Outlet } from 'react-router';

export default function RootLayout() {
  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset
            className={cn(
              'w-full',
              'peer-data-[state=collapsed]:max-w-[calc(100vw-var(--sidebar-width-icon)-1rem)]',
              'peer-data-[state=expanded]:max-w-[calc(100vw-var(--sidebar-width)-1rem)]',
              'transition-[width] duration-200 ease-linear',
              'p-8'
            )}
          >
            <Outlet />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
