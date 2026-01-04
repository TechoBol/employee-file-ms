import { CompanyService } from '@/rest-client/services/CompanyService';

export const useSidebarService = () => {
  const companyService = new CompanyService();
  const getCompanies = companyService.getCompanies();
  return { getCompanies };
};
