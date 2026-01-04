export interface MemorandumUpdateRequest {
  type?: string;
  description?: string;
  memorandumDate?: Date;
  isPositive?: boolean;
}