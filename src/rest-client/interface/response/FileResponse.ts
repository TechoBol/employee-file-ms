export interface FileResponse {
  id: string;
  employeeId: string;
  companyId: string;
  sections: UnitFileResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface FileWithUrlResponse {
  id: string;
  employeeId: string;
  companyId: string;
  sections: UnitFileWithUrlResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface UnitFileResponse {
  id: string;
  uuidFileName: string;
  originalName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  section: string;
}

export interface UnitFileWithUrlResponse {
  id: string;
  originalName: string;
  section: string;
  description: string;
  uploadBy: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}