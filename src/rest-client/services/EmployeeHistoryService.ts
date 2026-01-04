import { httpClient } from '../http-client';
import type { Page } from '../interface/Page';
import type { EmployeeHistoryResponse } from '../interface/response/EmployeeHistoryResponse';

export class EmployeeHistoryService {
  private readonly BASE_URL: string = '/employees';

  async getEmployeeHistory(
    employeeId: string,
    page: number,
    size: number
  ): Promise<Page<EmployeeHistoryResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    const url = `${this.BASE_URL}/${employeeId}/history?${params.toString()}`;
    return httpClient.get<Page<EmployeeHistoryResponse>>(url);
  }
}