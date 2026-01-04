export interface SalaryEventCreateRequest {
  employeeId: string;
  type: string;
  description?: string;
  amount: number;
  frequency: string;
  startDate: string;
  endDate?: string;
}