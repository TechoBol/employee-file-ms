export interface EmployeeHistoryChange {
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: number[];
}

export interface EmployeeHistoryResponse {
  id: string;
  employee_id: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'DISASSOCIATE' | 'ASSOCIATE';
  changedBy: string;
  changedAt: string;
  changes: Record<string, EmployeeHistoryChange>;
  reason: string | null;
  snapshot: EmployeeSnapshotResponse;
  company_id: string;
}

export interface ExpandedHistoryRow {
  id: string;
  changeDate: string;
  changeType: string;
  changedBy: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  description: string | null;
}

export interface EmployeeSnapshotResponse {
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
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'INTERN';
  branchId: string;
  branchName: string | null;
  positionId: string;
  positionName: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  isDisassociated: boolean | null;
  disassociatedAt: string | null;
  disassociationDate: string | null;
  disassociationReason: string | null;
  emergencyContact: EmergencyContactSnapshot | null;
}

export interface EmergencyContactSnapshot {
  fullName: string;
  relation: string;
  phone: string;
  address: string;
}
