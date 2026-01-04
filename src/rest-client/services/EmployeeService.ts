import { httpClient } from '../http-client';
import type { Page } from '../interface/Page';
import type { EmployeeCreateRequest } from '../interface/request/EmployeeCreateRequest';
import type { EmployeeSearchParams } from '../interface/request/EmployeeSearchParams';
import type { EmployeeChangeCompanyRequest, EmployeeUpdateRequest } from '../interface/request/EmployeeUpdateRequest';
import type { EmployeeResponse } from '../interface/response/EmployeeResponse';

export class EmployeeService {
  private readonly BASE_URL: string = '/employees';

  async createEmployee(employeeCreateRequest: EmployeeCreateRequest): Promise<EmployeeResponse> {
    return httpClient.post<EmployeeResponse>(this.BASE_URL, employeeCreateRequest);
  }

  async getEmployeeById(id: string): Promise<EmployeeResponse> {
    return httpClient.get<EmployeeResponse>(`${this.BASE_URL}/${id}`);
  }

  async getEmployees(page: number, size: number, searchParams?: EmployeeSearchParams): Promise<Page<EmployeeResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (searchParams?.search) {
      params.append('search', searchParams.search);
    }
    if (searchParams?.ci) {
      params.append('ci', searchParams.ci);
    }
    if (searchParams?.email) {
      params.append('email', searchParams.email);
    }
    if (searchParams?.phone) {
      params.append('phone', searchParams.phone);
    }
    if (searchParams?.type) {
      params.append('type', searchParams.type);
    }
    if (searchParams?.status) {
      params.append('status', searchParams.status);
    }
    if (searchParams?.isDisassociated !== undefined) {
      params.append('isDisassociated', searchParams.isDisassociated.toString());
    }
    if (searchParams?.branchId) {
      params.append('branchId', searchParams.branchId);
    }
    if (searchParams?.positionId) {
      params.append('positionId', searchParams.positionId);
    }

    const url = `${this.BASE_URL}?${params.toString()}`;
    return httpClient.get<Page<EmployeeResponse>>(url);
  }

  async patchEmployee(id: string, employeeUpdateRequest: Partial<EmployeeUpdateRequest>): Promise<EmployeeResponse> {
    return httpClient.patch<EmployeeResponse>(
      `${this.BASE_URL}/${id}`,
      employeeUpdateRequest
    );
  }

  async disassociateEmployee(employeeId: string, employeeUpdateRequest: Partial<EmployeeUpdateRequest>): Promise<EmployeeResponse> {
    return httpClient.patch<EmployeeResponse>(`${this.BASE_URL}/${employeeId}/disassociate`, employeeUpdateRequest);
  }

  async associateEmployee(employeeId: string): Promise<EmployeeResponse> {
    return httpClient.patch<EmployeeResponse>(`${this.BASE_URL}/${employeeId}/associate`, {});
  }

  async changeEmployeeCompany(employeeId: string, changeCompanyRequest: EmployeeChangeCompanyRequest): Promise<EmployeeResponse> {
    return httpClient.patch<EmployeeResponse>(
      `${this.BASE_URL}/${employeeId}/change-company`,
      changeCompanyRequest
    );
  }
}
