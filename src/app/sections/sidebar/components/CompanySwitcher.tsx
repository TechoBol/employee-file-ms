import { ChevronsUpDown, Plus } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCompanySwitcher } from '../hooks/useCompanySwitcher';
import { SidebarHeaderTexts } from '@/constants/localize';
import { ReusableDialog } from '@/app/shared/components/ReusableDialog';
import { useState } from 'react';
import { CompanyForm } from './CompanyForm';
import { CompanyService } from '@/rest-client/services/CompanyService';
import type { CompanyResponse } from '@/rest-client/interface/response/CompanyResponse';
import type { CompanyCreateRequest } from '@/rest-client/interface/request/CompanyCreateRequest';

interface CompanyProps {
  companies: CompanyResponse[];
}

export function CompanySwitcher({ companies }: CompanyProps) {
  const { isMobile, activeTeam, setActiveTeam, setCompanyId } =
    useCompanySwitcher(companies);
  const [openForm, setOpenForm] = useState(false);

  const handleCompanyChange = async (
    team: CompanyResponse | CompanyCreateRequest,
    isCreating = false
  ) => {
    try {
      let finalCompany: CompanyResponse;

      if (isCreating) {
        const companyService = new CompanyService();
        finalCompany = await companyService.createCompany(team);
      } else {
        finalCompany = team as CompanyResponse;
      }

      setActiveTeam(finalCompany);
      setCompanyId(finalCompany.id);

      if (openForm) {
        setOpenForm(false);
      }
    } catch (error) {
      console.error('Error handling company:', error);
    }
  };

  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return words[0][0] + words[1][0];
    }
    return name.slice(0, 2).toLocaleUpperCase();
  };

  if (!activeTeam) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg font-medium uppercase">
                <span>{getInitials(activeTeam.name)}</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam.name}</span>
                <span className="truncate text-xs">
                  {activeTeam.type}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {SidebarHeaderTexts.companies.title}
            </DropdownMenuLabel>
            {companies.map((team) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => handleCompanyChange(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <span>{getInitials(team.name)}</span>
                </div>
                {team.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => {
                setOpenForm(true);
              }}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                {SidebarHeaderTexts.companies.add}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ReusableDialog
          open={openForm}
          onOpenChange={setOpenForm}
          title={SidebarHeaderTexts.companies.add}
          description={SidebarHeaderTexts.companies.addDescription}
        >
          <CompanyForm onSave={handleCompanyChange} />
        </ReusableDialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
