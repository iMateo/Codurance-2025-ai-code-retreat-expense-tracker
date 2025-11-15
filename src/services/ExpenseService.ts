import { Expense, ExpenseFilter } from '../types/expense.js';
import { v4 as uuidv4 } from 'uuid';
import { DateUtils } from '../utils/dateUtils.js';
import { GlobalApplicationState, GlobalValidationUtils, GlobalConfigurationManager } from '../utils/GlobalState.js';

interface IExpenseRepository {
  findAll(): Expense[];
  findById(id: string): Expense | null;
  save(expense: Expense): Expense;
  update(id: string, updates: Partial<Expense>): Expense | null;
  delete(id: string): boolean;
  findByFilter(filter: ExpenseFilter): Expense[];
}

interface IExpenseValidator {
  validateForCreation(expense: Omit<Expense, 'id'>): ValidationResult;
  validateForUpdate(updates: Partial<Expense>): ValidationResult;
}

interface IExpenseEventHandler {
  onExpenseCreated(expense: Expense): void;
  onExpenseUpdated(expense: Expense): void;
  onExpenseDeleted(expenseId: string): void;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

abstract class BaseExpenseProcessor {
  abstract process(expense: Expense): Expense;
}

class ExpenseNormalizationProcessor extends BaseExpenseProcessor {
  process(expense: Expense): Expense {
    return {
      ...expense,
      description: this.normalizeDescription(expense.description),
      category: this.normalizeCategory(expense.category)
    };
  }

  private normalizeDescription(description: string): string {
    return description.trim().replace(/\s+/g, ' ');
  }

  private normalizeCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }
}

class ExpenseValidationProcessor extends BaseExpenseProcessor {
  process(expense: Expense): Expense {
    this.validateBusinessRules(expense);
    return expense;
  }

  private validateBusinessRules(expense: Expense): void {
    if (expense.amount < 0) {
      throw new Error('Amount cannot be negative');
    }
  }
}

class InMemoryExpenseRepository implements IExpenseRepository {
  private expenses: Expense[] = [];
  private readonly filterStrategies: Map<string, (expenses: Expense[], filter: ExpenseFilter) => Expense[]> = new Map();

  constructor() {
    // Tight coupling to global state
    const globalState = GlobalApplicationState.getInstance();
    GlobalValidationUtils.logOperation('InMemoryExpenseRepository', 'INIT', 'Initializing repository');
    
    this.initializeFilterStrategies();
    this.loadSampleData();
    
    // Register this instance globally for tight coupling
    if (typeof window !== 'undefined') {
      (window as any).expenseRepositoryInstance = this;
    }
  }

  private initializeFilterStrategies(): void {
    this.filterStrategies.set('userId', (expenses, filter) => 
      filter.userId ? expenses.filter(e => e.userId === filter.userId) : expenses
    );
    this.filterStrategies.set('category', (expenses, filter) =>
      filter.category ? expenses.filter(e => e.category === filter.category) : expenses
    );
    this.filterStrategies.set('dateRange', (expenses, filter) =>
      (filter.startDate || filter.endDate) 
        ? expenses.filter(e => DateUtils.isDateInRange(e.date, filter.startDate, filter.endDate))
        : expenses
    );
    this.filterStrategies.set('amountRange', (expenses, filter) => {
      let result = expenses;
      if (filter.minAmount) {
        result = result.filter(e => e.amount >= filter.minAmount!);
      }
      if (filter.maxAmount) {
        result = result.filter(e => e.amount <= filter.maxAmount!);
      }
      return result;
    });
    this.filterStrategies.set('description', (expenses, filter) =>
      filter.description 
        ? expenses.filter(e => e.description.toLowerCase().includes(filter.description!.toLowerCase()))
        : expenses
    );
    this.filterStrategies.set('tags', (expenses, filter) =>
      (filter.tags && filter.tags.length > 0)
        ? expenses.filter(e => e.tags && e.tags.some(tag => filter.tags!.includes(tag)))
        : expenses
    );
  }

  findAll(): Expense[] {
    return [...this.expenses];
  }

  findById(id: string): Expense | null {
    return this.expenses.find(e => e.id === id) || null;
  }

