import { httpClient } from '../http-client';
import type { AbsenceCreateRequest } from '../interface/request/AbsenceCreateRequest';
import type { AbsenceUpdateRequest } from '../interface/request/AbsenceUpdateRequest';
import type { AbsenceResponse } from '../interface/response/AbsenceResponse';

export class AbsenceService {
  private readonly BASE_URL: string = '/absences';

  async createAbsence(absenceCreateRequest: AbsenceCreateRequest): Promise<AbsenceResponse> {
    return httpClient.post<AbsenceResponse>(this.BASE_URL, absenceCreateRequest);
  }

  async getAbsencesByEmployee(employeeId: string, startDate?: string, endDate?: string, useActualDate?: boolean): Promise<AbsenceResponse[]> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });
    if (useActualDate !== undefined && useActualDate !== null) {
      params.append('useActualDate', useActualDate.toString());
    }
    const url = `${this.BASE_URL}/employees/${employeeId}${params.toString() ? `?${params}` : ''}`;
    return httpClient.get<AbsenceResponse[]>(url);
  }

  async patchAbsence(absenceId: string, absenceUpdateRequest: Partial<AbsenceUpdateRequest>): Promise<AbsenceResponse> {
    return httpClient.patch<AbsenceResponse>(
      `${this.BASE_URL}/${absenceId}`,
      absenceUpdateRequest
    );
  }

  async replacePatchAbsence(absenceId: string, absenceUpdateRequest: Partial<AbsenceUpdateRequest>): Promise<AbsenceResponse> {
    return httpClient.patch<AbsenceResponse>(
      `${this.BASE_URL}/${absenceId}/replace`,
      absenceUpdateRequest
    );
  }

  async deleteAbsence(absenceId: string): Promise<void> {
    return httpClient.delete<void>(`${this.BASE_URL}/${absenceId}`);
  }
}