export interface BaseSalaryResponse {
  id: string;
  employeeId: string;
  amount: number;
  startDate: string;
  endDate?: string;
}