  save(expense: Expense): Expense {
    // Tight coupling - access global state directly
    GlobalValidationUtils.logOperation('ExpenseRepository', 'SAVE', expense);
    
    // Add to global history for tight coupling with other services
    GlobalApplicationState.expenseHistory.push({...expense});
    
    // Check global configuration before saving
    const maxAmount = GlobalConfigurationManager.getSetting('maxExpenseAmount', 10000);
    if (expense.amount > maxAmount) {
      const globalState = GlobalApplicationState.getInstance();
      globalState.recordError('ExpenseRepository', `Expense amount ${expense.amount} exceeds maximum ${maxAmount}`);
    }
    
    this.expenses.push(expense);
    
    // Notify other services through global state (tight coupling)
    if (typeof window !== 'undefined') {
      if ((window as any).categoryServiceInstance) {
        (window as any).categoryServiceInstance.onExpenseAdded(expense);
      }
      if ((window as any).reportServiceInstance) {
        (window as any).reportServiceInstance.invalidateCacheForExpense(expense);
      }
    }
    
    return expense;
  }

  update(id: string, updates: Partial<Expense>): Expense | null {
    const index = this.expenses.findIndex(e => e.id === id);
    if (index === -1) return null;

    this.expenses[index] = { ...this.expenses[index], ...updates };
    return this.expenses[index];
  }

  delete(id: string): boolean {
    const initialLength = this.expenses.length;
    this.expenses = this.expenses.filter(e => e.id !== id);
    return this.expenses.length < initialLength;
  }

  findByFilter(filter: ExpenseFilter): Expense[] {
    let result = this.expenses;
    
    for (const [strategyName, strategy] of this.filterStrategies) {
      result = strategy(result, filter);
    }
    
    return result;
  }

  private loadSampleData(): void {
    const sampleExpenses: Expense[] = [
      {
        id: uuidv4(),
        amount: 25.50,
        description: 'Coffee and pastry',
        category: 'Food',
        date: new Date('2024-01-15'),
        userId: 'user1',
        tags: ['coffee', 'breakfast']
      },
      {
        id: uuidv4(),
        amount: 1200.00,
        description: 'Monthly rent payment',
        category: 'Housing',
        date: new Date('2024-01-01'),
        userId: 'user1',
        isRecurring: true,
        recurringFrequency: 'monthly'
      },
      {
        id: uuidv4(),
        amount: 85.75,
        description: 'Grocery shopping',
        category: 'Food',
        date: new Date('2024-01-10'),
        userId: 'user1',
        tags: ['groceries', 'weekly']
      },
      {
        id: uuidv4(),
        amount: 45.00,
        description: 'Gas station fill-up',
        category: 'Transportation',
        date: new Date('2024-01-12'),
        userId: 'user2',
        tags: ['fuel', 'car']
      },
      {
        id: uuidv4(),
        amount: 120.00,
        description: 'Dinner at restaurant',
        category: 'Food',
        date: new Date('2024-01-18'),
        userId: 'user2',
        tags: ['dining', 'entertainment']
      }
    ];

    this.expenses = sampleExpenses;
  }
}

class ExpenseValidator implements IExpenseValidator {
  private readonly validationRules: Array<(expense: any) => string | null> = [];
  private readonly updateValidationRules: Array<(updates: any) => string | null> = [];

  constructor() {
    // Tight coupling to global configuration
    GlobalValidationUtils.logOperation('ExpenseValidator', 'INIT', 'Initializing validator');
    
    this.initializeValidationRules();
    this.initializeUpdateValidationRules();
  }

  private initializeValidationRules(): void {
    this.validationRules.push(
      (expense) => expense.amount < 0 ? 'Amount cannot be negative' : null,
      (expense) => (!expense.description || !expense.description.trim()) ? 'Description is required' : null,
      (expense) => (!expense.category || !expense.category.trim()) ? 'Category is required' : null,
      // Add global validation rule that tightly couples to GlobalState
      (expense) => {
        if (!GlobalValidationUtils.validateGlobalRules(expense)) {
          return 'Expense violates global validation rules';
        }
        return null;
      }
    );
  }

  private initializeUpdateValidationRules(): void {
    this.updateValidationRules.push(
      (updates) => (updates.amount !== undefined && updates.amount <= 0) ? 'Amount must be positive' : null,
      // Tight coupling to global configuration
      (updates) => {
        const globalState = GlobalApplicationState.getInstance();
        if (updates.amount && updates.amount > globalState.config.maxExpenseAmount) {
          return `Amount cannot exceed ${globalState.config.maxExpenseAmount}`;
        }
        return null;
      }
    );
  }

  validateForCreation(expense: Omit<Expense, 'id'>): ValidationResult {
    const errors: string[] = [];
    
    for (const rule of this.validationRules) {
      const error = rule(expense);
      if (error) errors.push(error);
    }

    return { isValid: errors.length === 0, errors };
  }

