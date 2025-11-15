import { httpClient } from '../http-client';
import type { SalaryEventCreateRequest } from '../interface/request/SalaryEventCreateRequest';
import type { SalaryEventUpdateRequest } from '../interface/request/SalaryEventUpdateRequest';
import type { SalaryEventResponse } from '../interface/response/SalaryEventResponse';

export class SalaryEventService {
  private readonly BASE_URL: string = '/salary-events';

  async createSalaryEvent(salaryCreateRequest: SalaryEventCreateRequest): Promise<SalaryEventResponse> {
    return httpClient.post<SalaryEventResponse>(this.BASE_URL, salaryCreateRequest);
  }

  async getSalaryEventsByEmployeeId(employeeId: string, category?: string, startDate?: string, endDate?: string): Promise<SalaryEventResponse[]> {
    const params = new URLSearchParams({
      ...(category && { category }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });
    const url = `${this.BASE_URL}/employees/${employeeId}${params.toString() ? `?${params}` : ''}`;
    return httpClient.get<SalaryEventResponse[]>(url);
  }

  async getSalaryEvents(startDate?: string, endDate?: string): Promise<SalaryEventResponse[]> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });
    const url = `${this.BASE_URL}${params.toString() ? `?${params}` : ''}`;
    return httpClient.get<SalaryEventResponse[]>(url);
  }

  async patchSalaryEvent(id: string, salaryEventUpdateRequest: Partial<SalaryEventUpdateRequest>): Promise<SalaryEventResponse> {
    return httpClient.patch<SalaryEventResponse>(`${this.BASE_URL}/${id}`, salaryEventUpdateRequest);
  }

  async deleteSalaryEvent(id: string): Promise<void> {
    return httpClient.delete<void>(`${this.BASE_URL}/${id}`);
  }
}
