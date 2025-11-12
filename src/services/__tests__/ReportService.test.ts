import { ExpenseService } from '../ExpenseService';
import { CategoryService } from '../CategoryService';
import { ReportService } from '../ReportService';

describe('ReportService', () => {
  let expenseService: ExpenseService;
  let categoryService: CategoryService;
  let reportService: ReportService;

  beforeEach(() => {
    expenseService = new ExpenseService();
    categoryService = new CategoryService();
    reportService = new ReportService(expenseService, categoryService);
  });

  describe('Basic reporting', () => {
    it('should generate expense report', () => {
      const report = reportService.generateExpenseReport();
      expect(report.totalAmount).toBeGreaterThan(0);
      expect(report.expenseCount).toBeGreaterThan(0);
      expect(report.categoryBreakdown).toBeDefined();
    });
  });

  // 🐛 FAILING TESTS - These reveal performance and logic bugs!
  describe('Performance - Bug Tests', () => {
    it('should use caching for identical report requests', () => {
      const startTime = Date.now();
      
      // First call - should cache the result
      const report1 = reportService.generateExpenseReport('user1');
      const firstCallTime = Date.now() - startTime;
      
      const secondStartTime = Date.now();
      
      // Second identical call - should be much faster due to caching
      const report2 = reportService.generateExpenseReport('user1');
      const secondCallTime = Date.now() - secondStartTime;
      
      expect(report1).toEqual(report2);
      // Second call should be at least 50% faster (cached)
      expect(secondCallTime).toBeLessThan(firstCallTime * 0.5);
    });

    it('should clear cache when new expenses are added', () => {
      // Generate initial report (gets cached)
      const initialReport = reportService.generateExpenseReport();
      
      // Add new expense
      expenseService.addExpense({
        amount: 100,
        description: 'New expense',
        category: 'Food',
        date: new Date(),
        userId: 'user1'
      });
      
      // Report should reflect new data (cache should be cleared)
      const updatedReport = reportService.generateExpenseReport();
      expect(updatedReport.totalAmount).toBeGreaterThan(initialReport.totalAmount);
      expect(updatedReport.expenseCount).toBe(initialReport.expenseCount + 1);
    });
  });

  describe('Budget Status - Bug Tests', () => {
    it('should handle categories without budgets gracefully', () => {
      // Add category without budget
      categoryService.addCategory('NoBudget', 'Category without budget limit');
      
      const budgetStatus = reportService.getBudgetStatus();
      
      // Should not crash and should handle undefined budgets
      expect(budgetStatus).toBeDefined();
      expect(budgetStatus.categories).toBeDefined();
      expect(Array.isArray(budgetStatus.categories)).toBe(true);
    });

    it('should calculate budget utilization correctly for edge cases', () => {
      // Create category with zero budget
      const category = categoryService.addCategory('ZeroBudget', 'Zero budget category', '#FF0000', 0);
      
      // Add expense to zero-budget category
      expenseService.addExpense({
        amount: 50,
        description: 'Expense in zero budget category',
        category: 'ZeroBudget',
        date: new Date(),
        userId: 'user1'
      });
      
      const budgetStatus = reportService.getBudgetStatus();
      const zeroBudgetStatus = budgetStatus.categories.find(c => c.categoryName === 'ZeroBudget');
      
      // Should handle division by zero gracefully
      expect(zeroBudgetStatus?.utilizationPercentage).not.toBeNaN();
      expect(zeroBudgetStatus?.utilizationPercentage).not.toBe(Infinity);
    });
  });
});