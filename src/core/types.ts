// Clean types without unnecessary complexity
export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  userId: string;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ExpenseFilter {
  userId?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}
