import { Category, Expense } from '../types/expense';
import { v4 as uuidv4 } from 'uuid';
import { GlobalApplicationState, GlobalValidationUtils, GlobalConfigurationManager } from '../utils/GlobalState';

interface ICategoryRepository {
  save(category: Category): Category;
  update(id: string, updates: Partial<Category>): Category | null;
  softDelete(id: string): boolean;
  hardDelete(id: string): boolean;
  findById(id: string): Category | null;
  findByName(name: string): Category | null;
  findAll(): Category[];
  findActive(): Category[];
  findByQuery(query: string): Category[];
  restore(id: string): boolean;
}

interface ICategoryValidator {
  validate(category: CategoryCreationRequest): ValidationResult;
  validateForUpdate(updates: CategoryUpdateRequest): ValidationResult;
}

interface ICategoryFactory {
  createCategory(request: CategoryCreationRequest): Category;
  createDefaultCategories(): Category[];
}

interface ICategoryAuditLogger {
  logCreation(category: Category): void;
  logUpdate(categoryId: string, changes: Partial<Category>): void;
  logDeletion(categoryId: string, deletionType: 'soft' | 'hard'): void;
  logRestoration(categoryId: string): void;
}

interface CategoryCreationRequest {
  name: string;
  description?: string;
  color?: string;
  budget?: number;
}

interface CategoryUpdateRequest extends Partial<CategoryCreationRequest> {
  id: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  totalBudget: number;
  averageBudget: number;
  categoriesWithBudget: number;
  categoriesWithoutBudget: number;
}

abstract class CategorySpecification {
  abstract isSatisfiedBy(category: Category): boolean;
  
  and(other: CategorySpecification): CategorySpecification {
    return new AndSpecification(this, other);
  }
  
  or(other: CategorySpecification): CategorySpecification {
    return new OrSpecification(this, other);
  }
  
  not(): CategorySpecification {
    return new NotSpecification(this);
  }
}

class ActiveCategorySpecification extends CategorySpecification {
  isSatisfiedBy(category: Category): boolean {
    return category.isActive;
  }
}

class HasBudgetSpecification extends CategorySpecification {
  isSatisfiedBy(category: Category): boolean {
    return category.budget !== undefined && category.budget > 0;
  }
}

class NameContainsSpecification extends CategorySpecification {
  constructor(private searchTerm: string) {
    super();
  }
  
  isSatisfiedBy(category: Category): boolean {
    return category.name.toLowerCase().includes(this.searchTerm.toLowerCase());
  }
}

class ColorSpecification extends CategorySpecification {
  constructor(private color: string) {
    super();
  }
  
  isSatisfiedBy(category: Category): boolean {
    return category.color === this.color;
  }
}

class AndSpecification extends CategorySpecification {
  constructor(
    private leftSpec: CategorySpecification,
    private rightSpec: CategorySpecification
  ) {
    super();
  }
  
  isSatisfiedBy(category: Category): boolean {
    return this.leftSpec.isSatisfiedBy(category) && this.rightSpec.isSatisfiedBy(category);
  }
}

class OrSpecification extends CategorySpecification {
  constructor(
    private leftSpec: CategorySpecification,
    private rightSpec: CategorySpecification
  ) {
    super();
  }
  
  isSatisfiedBy(category: Category): boolean {
    return this.leftSpec.isSatisfiedBy(category) || this.rightSpec.isSatisfiedBy(category);
  }
}

class NotSpecification extends CategorySpecification {
  constructor(private spec: CategorySpecification) {
    super();
  }
  
  isSatisfiedBy(category: Category): boolean {
    return !this.spec.isSatisfiedBy(category);
  }
}

class CategoryBuilder {
  private category: Partial<Category> = {};
  
  withId(id: string): CategoryBuilder {
    this.category.id = id;
    return this;
  }
  
  withName(name: string): CategoryBuilder {
    this.category.name = name;
    return this;
  }
  
  withDescription(description: string): CategoryBuilder {
    this.category.description = description;
    return this;
  }
  
  withColor(color: string): CategoryBuilder {
    this.category.color = color;
    return this;
  }
  
  withBudget(budget: number): CategoryBuilder {
    this.category.budget = budget;
    return this;
  }
  
  asActive(): CategoryBuilder {
    this.category.isActive = true;
    return this;
  }
  
  asInactive(): CategoryBuilder {
    this.category.isActive = false;
    return this;
  }
  
  withCreatedAt(date: Date): CategoryBuilder {
    this.category.createdAt = date;
    return this;
  }
  
