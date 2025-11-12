export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  userId: string;
  receiptUrl?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'yearly';
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  budget?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  currency: string;
  createdAt: Date;
}

export interface ExpenseFilter {
  userId?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  tags?: string[];
  description?: string;
}

export interface ExpenseReport {
  totalAmount: number;
  expenseCount: number;
  categoryBreakdown: { [category: string]: number };
  monthlyTrend: { month: string; amount: number }[];
  averageExpense: number;
}