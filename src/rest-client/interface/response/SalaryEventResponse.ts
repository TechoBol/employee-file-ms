export interface SalaryEventResponse {
  id: string;
  employeeId: string;
  type: string;
  description?: string;
  amount: number;
  frequency: string;
  startDate: string;
  endDate?: string;
  processed: boolean;
}