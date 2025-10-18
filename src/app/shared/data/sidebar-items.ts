import { SidebarItemsTexts } from '@/constants/localize';
import {
  Briefcase,
  Building,
  Building2,
  DollarSign,
  Settings,
  UsersRound,
} from 'lucide-react';
import type {
  SidebarGroupItem,
  SidebarItem,
} from '@/app/shared/interfaces/sidebar';

export const sidebarItems: SidebarItem[] = [
  {
    title: SidebarItemsTexts.settings.title,
    url: '/config',
    icon: Settings,
    disabled: false,
  },
];

export const sidebarGroupItems: SidebarGroupItem[] = [
  {
    title: SidebarItemsTexts.employees.title,
    icon: UsersRound,
    url: '/employees',
    isActive: true,
    items: [
      {
        title: SidebarItemsTexts.employees.list,
        url: '/employees',
        disabled: false,
      },
      // {
      //   title: SidebarItemsTexts.employees.memos,
      //   url: '/employees/memos',
      //   disabled: true,
      // },
      // {
      //   title: SidebarItemsTexts.employees.permissions,
      //   url: '/employees/permissions',
      //   disabled: true,
      // },
    ],
    disabled: false,
  },
  {
    title: SidebarItemsTexts.salary.title,
    icon: DollarSign,
    url: '/salary',
    items: [],
    disabled: false,
  },
  {
    title: SidebarItemsTexts.branch.title,
    icon: Building2,
    url: '/branch',
    items: [],
    disabled: false,
  },
  {
    title: SidebarItemsTexts.departments.title,
    icon: Building,
    url: '/departments',
    items: [],
    disabled: false,
  },
  {
    title: SidebarItemsTexts.positions.title,
    icon: Briefcase,
    url: '/positions',
    items: [],
    disabled: false,
  },
];
