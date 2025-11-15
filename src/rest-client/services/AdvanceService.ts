import { httpClient } from "../http-client";
import type { AdvanceCreateRequest } from "../interface/request/AdvanceCreateRequest";
import type { AdvanceUpdateRequest } from "../interface/request/AdvanceUpdateRequest";
import type { AdvanceResponse } from "../interface/response/AdvanceResponse";

export class AdvanceService {
  private readonly BASE_URL: string = '/advances';

  async createAdvance(advanceCreateRequest: AdvanceCreateRequest): Promise<AdvanceResponse> {
    return httpClient.post<AdvanceResponse>(this.BASE_URL, advanceCreateRequest);
  }

  async getAdvancesByEmployee(employeeId: string, startDate?: string, endDate?: string): Promise<AdvanceResponse[]> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });
    const url = `${this.BASE_URL}/employees/${employeeId}${params.toString() ? `?${params}` : ''}`;
    return httpClient.get<AdvanceResponse[]>(url);
  }

  async getAdvances(startDate?: string, endDate?: string): Promise<AdvanceResponse[]> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });
    const url = `${this.BASE_URL}${params.toString() ? `?${params}` : ''}`;
    return httpClient.get<AdvanceResponse[]>(url);
  }

  async patchAdvance(advanceId: string, advanceUpdateRequest: Partial<AdvanceUpdateRequest>): Promise<AdvanceResponse> {
    return httpClient.patch<AdvanceResponse>(
      `${this.BASE_URL}/${advanceId}`,
      advanceUpdateRequest
    );
  }

  async deleteAdvance(advanceId: string): Promise<void> {
    return httpClient.delete<void>(`${this.BASE_URL}/${advanceId}`);
  }
}