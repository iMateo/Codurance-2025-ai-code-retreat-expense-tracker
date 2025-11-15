import { ExpenseService } from './services/ExpenseService.js';
import { CategoryService } from './services/CategoryService.js';
import { ReportService } from './services/ReportService.js';
import { ExpenseUI } from './ui/ExpenseUI.js';

export class ExpenseTracker {
  private expenseService: ExpenseService;
  private categoryService: CategoryService;
  private reportService: ReportService;
  private ui: ExpenseUI;

  constructor() {
    this.expenseService = new ExpenseService();
    this.categoryService = new CategoryService();
    this.reportService = new ReportService(this.expenseService, this.categoryService);
    this.ui = new ExpenseUI(this.expenseService, this.categoryService);
  }

  getExpenseService(): ExpenseService {
    return this.expenseService;
  }

  getCategoryService(): CategoryService {
    return this.categoryService;
  }

  getReportService(): ReportService {
    return this.reportService;
  }

  getUI(): ExpenseUI {
    return this.ui;
  }

  displayWelcomeMessage(): void {
    console.log('🎯 Welcome to the Legacy Expense Tracker!');
    console.log('This system has some known issues that need fixing...');
    console.log('Current expenses:', this.expenseService.getAllExpenses().length);
    console.log('Available categories:', this.categoryService.getAllCategories().length);
  }

  start(): void {
    this.displayWelcomeMessage();
    this.ui.displayAllExpenses();
    this.ui.displayCategories();
  }
}

const tracker = new ExpenseTracker();
tracker.start();

export { ExpenseService, CategoryService, ReportService };
export * from './types/expense.js';
export * from './utils/dateUtils.js';