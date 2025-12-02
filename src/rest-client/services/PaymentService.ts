import { httpClient } from "../http-client";
import type { Page } from "../interface/Page";
import type { PaymentDetailsResponse, PaymentEmployeeResponse, PaymentSummaryResponse } from "../interface/response/PaymentResponse";

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

  async getAllPaymentsByPeriod(period: number): Promise<PaymentSummaryResponse> {
    return httpClient.get<PaymentSummaryResponse>(`${this.BASE_URL}/periods/${period}/all`);
  }
}