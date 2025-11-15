import { Expense, ExpenseFilter } from '../types/expense.js';
import { ExpenseManager } from '../core/ExpenseManager.js';
import { StorageService } from '../core/StorageService.js';

/**
 * Adapter for old ExpenseService API
 * Uses new clean ExpenseManager internally
 * Maintains compatibility with existing tests
 */
export class ExpenseService {
  private manager: ExpenseManager;
  private static instance: ExpenseService;

  constructor() {
    // Create manager with persistence callback
    this.manager = new ExpenseManager(() => this.saveToStorage());
    ExpenseService.instance = this;

    // Load data from localStorage if available
    this.loadFromStorage();

    // Removed window registration - no longer needed
  }

  /**
   * Save current state to localStorage
   */
  private saveToStorage(): void {
    const expenses = this.manager.findAll();
    StorageService.saveExpenses(expenses);
  }

  /**
   * Load state from localStorage
   */
  private loadFromStorage(): void {
    const stored = StorageService.loadExpenses();
    if (stored && stored.length > 0) {
      this.manager.clear();
      this.manager.loadFromArray(stored);
    }
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
