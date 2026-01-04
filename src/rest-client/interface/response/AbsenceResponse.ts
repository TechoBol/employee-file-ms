export interface AbsenceResponse {
  id: string;
  employeeId: string;
  type: string;
  duration: string;
  date: string;
  endDate: string;
  reason?: string;
  description?: string;
  salaryEventId: string;
  deductionAmount: number;
  createdAt: string;
  updatedAt: string;
  processed: boolean;
}