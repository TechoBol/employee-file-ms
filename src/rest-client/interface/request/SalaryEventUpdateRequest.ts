export interface SalaryEventUpdateRequest {
  type: string;
  description?: string;
  amount: number;
  frequency: string;
  startDate: string;
  endDate?: string;
}