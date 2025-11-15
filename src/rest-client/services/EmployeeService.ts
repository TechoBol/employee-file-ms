import { httpClient } from '../http-client';
import type { Page } from '../interface/Page';
import type { EmployeeCreateRequest } from '../interface/request/EmployeeCreateRequest';
import type { EmployeeUpdateRequest } from '../interface/request/EmployeeUpdateRequest';
import type { EmployeeResponse } from '../interface/response/EmployeeResponse';

export class EmployeeService {
  private readonly BASE_URL: string = '/employees';

  async createEmployee(employeeCreateRequest: EmployeeCreateRequest): Promise<EmployeeResponse> {
    return httpClient.post<EmployeeResponse>(this.BASE_URL, employeeCreateRequest);
  }

  async getEmployeeById(id: string): Promise<EmployeeResponse> {
    return httpClient.get<EmployeeResponse>(`${this.BASE_URL}/${id}`);
  }

  async getEmployees(page: number, size: number): Promise<Page<EmployeeResponse>> {
    const url = `${this.BASE_URL}?page=${page}&size=${size}`;
    return httpClient.get<Page<EmployeeResponse>>(url);
  }

  async patchEmployee(id: string, employeeUpdateRequest: Partial<EmployeeUpdateRequest>): Promise<EmployeeResponse> {
    return httpClient.patch<EmployeeResponse>(
      `${this.BASE_URL}/${id}`,
      employeeUpdateRequest
    );
  }

  async disassociateEmployee(employeeId: string): Promise<EmployeeResponse> {
    return httpClient.patch<EmployeeResponse>(`${this.BASE_URL}/${employeeId}/disassociate`, {});
  }
}
