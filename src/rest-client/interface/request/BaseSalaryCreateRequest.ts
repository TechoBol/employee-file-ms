export interface BaseSalaryCreateRequest {
  employeeId: string;
  amount: number;
  startDate: string;
  endDate?: string;
}