import type { EmployeeResponse } from "./EmployeeResponse";

export interface PaymentEmployeeResponse {
  employee: EmployeeResponse;
  payment: PaymentDetailsResponse;
}

export interface PaymentDetailsResponse {
  period: number;
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
  deductions: PaymentDeductionResponse[];
  totalDeductions: number;
  netAmount: number;
}

export interface PaymentDeductionResponse {
  type: string;
  qty: number;
  totalDeduction: number;
}

export interface PaymentTotals {
  totalSeniorityBonuses: number;
  totalOtherBonuses: number;
  totalBonuses: number;
  totalEarnings: number;
  totalAfpDeductions: number;
  totalDeductions: number;
  netAmount: number;
  deductions: Record<string, number>;
}

export interface PaymentSummaryResponse {
  payments: PaymentEmployeeResponse[];
  totals: PaymentTotals;
}

export interface PaymentByBranchResponse {
  branchId: string;
  branchName: string;
  employeeCount: number;
  payments: PaymentEmployeeResponse[];
  totals: PaymentTotals;
}