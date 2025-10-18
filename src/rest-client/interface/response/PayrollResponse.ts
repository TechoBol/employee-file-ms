import type { EmployeeProjectionResponse } from "./EmployeeResponse";

export interface PayrollResponse {
  baseSalary: number;
  workedDays: number;
  basicEarnings: number;
  seniorityYears: number;
  seniorityIncreasePercentage: number;
  seniorityBonus: number;
  deductionAfpPercentage: number;
  deductionAfp: number;
  deductions: PayrollDeductionResponse[];
  totalDeductions: number;
  totalAmount: number;
}

export interface PayrollDeductionResponse {
  type: string;
  qty: number;
  totalDeduction: number;
}

export interface PayrollEmployeeResponse {
  employee: EmployeeProjectionResponse;
  payroll: PayrollResponse;
}
