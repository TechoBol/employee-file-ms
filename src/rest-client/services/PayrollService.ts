import { httpClient } from "../http-client";
import type { Page } from "../interface/Page";
import type { PayrollEmployeeResponse, PayrollResponse, PayrollSummaryResponse } from "../interface/response/PayrollResponse";

export class PayrollService {
  private readonly BASE_URL: string = '/payrolls';

  async getPayrollsByEmployeeId(employeeId: string): Promise<PayrollResponse> {
    return httpClient.get<PayrollResponse>(`${this.BASE_URL}/calculate/employees/${employeeId}`);
  }

  async getPayrolls(page: number = 0, size: number = 10): Promise<Page<PayrollEmployeeResponse>> {
    return httpClient.get<Page<PayrollEmployeeResponse>>(
      `${this.BASE_URL}/calculate?page=${page}&size=${size}`
    );
  }

  async getAllPayrolls(): Promise<PayrollSummaryResponse> {
    return httpClient.get<PayrollSummaryResponse>(`${this.BASE_URL}/calculate/all`);
  }
}