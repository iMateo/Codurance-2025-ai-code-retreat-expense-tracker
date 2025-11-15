import { Expense, ExpenseFilter } from '../types/expense.js';
import { ExpenseManager } from '../core/ExpenseManager.js';

/**
 * Adapter for old ExpenseService API
 * Uses new clean ExpenseManager internally
 * Maintains compatibility with existing tests
 */
export class ExpenseService {
  private manager: ExpenseManager;
  private static instance: ExpenseService;

  constructor() {
    this.manager = new ExpenseManager();
    ExpenseService.instance = this;

    // Removed window registration - no longer needed
  }

  public static getInstance(): ExpenseService {
    if (!ExpenseService.instance) {
      ExpenseService.instance = new ExpenseService();
    }
    return ExpenseService.instance;
  }

  // === Public API (for tests) ===

  addExpense(expense: Omit<Expense, 'id'>): Expense {
    return this.manager.create(expense);
  }

  updateExpense(id: string, updates: Partial<Expense>): Expense | null {
    return this.manager.update(id, updates);
  }

  deleteExpense(id: string): boolean {
    return this.manager.delete(id);
  }

  getExpenseById(id: string): Expense | null {
    return this.manager.findById(id);
  }

  getAllExpenses(): Expense[] {
    return this.manager.findAll();
  }

  getExpensesByFilter(filter: ExpenseFilter): Expense[] {
    return this.manager.findByFilter(filter);
  }

  getTotalExpenses(userId?: string): number {
    const filter: ExpenseFilter = userId ? { userId } : {};
    return this.manager.getTotalAmount(filter);
  }

  getExpensesByCategory(category: string): Expense[] {
    return this.manager.findByFilter({ category });
  }

  getExpensesByDateRange(startDate: Date, endDate: Date): Expense[] {
    return this.manager.findByFilter({ startDate, endDate });
  }

  calculateAverageExpense(userId?: string): number {
    const filter: ExpenseFilter = userId ? { userId } : {};
    return this.manager.getAverageAmount(filter);
  }

  // Removed onConfigChanged - no longer needed without GlobalState
}
