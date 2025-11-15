import { httpClient } from "../http-client";
import type { BranchCreateRequest } from "../interface/request/BranchCreateRequest";
import type { BranchUpdateRequest } from "../interface/request/BranchUpdateRequest";
import type { BranchResponse } from "../interface/response/BranchResponse";

export class BranchService {
  private readonly BASE_URL: string = '/branches';

  async getBranches(): Promise<BranchResponse[]> {
    return httpClient.get<BranchResponse[]>(this.BASE_URL);
  }

  async createBranch(branchCreateRequest: Partial<BranchCreateRequest>): Promise<BranchResponse> {
    return httpClient.post<BranchResponse>(this.BASE_URL, branchCreateRequest);
  }

  async patchBranch(id: string, branchUpdateRequest: Partial<BranchUpdateRequest>): Promise<BranchResponse> {
    return httpClient.patch<BranchResponse>(`${this.BASE_URL}/${id}`, branchUpdateRequest);
  }

  async deleteBranch(id: string): Promise<void> {
    return httpClient.delete<void>(`${this.BASE_URL}/${id}`);
  }
}