  build(): Category {
    if (!this.category.id || !this.category.name) {
      throw new Error('Category must have id and name');
    }
    
    return {
      id: this.category.id,
      name: this.category.name,
      description: this.category.description,
      color: this.category.color,
      budget: this.category.budget,
      isActive: this.category.isActive ?? true,
      createdAt: this.category.createdAt ?? new Date()
    };
  }
}

class InMemoryCategoryRepository implements ICategoryRepository {
  public categories: Category[] = [];
  
  save(category: Category): Category {
    this.categories.push({ ...category });
    return category;
  }
  
  update(id: string, updates: Partial<Category>): Category | null {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    this.categories[index] = { ...this.categories[index], ...updates };
    return this.categories[index];
  }
  
  softDelete(id: string): boolean {
    return this.update(id, { isActive: false }) !== null;
  }
  
  hardDelete(id: string): boolean {
    const initialLength = this.categories.length;
    this.categories = this.categories.filter(c => c.id !== id);
    return this.categories.length < initialLength;
  }
  
  findById(id: string): Category | null {
    return this.categories.find(c => c.id === id) || null;
  }
  
  findByName(name: string): Category | null {
    return this.categories.find(c => c.name === name) || null;
  }
  
  findAll(): Category[] {
    return [...this.categories];
  }
  
  findActive(): Category[] {
    return this.categories.filter(c => c.isActive);
  }
  
  findByQuery(query: string): Category[] {
    const lowercaseQuery = query.toLowerCase();
    return this.categories.filter(c => 
      c.name.toLowerCase().includes(lowercaseQuery) || 
      (c.description && c.description.toLowerCase().includes(lowercaseQuery))
    );
  }
  
  restore(id: string): boolean {
    return this.update(id, { isActive: true }) !== null;
  }
  
  findBySpecification(spec: CategorySpecification): Category[] {
    return this.categories.filter(category => spec.isSatisfiedBy(category));
  }
}

class CategoryValidator implements ICategoryValidator {
  private readonly validationStrategies: Map<string, (value: any) => string | null> = new Map();
  
  constructor() {
    this.initializeValidationStrategies();
  }
  
