export interface AbsenceUpdateRequest {
  type: string;
  duration: string;
  date: string;
  endDate?: string;
  reason?: string;
  description?: string;
}