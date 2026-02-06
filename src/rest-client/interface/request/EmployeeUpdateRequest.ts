export interface EmployeeUpdateRequest {
  firstName: string;
  lastName: string;
  ci: string;
  email: string;
  phone: string;
  address: string;
  birthDate: Date;
  hireDate: Date;
  status: string;
  emergencyContact: EmergencyContactRequest;
  type: string;
  positionId: string;
  branchId: string;
  disassociationDate: Date;
  disassociationReason: string;
  contractCompany?: string;
  contractPosition?: string;
}

export interface EmergencyContactRequest {
  fullName: string;
  relation: string;
  phone: string;
  address: string;
}

export interface EmployeeChangeCompanyRequest {
  newCompanyId: string;
  newCompanyName: string;
  reason?: string;
}
