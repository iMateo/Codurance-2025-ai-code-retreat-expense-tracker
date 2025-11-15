import { Expense, Category } from './types.js';

/**
 * Storage service for localStorage persistence
 * Handles serialization, deserialization, and migration
 */
export class StorageService {
  private static readonly STORAGE_VERSION = '1.0';
  private static readonly KEYS = {
    EXPENSES: 'expense-tracker-expenses',
    CATEGORIES: 'expense-tracker-categories',
    VERSION: 'expense-tracker-version',
  };

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Save expenses to localStorage
   */
  static saveExpenses(expenses: Expense[]): boolean {
    if (!this.isAvailable()) return false;

    try {
      const serialized = JSON.stringify(expenses, this.replacer);
      localStorage.setItem(this.KEYS.EXPENSES, serialized);
      this.saveVersion();
      return true;
    } catch (error) {
      console.error('Failed to save expenses to localStorage:', error);
      return false;
    }
  }

  /**
   * Load expenses from localStorage
   */
  static loadExpenses(): Expense[] | null {
    if (!this.isAvailable()) return null;

    try {
      const data = localStorage.getItem(this.KEYS.EXPENSES);
      if (!data) return null;

      const parsed = JSON.parse(data, this.reviver);
      return parsed as Expense[];
    } catch (error) {
      console.error('Failed to load expenses from localStorage:', error);
      return null;
    }
  }

  /**
   * Save categories to localStorage
   */
  static saveCategories(categories: Category[]): boolean {
    if (!this.isAvailable()) return false;

    try {
      const serialized = JSON.stringify(categories, this.replacer);
      localStorage.setItem(this.KEYS.CATEGORIES, serialized);
      this.saveVersion();
      return true;
    } catch (error) {
      console.error('Failed to save categories to localStorage:', error);
      return false;
    }
  }

  /**
   * Load categories from localStorage
   */
  static loadCategories(): Category[] | null {
    if (!this.isAvailable()) return null;

    try {
      const data = localStorage.getItem(this.KEYS.CATEGORIES);
      if (!data) return null;

      const parsed = JSON.parse(data, this.reviver);
      return parsed as Category[];
    } catch (error) {
      console.error('Failed to load categories from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear all data from localStorage
   */
  static clearAll(): boolean {
    if (!this.isAvailable()) return false;

    try {
      localStorage.removeItem(this.KEYS.EXPENSES);
      localStorage.removeItem(this.KEYS.CATEGORIES);
      localStorage.removeItem(this.KEYS.VERSION);
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  /**
   * Get current storage version
   */
  static getVersion(): string | null {
    if (!this.isAvailable()) return null;
    return localStorage.getItem(this.KEYS.VERSION);
  }

  /**
   * Save storage version
   */
  private static saveVersion(): void {
    try {
      localStorage.setItem(this.KEYS.VERSION, this.STORAGE_VERSION);
    } catch (error) {
      console.error('Failed to save version:', error);
    }
  }

  /**
   * Custom JSON replacer to handle Date objects
   */
  private static replacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  /**
   * Custom JSON reviver to restore Date objects
   */
  private static reviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }

  /**
   * Check if migration is needed
   */
  static needsMigration(): boolean {
    const currentVersion = this.getVersion();
    return currentVersion !== null && currentVersion !== this.STORAGE_VERSION;
  }

  /**
   * Perform migration if needed
   */
  static migrate(): boolean {
    if (!this.needsMigration()) return true;

    try {
      // Future migrations can be added here
      console.log('Migration completed');
      this.saveVersion();
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  }
}
