export interface EmployeeResponse {
  id: string;
  firstName: string;
  lastName: string;
  ci: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  hireDate: string;
  status: string;
  emergencyContact: EmergencyContactResponse;
  type: string;
  departmentId: string;
  departmentName: string;
  positionId: string;
  positionName: string;
  branchId: string;
  branchName: string;
  disassociated: boolean;
  disassociatedAt: string | null;
}

export interface EmergencyContactResponse {
  fullName: string;
  relation: string;
  phone: string;
  address: string;
}

export interface EmployeeProjectionResponse {
  id: string;
  firstName: string;
  lastName: string;
  ci: string;
  email: string;
  positionId: string;
  branchId: string;
}
