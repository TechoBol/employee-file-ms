export interface VacationCreateRequest {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
}