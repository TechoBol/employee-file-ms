import type * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavMain } from './components/NavMain';
import { NavUser } from './components/NavUser';
import { CompanySwitcher } from './components/CompanySwitcher';
import {
  sidebarGroupItems,
  sidebarItems,
} from '@/app/shared/data/sidebar-items';
import { NavSecondary } from './components/NavSecondary';
import { useSidebar } from './hooks/useSidebar';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { companies } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      className="top-[var(--header-height)] !h-[calc(100svh-var(--header-height))]"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <CompanySwitcher companies={companies} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        <NavMain items={sidebarGroupItems} />
        <NavSecondary items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}