export interface EmployeeCreateRequest {
  firstName: string;
  lastName: string;
  ci: string;
  email: string;
  phone: string;
  address: string;
  birthDate: Date;
  hireDate: Date;
  type: string;
  positionId: string;
  branchId: string;
}