import { httpClient } from "../http-client";
import type { MemorandumCreateRequest } from "../interface/request/MemorandumCreateRequest";
import type { MemorandumUpdateRequest } from "../interface/request/MemorandumUpdateRequest";
import type { MemorandumResponse } from "../interface/response/MemorandumResponse";

export class MemorandumService {
  private readonly BASE_URL: string = '/memorandums';

  async createMemorandum(memorandumCreateRequest: MemorandumCreateRequest): Promise<MemorandumResponse> {
    return httpClient.post<MemorandumResponse>(this.BASE_URL, memorandumCreateRequest);
  }

  async getMemorandumsByEmployee(employeeId: string, startDate?: string, endDate?: string, useActualDate?: boolean): Promise<MemorandumResponse[]> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });
    if (useActualDate !== undefined && useActualDate !== null) {
      params.append('useActualDate', useActualDate.toString());
    }
    const url = `${this.BASE_URL}/employees/${employeeId}${params.toString() ? `?${params}` : ''}`;
    return httpClient.get<MemorandumResponse[]>(url);
  }

  async getMemorandums(startDate?: string, endDate?: string): Promise<MemorandumResponse[]> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });
    const url = `${this.BASE_URL}${params.toString() ? `?${params}` : ''}`;
    return httpClient.get<MemorandumResponse[]>(url);
  }

  async patchMemorandum(memorandumId: string, memorandumUpdateRequest: Partial<MemorandumUpdateRequest>): Promise<MemorandumResponse> {
    return httpClient.patch<MemorandumResponse>(
      `${this.BASE_URL}/${memorandumId}`,
      memorandumUpdateRequest
    );
  }

  async deleteMemorandum(memorandumId: string): Promise<void> {
    return httpClient.delete<void>(`${this.BASE_URL}/${memorandumId}`);
  }
}