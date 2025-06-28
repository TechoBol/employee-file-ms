import { SidebarItemsTexts } from '@/constants/localize';
import { Building, DollarSign, Settings, UsersRound } from 'lucide-react';
import type {
  SidebarGroupItem,
  SidebarItem,
} from '@/app/shared/interfaces/Sidebar';

export const sidebarItems: SidebarItem[] = [
  {
    title: SidebarItemsTexts.settings.title,
    url: '/config',
    icon: Settings,
  },
];

export const sidebarGroupItems: SidebarGroupItem[] = [
  {
    title: SidebarItemsTexts.employees.title,
    icon: UsersRound,
    url: '/employees',
    isActive: true,
    items: [
      { title: SidebarItemsTexts.employees.list, url: '/employees' },
      { title: SidebarItemsTexts.employees.memos, url: '/employees/memos' },
      {
        title: SidebarItemsTexts.employees.permissions,
        url: '/employees/permissions',
      },
    ],
  },
  {
    title: SidebarItemsTexts.salary.title,
    icon: DollarSign,
    url: '/salary',
    items: [],
  },
  {
    title: SidebarItemsTexts.departments.title,
    icon: Building,
    url: '/departments',
    items: [],
  },
];
