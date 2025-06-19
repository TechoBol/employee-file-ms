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
import { NavMain } from './NavMain';
import { NavProjects } from './NavProjects';
import { NavUser } from './NavUser';
import { TeamSwitcher } from '../main/components/TeamSwitcher';
import {
  sidebarGroupItems,
  sidebarItems,
} from '@/app/shared/data/sidebar-items';
import { companies } from '@/app/shared/data/companies';
import { defaultUser } from '@/app/shared/data/users';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      className="top-[var(--header-height)] !h-[calc(100svh-var(--header-height))]"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <TeamSwitcher teams={companies} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarGroupItems} />
        <NavProjects projects={sidebarItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={defaultUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
