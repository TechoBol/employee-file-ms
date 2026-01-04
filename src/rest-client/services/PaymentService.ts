import { httpClient } from "../http-client";
import type { Page } from "../interface/Page";
import type { EmployeeSearchParams } from "../interface/request/EmployeeSearchParams";
import type { PaymentByBranchResponse, PaymentDetailsResponse, PaymentEmployeeResponse, PaymentSummaryResponse } from "../interface/response/PaymentResponse";

export class PaymentService {
  private readonly BASE_URL: string = '/payments';

  async getPaymentsByEmployeeAndPeriod(employeeId: string, period: number): Promise<PaymentDetailsResponse[]> {
    return httpClient.get<PaymentDetailsResponse[]>(
      `${this.BASE_URL}/employees/${employeeId}/periods/${period}`
    );
  }

  async getPaymentsByPeriod(period: number, page: number = 0, size: number = 10): Promise<Page<PaymentEmployeeResponse>> {
    return httpClient.get<Page<PaymentEmployeeResponse>>(
      `${this.BASE_URL}/periods/${period}?page=${page}&size=${size}`
    );
  }

  async reprocessPayment(period: number): Promise<void> {
    return httpClient.post<void>(`${this.BASE_URL}/periods/${period}/reprocess`);
  }

  async getAllPaymentsByPeriod(period: number, searchParams?: EmployeeSearchParams): Promise<PaymentSummaryResponse> {
    const params = new URLSearchParams();

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

    return httpClient.get<PaymentSummaryResponse>(`${this.BASE_URL}/periods/${period}/all?${params.toString()}`);
  }

  async getAllPaymentsByBranch(): Promise<PaymentByBranchResponse[]> {
    return httpClient.get<PaymentByBranchResponse[]>(`${this.BASE_URL}/group-by-branch`);
  }
}