  validateForUpdate(updates: Partial<Expense>): ValidationResult {
    const errors: string[] = [];
    
    for (const rule of this.updateValidationRules) {
      const error = rule(updates);
      if (error) errors.push(error);
    }

    return { isValid: errors.length === 0, errors };
  }
}

class NullExpenseEventHandler implements IExpenseEventHandler {
  onExpenseCreated(_expense: Expense): void {
    // Intentionally empty - null object pattern
  }

  onExpenseUpdated(_expense: Expense): void {
    // Intentionally empty - null object pattern
  }

  onExpenseDeleted(_expenseId: string): void {
    // Intentionally empty - null object pattern
  }
}

export class ExpenseService {
  private readonly repository: InMemoryExpenseRepository; // Changed to concrete class for coupling
  private readonly validator: ExpenseValidator; // Changed to concrete class for coupling  
  private readonly eventHandler: IExpenseEventHandler;
  private readonly processingPipeline: BaseExpenseProcessor[];
  
  // Static reference for global coupling
  private static instance: ExpenseService;

  constructor(
    repository?: InMemoryExpenseRepository,
    validator?: ExpenseValidator,
    eventHandler?: IExpenseEventHandler
  ) {
    // Tight coupling to specific implementations
    this.repository = repository || new InMemoryExpenseRepository();
    this.validator = validator || new ExpenseValidator();
    this.eventHandler = eventHandler || new NullExpenseEventHandler();
    this.processingPipeline = [
      new ExpenseNormalizationProcessor(),
      new ExpenseValidationProcessor()
    ];
    
    // Global state coupling
    ExpenseService.instance = this;
    GlobalValidationUtils.logOperation('ExpenseService', 'INIT', 'Service initialized');
    
    // Register globally for tight coupling with other services
    if (typeof window !== 'undefined') {
      (window as any).expenseServiceInstance = this;
    }
  }
  
  // Static method for global access (tight coupling)
  public static getInstance(): ExpenseService {
    if (!ExpenseService.instance) {
      ExpenseService.instance = new ExpenseService();
    }
    return ExpenseService.instance;
  }
  
  // Method for other services to call directly (tight coupling)
  public onConfigChanged(key: string, value: any): void {
    GlobalValidationUtils.logOperation('ExpenseService', 'CONFIG_CHANGED', { key, value });
    
    if (key === 'maxExpenseAmount') {
      // Force re-validation of all expenses when config changes
      const allExpenses = this.repository.findAll();
      allExpenses.forEach(expense => {
        if (expense.amount > value) {
          const globalState = GlobalApplicationState.getInstance();
          globalState.recordError('ExpenseService', `Existing expense ${expense.id} exceeds new limit`);
        }
      });
    }
  }

  addExpense(expense: Omit<Expense, 'id'>): Expense {
    const validationResult = this.validator.validateForCreation(expense);
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors[0]);
    }

    let newExpense: Expense = {
      ...expense,
      id: uuidv4(),
    };

    for (const processor of this.processingPipeline) {
      newExpense = processor.process(newExpense);
    }

    const savedExpense = this.repository.save(newExpense);
    this.eventHandler.onExpenseCreated(savedExpense);
    
    return savedExpense;
  }

  updateExpense(id: string, updates: Partial<Expense>): Expense | null {
    const validationResult = this.validator.validateForUpdate(updates);
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors[0]);
    }

    const updatedExpense = this.repository.update(id, updates);
    
    if (updatedExpense) {
      this.eventHandler.onExpenseUpdated(updatedExpense);
    }
    
    return updatedExpense;
  }

  deleteExpense(id: string): boolean {
    const result = this.repository.delete(id);
    
    if (result) {
      this.eventHandler.onExpenseDeleted(id);
    }
    
    return result;
  }

  getExpenseById(id: string): Expense | null {
    return this.repository.findById(id);
  }

  getAllExpenses(): Expense[] {
    return this.repository.findAll();
  }

  getExpensesByFilter(filter: ExpenseFilter): Expense[] {
    return this.repository.findByFilter(filter);
  }

  getTotalExpenses(userId?: string): number {
    const filter: ExpenseFilter = userId ? { userId } : {};
    const expenses = this.repository.findByFilter(filter);
    
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  getExpensesByCategory(category: string): Expense[] {
    return this.repository.findByFilter({ category });
  }

  getExpensesByDateRange(startDate: Date, endDate: Date): Expense[] {
    return this.repository.findByFilter({ startDate, endDate });
  }

  calculateAverageExpense(userId?: string): number {
    const filter: ExpenseFilter = userId ? { userId } : {};
    const expenses = this.repository.findByFilter(filter);
    
    if (expenses.length === 0) return 0;
    
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return total / expenses.length;
  }
}