import type { FileResponse } from "../interface/response/FileResponse";
import type { FileWithUrlResponse } from "../interface/response/FileResponse";
import { httpClient } from "../http-client";

export class FileService {
  private readonly BASE_URL: string = '/files';

  async setEmployeeFiles(
    employeeId: string,
    sections: string[],
    files: File[]
  ): Promise<FileResponse> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    const sectionsParams = sections.map(s => `sections=${encodeURIComponent(s)}`).join('&');
    const url = `${this.BASE_URL}/employees/${employeeId}?${sectionsParams}`;

    return httpClient.post<FileResponse>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getEmployeeFiles(employeeId: string): Promise<FileWithUrlResponse> {
    return httpClient.get<FileWithUrlResponse>(
      `${this.BASE_URL}/employees/${employeeId}`
    );
  }
}