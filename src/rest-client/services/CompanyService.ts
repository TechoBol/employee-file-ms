import { httpClient } from "../http-client";
import type { CompanyCreateRequest } from "../interface/request/CompanyCreateRequest";
import type { CompanyUpdateRequest } from "../interface/request/CompanyUpdateRequest";
import type { CompanyResponse } from "../interface/response/CompanyResponse";

export class CompanyService {
  private readonly BASE_URL: string = '/companies';

  async getCompanies(): Promise<CompanyResponse[]> {
    return httpClient.get<CompanyResponse[]>(this.BASE_URL);
  }

  async createCompany(companyCreateRequest: Partial<CompanyCreateRequest>): Promise<CompanyResponse> {
    return httpClient.post<CompanyResponse>(this.BASE_URL, companyCreateRequest);
  }

  async patchCompany(id: string, companyUpdateRequest: Partial<CompanyUpdateRequest>): Promise<CompanyResponse> {
    return httpClient.patch<CompanyResponse>(`${this.BASE_URL}/${id}`, companyUpdateRequest);
  }
}