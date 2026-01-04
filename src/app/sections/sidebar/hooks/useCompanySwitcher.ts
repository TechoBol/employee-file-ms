import { useConfigStore } from '@/app/shared/stores/useConfigStore';
import { useSidebar } from '@/components/ui/sidebar';
import type { CompanyResponse } from '@/rest-client/interface/response/CompanyResponse';
import { useEffect, useState } from 'react';

export const useCompanySwitcher = (companies: CompanyResponse[]) => {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = useState(companies[0]);

  const { companyId, setCompanyId } = useConfigStore();

  useEffect(() => {
    if (companies.length > 0) {
      console.log(
        'Available companies:',
        companies,
        'Current companyId:',
        companyId
      );
      if (!companyId) {
        const firstCompanyId = companies[0].id;
        localStorage.setItem('company_id', firstCompanyId);
        setCompanyId(firstCompanyId);
        setActiveTeam(companies[0]);
        return;
      }
      const company =
        companies.find((team) => team.id === companyId) || companies[0];
      localStorage.setItem('company_id', company.id);
      setActiveTeam(company);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, companies]);

  return {
    activeTeam,
    setActiveTeam,
    isMobile,
    setCompanyId,
  };
};
