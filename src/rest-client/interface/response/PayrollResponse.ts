import type { EmployeeResponse } from "./EmployeeResponse";

export interface PayrollResponse {
  baseSalary: number;
  workedDays: number;
  workingDaysPerMonth: number;
  basicEarnings: number;
  seniorityYears: number;
  seniorityIncreasePercentage: number;
  seniorityBonus: number;
  otherBonuses: number;
  totalBonuses: number;
  totalEarnings: number;
  deductionAfpPercentage: number;
  deductionAfp: number;
  deductions: PayrollDeductionResponse[];
  totalDeductions: number;
  netAmount: number;
}

export interface PayrollDeductionResponse {
  type: string;
  qty: number;
  totalDeduction: number;
}

export interface PayrollEmployeeResponse {
  employee: EmployeeResponse;
  payroll: PayrollResponse;
}

export interface PayrollTotals {
  totalBonuses: number;
  totalEarnings: number;
  totalDeductions: number;
  netAmount: number;
}

export interface PayrollSummaryResponse {
  payrolls: PayrollEmployeeResponse[];
  totals: PayrollTotals;
}