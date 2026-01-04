import { httpClient } from '../http-client';
import type { BaseSalaryCreateRequest } from '../interface/request/BaseSalaryCreateRequest';
import type { BaseSalaryUpdateRequest } from '../interface/request/BaseSalaryUpdateRequest';
import type { BaseSalaryResponse } from '../interface/response/BaseSalaryResponse';

export class BaseSalaryService {
  private readonly BASE_URL: string = '/base-salaries';

  async createBaseSalary(baseSalaryData: BaseSalaryCreateRequest): Promise<BaseSalaryResponse> {
    return httpClient.post<BaseSalaryResponse>(this.BASE_URL, baseSalaryData);
  }

  async getBaseSalaryByEmployee(employeeId: string): Promise<BaseSalaryResponse> {
    const url = `${this.BASE_URL}/employees/${employeeId}`;
    return httpClient.get<BaseSalaryResponse>(url);
  }

  async patchBaseSalary(baseSalaryId: string, baseSalaryUpdateRequest: Partial<BaseSalaryUpdateRequest>): Promise<BaseSalaryResponse> {
    return httpClient.patch<BaseSalaryResponse>(
      `${this.BASE_URL}/${baseSalaryId}`,
      baseSalaryUpdateRequest
    );
  }
}