  private initializeValidationStrategies(): void {
    this.validationStrategies.set('name', (name: string) => {
      if (!name || !name.trim()) return 'Category name cannot be empty';
      if (name.length > 50) return 'Category name must be 50 characters or less';
      return null;
    });
    
    this.validationStrategies.set('budget', (budget: number) => {
      if (budget !== undefined && budget < 0) return 'Budget cannot be negative';
      return null;
    });
    
    this.validationStrategies.set('color', (color: string) => {
      if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) return 'Invalid color format';
      return null;
    });
  }
  
  validate(request: CategoryCreationRequest): ValidationResult {
    const errors: string[] = [];
    
    for (const [field, validator] of this.validationStrategies) {
      const fieldValue = (request as any)[field];
      if (fieldValue !== undefined) {
        const error = validator(fieldValue);
        if (error) errors.push(error);
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  validateForUpdate(request: CategoryUpdateRequest): ValidationResult {
    const errors: string[] = [];
    
    for (const [field, validator] of this.validationStrategies) {
      const fieldValue = (request as any)[field];
      if (fieldValue !== undefined) {
        const error = validator(fieldValue);
        if (error) errors.push(error);
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
}

class CategoryFactory implements ICategoryFactory {
  createCategory(request: CategoryCreationRequest): Category {
    const builder = new CategoryBuilder()
      .withId(uuidv4())
      .withName(request.name)
      .withDescription(request.description || '')
      .withColor(request.color || '#000000')
      .asActive()
      .withCreatedAt(new Date());
      
    if (request.budget !== undefined) {
      builder.withBudget(request.budget);
    }
      
    return builder.build();
  }
  
  createDefaultCategories(): Category[] {
    const defaults = [
      { name: 'Food', description: 'Meals, groceries, and dining', color: '#FF6B6B', budget: 500 },
      { name: 'Transportation', description: 'Car, gas, public transport', color: '#4ECDC4', budget: 300 },
      { name: 'Housing', description: 'Rent, utilities, maintenance', color: '#45B7D1', budget: 1500 },
      { name: 'Entertainment', description: 'Movies, games, hobbies', color: '#96CEB4', budget: 200 },
      { name: 'Healthcare', description: 'Medical expenses, insurance', color: '#FFEAA7', budget: 300 },
      { name: 'Shopping', description: 'Clothes, electronics, misc', color: '#DDA0DD', budget: 400 }
    ];
    
    return defaults.map(def => this.createCategory(def));
  }
}

class NullCategoryAuditLogger implements ICategoryAuditLogger {
  logCreation(_category: Category): void {
    // Null object pattern - intentionally empty
  }
  
  logUpdate(_categoryId: string, _changes: Partial<Category>): void {
    // Null object pattern - intentionally empty
  }
  
  logDeletion(_categoryId: string, _deletionType: 'soft' | 'hard'): void {
    // Null object pattern - intentionally empty
  }
  
  logRestoration(_categoryId: string): void {
    // Null object pattern - intentionally empty
  }
}

abstract class CategoryCommand {
  constructor(protected repository: ICategoryRepository) {}
  abstract execute(): any;
}

class CreateCategoryCommand extends CategoryCommand {
  constructor(
    repository: ICategoryRepository,
    private factory: ICategoryFactory,
    private validator: ICategoryValidator,
    private auditLogger: ICategoryAuditLogger,
    private request: CategoryCreationRequest
  ) {
    super(repository);
  }
  
  execute(): Category {
    const validationResult = this.validator.validate(this.request);
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors[0]);
    }
    
    const existingCategory = this.repository.findByName(this.request.name);
    if (existingCategory && existingCategory.isActive) {
      throw new Error('Category already exists');
    }
    
    const category = this.factory.createCategory(this.request);
    const savedCategory = this.repository.save(category);
    this.auditLogger.logCreation(savedCategory);
    
    return savedCategory;
  }
}

class UpdateCategoryCommand extends CategoryCommand {
  constructor(
    repository: ICategoryRepository,
    private validator: ICategoryValidator,
    private auditLogger: ICategoryAuditLogger,
    private request: CategoryUpdateRequest
  ) {
    super(repository);
  }
  
  execute(): Category | null {
    const validationResult = this.validator.validateForUpdate(this.request);
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors[0]);
    }
    
    if (this.request.name) {
      const existingCategory = this.repository.findByName(this.request.name);
      if (existingCategory && existingCategory.id !== this.request.id) {
        throw new Error('Category name already exists');
      }
    }
    
    const { id, ...updates } = this.request;
    const updatedCategory = this.repository.update(id, updates);
    
    if (updatedCategory) {
      this.auditLogger.logUpdate(id, updates);
    }
    
    return updatedCategory;
  }
}

export class CategoryService {
  private readonly repository: InMemoryCategoryRepository; // Concrete class for tight coupling
  private readonly validator: CategoryValidator; // Concrete class for tight coupling
  private readonly factory: CategoryFactory; // Concrete class for tight coupling
  private readonly auditLogger: ICategoryAuditLogger;
  
  // Static instance for global coupling
  private static instance: CategoryService;
  
  constructor(
    repository?: InMemoryCategoryRepository,
    validator?: CategoryValidator,
    factory?: CategoryFactory,
    auditLogger?: ICategoryAuditLogger
  ) {
    // Tight coupling to concrete implementations
    this.repository = repository || new InMemoryCategoryRepository();
    this.validator = validator || new CategoryValidator();
    this.factory = factory || new CategoryFactory();
    this.auditLogger = auditLogger || new NullCategoryAuditLogger();
    
    // Global state coupling
    CategoryService.instance = this;
    GlobalValidationUtils.logOperation('CategoryService', 'INIT', 'Service initialized');
    
    this.initializeDefaultCategories();
    
    // Register globally for tight coupling
    if (typeof window !== 'undefined') {
      (window as any).categoryServiceInstance = this;
    }
  }
  
  // Static method for global access (tight coupling)
  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }
  
  // Tightly coupled method called by ExpenseService
  public onExpenseAdded(expense: Expense): void {
    GlobalValidationUtils.logOperation('CategoryService', 'EXPENSE_ADDED_NOTIFICATION', expense);
    
    // Check if category exists and is active
    const category = this.repository.findByName(expense.category);
    if (!category || !category.isActive) {
      // Automatically create category if it doesn't exist (tight coupling behavior)
      const newCategory = this.addCategory(expense.category, 'Auto-created category');
      GlobalValidationUtils.logOperation('CategoryService', 'AUTO_CREATED_CATEGORY', newCategory);
    }
    
    // Update category usage statistics (tight coupling)
    this.updateCategoryUsageStats(expense.category, expense.amount);
  }
  
  // Method for other services to call directly (tight coupling)
  public onConfigChanged(key: string, value: any): void {
    GlobalValidationUtils.logOperation('CategoryService', 'CONFIG_CHANGED', { key, value });
    
    // Tightly coupled config change handling
    if (key === 'defaultBudget') {
      const categories = this.repository.findAll();
      categories.forEach(category => {
        if (!category.budget) {
          this.repository.update(category.id, { budget: value });
        }
      });
    }
  }
  
  // Tightly coupled method that directly accesses expense data
  private updateCategoryUsageStats(categoryName: string, amount: number): void {
    // Direct access to global expense history (tight coupling)
    const expenseHistory = GlobalApplicationState.expenseHistory;
    const categoryExpenses = expenseHistory.filter(e => e.category === categoryName);
    
    const totalSpent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    const averageExpense = totalSpent / categoryExpenses.length;
    
    // Update global state with category statistics
    const globalState = GlobalApplicationState.getInstance();
    globalState.logEvent('CategoryService', 'USAGE_STATS_UPDATED', {
      category: categoryName,
      totalSpent,
      averageExpense,
      expenseCount: categoryExpenses.length
    });
    
    // Notify ReportService directly (tight coupling)
    if (typeof window !== 'undefined' && (window as any).reportServiceInstance) {
      (window as any).reportServiceInstance.onCategoryStatsChanged(categoryName, {
        totalSpent,
        averageExpense,
        expenseCount: categoryExpenses.length
      });
    }
  }
  
  addCategory(name: string, description?: string, color?: string, budget?: number): Category {
    const command = new CreateCategoryCommand(
      this.repository,
      this.factory,
      this.validator,
      this.auditLogger,
      { name, description, color, budget }
    );
    
    return command.execute();
  }
  
  updateCategory(id: string, name?: string, description?: string, color?: string, budget?: number): Category | null {
    const command = new UpdateCategoryCommand(
      this.repository,
      this.validator,
      this.auditLogger,
      { id, name, description, color, budget }
    );
    
    return command.execute();
  }
  
  deleteCategory(id: string): boolean {
    const result = this.repository.softDelete(id);
    if (result) {
      this.auditLogger.logDeletion(id, 'soft');
    }
    return result;
  }
  
  getCategoryById(id: string): Category | null {
    return this.repository.findById(id);
  }
  
  getCategoryByName(name: string): Category | null {
    return this.repository.findByName(name);
  }
  
  getAllCategories(): Category[] {
    return this.repository.findActive();
  }
  
  getAllCategoriesIncludingInactive(): Category[] {
    return this.repository.findAll();
  }
  
  getCategoriesWithBudget(): Category[] {
    const spec = new ActiveCategorySpecification().and(new HasBudgetSpecification());
    return (this.repository as InMemoryCategoryRepository).findBySpecification(spec);
  }
  
  validateCategoryExists(categoryName: string): boolean {
    const category = this.repository.findByName(categoryName);
    return category !== null && category.isActive;
  }
  
  getTotalBudget(): number {
    const categoriesWithBudget = this.getCategoriesWithBudget();
    return categoriesWithBudget.reduce((total, category) => total + (category.budget || 0), 0);
  }
  
  searchCategories(query: string): Category[] {
    const searchSpec = new ActiveCategorySpecification()
      .and(new NameContainsSpecification(query));
    return (this.repository as InMemoryCategoryRepository).findBySpecification(searchSpec);
  }
  
  restoreCategory(id: string): boolean {
    const result = this.repository.restore(id);
    if (result) {
      this.auditLogger.logRestoration(id);
    }
    return result;
  }
  
  getCategoryStats(): CategoryStats {
    const allCategories = this.repository.findAll();
    const activeCategories = allCategories.filter(c => c.isActive);
    const categoriesWithBudget = activeCategories.filter(c => c.budget && c.budget > 0);
    const totalBudget = this.getTotalBudget();
    
    return {
      totalCategories: allCategories.length,
      activeCategories: activeCategories.length,
      inactiveCategories: allCategories.length - activeCategories.length,
      totalBudget,
      averageBudget: categoriesWithBudget.length > 0 ? totalBudget / categoriesWithBudget.length : 0,
      categoriesWithBudget: categoriesWithBudget.length,
      categoriesWithoutBudget: activeCategories.length - categoriesWithBudget.length
    };
  }
  
  findCategoriesByColor(color: string): Category[] {
    const colorSpec = new ActiveCategorySpecification().and(new ColorSpecification(color));
    return (this.repository as InMemoryCategoryRepository).findBySpecification(colorSpec);
  }
  
  private initializeDefaultCategories(): void {
    const defaultCategories = this.factory.createDefaultCategories();
    defaultCategories.forEach(category => {
      this.repository.save(category);
    });
  }
}