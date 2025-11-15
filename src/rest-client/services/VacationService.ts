import { httpClient } from "../http-client";
import type { VacationCreateRequest } from "../interface/request/VacationCreateRequest";
import type { VacationUpdateRequest } from "../interface/request/VacationUpdateRequest";
import type { VacationResponse } from "../interface/response/VacationResponse";

export class VacationService {
  private readonly BASE_URL: string = '/vacations';

  async createVacation(vacationCreateRequest: VacationCreateRequest): Promise<VacationResponse> {
    return httpClient.post<VacationResponse>(this.BASE_URL, vacationCreateRequest);
  }

  async getVacationsByEmployee(employeeId: string, startDate?: string, endDate?: string): Promise<VacationResponse[]> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });
    const url = `${this.BASE_URL}/employees/${employeeId}${params.toString() ? `?${params}` : ''}`;
    return httpClient.get<VacationResponse[]>(url);
  }

  async getVacations(startDate?: string, endDate?: string): Promise<VacationResponse[]> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });
    const url = `${this.BASE_URL}${params.toString() ? `?${params}` : ''}`;
    return httpClient.get<VacationResponse[]>(url);
  }

  async patchVacation(vacationId: string, vacationUpdateRequest: Partial<VacationUpdateRequest>): Promise<VacationResponse> {
    return httpClient.patch<VacationResponse>(
      `${this.BASE_URL}/${vacationId}`,
      vacationUpdateRequest
    );
  }

  async deleteVacation(vacationId: string): Promise<void> {
    return httpClient.delete<void>(`${this.BASE_URL}/${vacationId}`);
  }
}
