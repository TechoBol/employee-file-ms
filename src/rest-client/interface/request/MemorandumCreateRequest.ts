export interface MemorandumCreateRequest {
  employeeId: string;
  type: string;
  description: string;
  memorandumDate: Date;
  isPositive: boolean;
}