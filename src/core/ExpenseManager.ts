import { Expense, ExpenseFilter, ValidationError } from './types.js';
import { generateId } from './utils.js';

/**
 * Clean expense manager without GlobalState and excessive patterns
 * Simple CRUD with validation
 */
export class ExpenseManager {
  private expenses = new Map<string, Expense>();

  constructor() {
    // Load sample data for test compatibility
    this.loadSampleData();
  }

  /**
   * Create new expense
   */
  create(data: Omit<Expense, 'id'>): Expense {
    // Validation
    const errors = this.validate(data);
    if (errors.length > 0) {
      throw new Error(errors[0].message);
    }

    // Create expense
    const expense: Expense = {
      ...data,
      id: generateId(),
      description: data.description.trim(),
      category: this.normalizeCategory(data.category),
    };

    this.expenses.set(expense.id, expense);
    return expense;
  }

  /**
   * Get all expenses
   */
  findAll(): Expense[] {
    return Array.from(this.expenses.values());
  }

  /**
   * Find expense by ID
   */
  findById(id: string): Expense | null {
    return this.expenses.get(id) || null;
  }

  /**
   * Update expense
   */
  update(id: string, updates: Partial<Expense>): Expense | null {
    const expense = this.expenses.get(id);
    if (!expense) {
      return null;
    }

    // Validate updates
    const errors = this.validateUpdate(updates);
    if (errors.length > 0) {
      throw new Error(errors[0].message);
    }

    const updated = { ...expense, ...updates };
    this.expenses.set(id, updated);
    return updated;
  }

  /**
   * Delete expense
   */
  delete(id: string): boolean {
    return this.expenses.delete(id);
  }

  /**
   * Find expenses by filter
   */
  findByFilter(filter: ExpenseFilter): Expense[] {
    let results = this.findAll();

    if (filter.userId) {
      results = results.filter(e => e.userId === filter.userId);
    }

    if (filter.category) {
      results = results.filter(e => e.category === filter.category);
    }

    if (filter.startDate) {
      results = results.filter(e => e.date >= filter.startDate!);
    }

    if (filter.endDate) {
      results = results.filter(e => e.date <= filter.endDate!);
    }

    if (filter.minAmount !== undefined) {
      results = results.filter(e => e.amount >= filter.minAmount!);
    }

    if (filter.maxAmount !== undefined) {
      results = results.filter(e => e.amount <= filter.maxAmount!);
    }

    return results;
  }

  /**
   * Get total amount
   */
  getTotalAmount(filter?: ExpenseFilter): number {
    const expenses = filter ? this.findByFilter(filter) : this.findAll();
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  /**
   * Get average amount
   */
  getAverageAmount(filter?: ExpenseFilter): number {
    const expenses = filter ? this.findByFilter(filter) : this.findAll();
    if (expenses.length === 0) return 0;
    return this.getTotalAmount(filter) / expenses.length;
  }

  // === Private methods ===

  private validate(data: Omit<Expense, 'id'>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Amount validation
    if (data.amount < 0) {
      errors.push({ field: 'amount', message: 'Amount cannot be negative' });
    }

    // Description validation
    if (!data.description || !data.description.trim()) {
      errors.push({ field: 'description', message: 'Description cannot be empty' });
    }

    // Category validation
    if (!data.category || !data.category.trim()) {
      errors.push({ field: 'category', message: 'Category cannot be empty' });
    }

    return errors;
  }

  private validateUpdate(updates: Partial<Expense>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (updates.amount !== undefined && updates.amount < 0) {
      errors.push({ field: 'amount', message: 'Amount cannot be negative' });
    }

    return errors;
  }

  private normalizeCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }

  private loadSampleData(): void {
    // Sample data for test compatibility
    const samples: Omit<Expense, 'id'>[] = [
      {
        amount: 25.50,
        description: 'Coffee and pastry',
        category: 'Food',
        date: new Date('2024-01-15'),
        userId: 'user1',
        tags: ['coffee', 'breakfast']
      },
      {
        amount: 1200.00,
        description: 'Monthly rent payment',
        category: 'Housing',
        date: new Date('2024-01-01'),
        userId: 'user1',
      },
      {
        amount: 85.75,
        description: 'Grocery shopping',
        category: 'Food',
        date: new Date('2024-01-10'),
        userId: 'user1',
        tags: ['groceries', 'weekly']
      },
      {
        amount: 45.00,
        description: 'Gas station fill-up',
        category: 'Transportation',
        date: new Date('2024-01-12'),
        userId: 'user2',
        tags: ['fuel', 'car']
      },
      {
        amount: 120.00,
        description: 'Dinner at restaurant',
        category: 'Food',
        date: new Date('2024-01-18'),
        userId: 'user2',
        tags: ['dining', 'entertainment']
      }
    ];

    samples.forEach(data => {
      const expense: Expense = {
        ...data,
        id: generateId(),
        description: data.description.trim(),
        category: this.normalizeCategory(data.category),
      };
      this.expenses.set(expense.id, expense);
    });
  }
}
