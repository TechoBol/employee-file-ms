export type User = {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  hireDate: string;
  email: string;
  phone: string;
  companyId: string;
  status?: 'active' | 'inactive' | 'suspended';
};
