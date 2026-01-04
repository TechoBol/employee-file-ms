import { httpClient } from '../http-client';
import type { DepartmentCreateRequest } from '../interface/request/DepartmentCreateRequest';
import type { DepartmentUpdateRequest } from '../interface/request/DepartmentUpdateRequest';
import type { DepartmentResponse } from '../interface/response/DepartmentResponse';

export class DepartmentService {
  private readonly BASE_URL: string = '/departments';

  async createDepartment(departmentCreateRequest: DepartmentCreateRequest): Promise<DepartmentResponse> {
    return httpClient.post<DepartmentResponse>(this.BASE_URL, departmentCreateRequest);
  }

  async getDepartments(): Promise<DepartmentResponse[]> {
    return httpClient.get<DepartmentResponse[]>(this.BASE_URL);
  }

  async patchDepartment(id: string, departmentUpdateRequest: Partial<DepartmentUpdateRequest>): Promise<DepartmentResponse> {
    return httpClient.patch<DepartmentResponse>(`${this.BASE_URL}/${id}`, departmentUpdateRequest);
  }

  async deleteDepartment(id: string): Promise<void> {
    return httpClient.delete<void>(`${this.BASE_URL}/${id}`);
  }
}
