import { ExpenseService } from './services/ExpenseService';
import { CategoryService } from './services/CategoryService';
import { ReportService } from './services/ReportService';
import { ExpenseUI } from './ui/ExpenseUI';

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
export * from './types/expense';
export * from './utils/dateUtils';