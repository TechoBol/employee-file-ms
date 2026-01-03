import { httpClient } from "../http-client";
import type { EmployeeSearchParams } from "../interface/request/EmployeeSearchParams";
import type { PayrollByBranchResponse, PayrollResponse, PayrollSummaryPageResponse, PayrollSummaryResponse } from "../interface/response/PayrollResponse";

export class PayrollService {
  private readonly BASE_URL: string = '/payrolls';

  async getPayrollsByEmployeeId(employeeId: string, useActualDate?: boolean): Promise<PayrollResponse> {
    const params = new URLSearchParams();
    if (useActualDate !== undefined) {
      params.append('useActualDate', useActualDate.toString());
    }
    return httpClient.get<PayrollResponse>(`${this.BASE_URL}/calculate/employees/${employeeId}?${params.toString()}`);
  }

  async getPayrolls(page: number = 0, size: number = 10, searchParams?: EmployeeSearchParams): Promise<PayrollSummaryPageResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (searchParams?.search) {
      params.append('search', searchParams.search);
    }
    if (searchParams?.ci) {
      params.append('ci', searchParams.ci);
    }
    if (searchParams?.email) {
      params.append('email', searchParams.email);
    }
    if (searchParams?.phone) {
      params.append('phone', searchParams.phone);
    }
    if (searchParams?.type) {
      params.append('type', searchParams.type);
    }
    if (searchParams?.status) {
      params.append('status', searchParams.status);
    }
    if (searchParams?.isDisassociated !== undefined) {
      params.append('isDisassociated', searchParams.isDisassociated.toString());
    }
    if (searchParams?.branchId) {
      params.append('branchId', searchParams.branchId);
    }
    if (searchParams?.positionId) {
      params.append('positionId', searchParams.positionId);
    }

    const url = `${this.BASE_URL}/calculate?${params.toString()}`;
    return httpClient.get<PayrollSummaryPageResponse>(url);
  }

  async getAllPayrolls(): Promise<PayrollSummaryResponse> {
    return httpClient.get<PayrollSummaryResponse>(`${this.BASE_URL}/calculate/all`);
  }

  async getAllPayrollsByBranch(): Promise<PayrollByBranchResponse[]> {
    return httpClient.get<PayrollByBranchResponse[]>(`${this.BASE_URL}/calculate/all/group-by-branch`);
  }
}