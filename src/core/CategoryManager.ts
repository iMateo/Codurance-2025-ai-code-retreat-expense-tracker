import { Category, ValidationError } from './types.js';
import { generateId } from './utils.js';

/**
 * Clean category manager without Command, Builder, Specification patterns
 * Simple CRUD with validation
 */
export class CategoryManager {
  private categories = new Map<string, Category>();

  constructor() {
    this.loadDefaultCategories();
  }

  /**
   * Create new category
   */
  create(data: Omit<Category, 'id' | 'isActive' | 'createdAt'>): Category {
    // Validation
    const errors = this.validate(data);
    if (errors.length > 0) {
      throw new Error(errors[0].message);
    }

    // Check duplicates (including soft-deleted)
    const existing = this.findByName(data.name);
    if (existing) {
      throw new Error('Category already exists');
    }

    const category: Category = {
      id: generateId(),
      name: data.name,
      description: data.description,
      budget: data.budget,
      isActive: true,
      createdAt: new Date(),
    };

    this.categories.set(category.id, category);
    return category;
  }

  /**
   * Update category
   */
  update(id: string, updates: Partial<Omit<Category, 'id'>>): Category | null {
    const category = this.categories.get(id);
    if (!category) {
      return null;
    }

    // Validation
    const errors = this.validateUpdate(updates);
    if (errors.length > 0) {
      throw new Error(errors[0].message);
    }

    // Check name duplicate
    if (updates.name) {
      const existing = this.findByName(updates.name);
      if (existing && existing.id !== id) {
        throw new Error('Category name already exists');
      }
    }

    const updated = { ...category, ...updates };
    this.categories.set(id, updated);
    return updated;
  }

  /**
   * Soft delete category
   */
  softDelete(id: string): boolean {
    const category = this.categories.get(id);
    if (!category) {
      return false;
    }

    category.isActive = false;
    return true;
  }

  /**
   * Hard delete category
   */
  hardDelete(id: string): boolean {
    return this.categories.delete(id);
  }

  /**
   * Restore category
   */
  restore(id: string): boolean {
    const category = this.categories.get(id);
    if (!category) {
      return false;
    }

    category.isActive = true;
    return true;
  }

  /**
   * Find category by ID
   */
  findById(id: string): Category | null {
    return this.categories.get(id) || null;
  }

  /**
   * Find category by name (including inactive)
   */
  findByName(name: string): Category | null {
    for (const category of this.categories.values()) {
      if (category.name === name) {
        return category;
      }
    }
    return null;
  }

  /**
   * Get all categories (including inactive)
   */
  findAll(): Category[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get only active categories
   */
  findActive(): Category[] {
    return this.findAll().filter(c => c.isActive);
  }

  /**
   * Get categories with budget
   */
  findWithBudget(): Category[] {
    return this.findActive().filter(c => c.budget && c.budget > 0);
  }

  /**
   * Search by name or description
   */
  search(query: string): Category[] {
    const lowerQuery = query.toLowerCase();
    return this.findActive().filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      (c.description && c.description.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get total budget
   */
  getTotalBudget(): number {
    return this.findWithBudget().reduce((sum, c) => sum + (c.budget || 0), 0);
  }

  // === Private methods ===

  private validate(data: Partial<{ name: string; description?: string; budget?: number }>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.name || !data.name.trim()) {
      errors.push({ field: 'name', message: 'Category name cannot be empty' });
    }

    if (data.name && data.name.length > 50) {
      errors.push({ field: 'name', message: 'Category name must be 50 characters or less' });
    }

    if (data.budget !== undefined && data.budget < 0) {
      errors.push({ field: 'budget', message: 'Budget cannot be negative' });
    }

    return errors;
  }

  private validateUpdate(updates: Partial<Omit<Category, 'id'>>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        errors.push({ field: 'name', message: 'Category name cannot be empty' });
      }
      if (updates.name.length > 50) {
        errors.push({ field: 'name', message: 'Category name must be 50 characters or less' });
      }
    }

    if (updates.budget !== undefined && updates.budget < 0) {
      errors.push({ field: 'budget', message: 'Budget cannot be negative' });
    }

    return errors;
  }

  private loadDefaultCategories(): void {
    const defaults = [
      { name: 'Food', description: 'Meals, groceries, and dining', budget: 500 },
      { name: 'Transportation', description: 'Car, gas, public transport', budget: 300 },
      { name: 'Housing', description: 'Rent, utilities, maintenance', budget: 1500 },
      { name: 'Entertainment', description: 'Movies, games, hobbies', budget: 200 },
      { name: 'Healthcare', description: 'Medical expenses, insurance', budget: 300 },
      { name: 'Shopping', description: 'Clothes, electronics, misc', budget: 400 }
    ];

    defaults.forEach(data => {
      const category: Category = {
        id: generateId(),
        name: data.name,
        description: data.description,
        budget: data.budget,
        isActive: true,
        createdAt: new Date(),
      };
      this.categories.set(category.id, category);
    });
  }
}
