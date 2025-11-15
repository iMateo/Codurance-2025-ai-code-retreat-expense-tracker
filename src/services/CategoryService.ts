import { Category, Expense } from '../types/expense.js';
import { CategoryManager } from '../core/CategoryManager.js';
import { StorageService } from '../core/StorageService.js';

/**
 * Adapter for old CategoryService API
 * Uses new clean CategoryManager internally
 * Maintains compatibility with existing tests
 */
export class CategoryService {
  private manager: CategoryManager;
  private static instance: CategoryService;

  constructor() {
    // Create manager with persistence callback
    this.manager = new CategoryManager(() => this.saveToStorage());
    CategoryService.instance = this;

    // Load data from localStorage if available
    this.loadFromStorage();

    // Removed window registration - no longer needed
  }

  /**
   * Save current state to localStorage
   */
  private saveToStorage(): void {
    const categories = this.manager.findAll();
    StorageService.saveCategories(categories);
  }

  /**
   * Load state from localStorage
   */
  private loadFromStorage(): void {
    const stored = StorageService.loadCategories();
    if (stored && stored.length > 0) {
      this.manager.clear();
      this.manager.loadFromArray(stored);
    }
  }

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  // === Public API (for tests) ===

  addCategory(name: string, description?: string, color?: string, budget?: number): Category {
    // Color validation
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new Error('Invalid color format');
    }

    return this.manager.create({
      name,
      description,
      budget
    });
  }

  updateCategory(id: string, name?: string, description?: string, color?: string, budget?: number): Category | null {
    const updates: Partial<Omit<Category, 'id'>> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (budget !== undefined) updates.budget = budget;

    return this.manager.update(id, updates);
  }

  deleteCategory(id: string): boolean {
    return this.manager.softDelete(id);
  }

  getCategoryById(id: string): Category | null {
    return this.manager.findById(id);
  }

  getCategoryByName(name: string): Category | null {
    return this.manager.findByName(name);
  }

  getAllCategories(): Category[] {
    return this.manager.findActive();
  }

  getAllCategoriesIncludingInactive(): Category[] {
    return this.manager.findAll();
  }

  getCategoriesWithBudget(): Category[] {
    return this.manager.findWithBudget();
  }

  validateCategoryExists(categoryName: string): boolean {
    const category = this.manager.findByName(categoryName);
    return category !== null && category.isActive;
  }

  getTotalBudget(): number {
    return this.manager.getTotalBudget();
  }

  searchCategories(query: string): Category[] {
    return this.manager.search(query);
  }

  restoreCategory(id: string): boolean {
    return this.manager.restore(id);
  }

  getCategoryStats() {
    const all = this.manager.findAll();
    const active = this.manager.findActive();
    const withBudget = this.manager.findWithBudget();
    const totalBudget = this.manager.getTotalBudget();

    return {
      totalCategories: all.length,
      activeCategories: active.length,
      inactiveCategories: all.length - active.length,
      totalBudget,
      averageBudget: withBudget.length > 0 ? totalBudget / withBudget.length : 0,
      categoriesWithBudget: withBudget.length,
      categoriesWithoutBudget: active.length - withBudget.length
    };
  }

  findCategoriesByColor(color: string): Category[] {
    // Simplified - color is no longer used in core
    return [];
  }

  // Removed tight coupling methods:
  // - onExpenseAdded
  // - onConfigChanged
  // - updateCategoryUsageStats
}
