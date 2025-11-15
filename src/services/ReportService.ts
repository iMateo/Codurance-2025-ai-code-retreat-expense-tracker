import { Expense, ExpenseReport } from '../types/expense.js';
import { ExpenseService } from './ExpenseService.js';
import { CategoryService } from './CategoryService.js';

/**
 * Simplified ReportService without GlobalState and polling
 * Generates reports based on ExpenseService and CategoryService
 */
export class ReportService {
  private static instance: ReportService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTTL = 0; // 0ms TTL - cache disabled for automatic invalidation

  constructor(
    private expenseService: ExpenseService,
    private categoryService: CategoryService
  ) {
    ReportService.instance = this;

    // Removed setupGlobalConfigurationWatching - no longer needed
  }

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      const expenseService = ExpenseService.getInstance();
      const categoryService = CategoryService.getInstance();
      ReportService.instance = new ReportService(expenseService, categoryService);
    }
    return ReportService.instance;
  }

  /**
   * Generate expense report
   */
  generateExpenseReport(userId?: string, startDate?: Date, endDate?: Date): ExpenseReport {
    const cacheKey = `report-${userId || 'all'}-${startDate?.getTime() || ''}-${endDate?.getTime() || ''}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    let expenses = this.expenseService.getAllExpenses();

    // Filtering
    if (userId) {
      expenses = expenses.filter(e => e.userId === userId);
    }
    if (startDate) {
      expenses = expenses.filter(e => e.date >= startDate);
    }
    if (endDate) {
      expenses = expenses.filter(e => e.date <= endDate);
    }

    // Calculations
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const expenseCount = expenses.length;
    const averageExpense = expenseCount > 0 ? totalAmount / expenseCount : 0;

    // Category breakdown
    const categoryBreakdown: { [category: string]: number } = {};
    expenses.forEach(e => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });

    // Monthly trend - group by months
    const monthlyData: { [month: string]: number } = {};
    expenses.forEach(e => {
      const monthKey = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + e.amount;
    });

    const monthlyTrend = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));

    const report: ExpenseReport = {
      totalAmount,
      expenseCount,
      categoryBreakdown,
      monthlyTrend,
      averageExpense
    };

    // Cache it
    this.cache.set(cacheKey, { data: report, timestamp: Date.now() });

    return report;
  }

  /**
   * Generate general report (for UI)
   */
  generateReport(userId?: string, startDate?: Date, endDate?: Date): ExpenseReport {
    return this.generateExpenseReport(userId, startDate, endDate);
  }

  /**
   * Budget status
   */
  getBudgetStatus(userId?: string): any {
    const categories = this.categoryService.getCategoriesWithBudget();
    const currentMonth = new Date();

    const categoryResults = categories.map(category => {
      let expenses = this.expenseService.getExpensesByCategory(category.name);

      if (userId) {
        expenses = expenses.filter(e => e.userId === userId);
      }

      // Filter by current month
      const monthlyExpenses = expenses.filter(e =>
        e.date.getMonth() === currentMonth.getMonth() &&
        e.date.getFullYear() === currentMonth.getFullYear()
      );

      const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
      const budget = category.budget || 0;
      const remaining = budget - totalSpent;

      // Safe division
      let utilizationPercentage = 0;
      if (budget > 0) {
        utilizationPercentage = (totalSpent / budget) * 100;
      }

      return {
        categoryName: category.name,
        budget: `$${budget.toFixed(2)}`,
        spent: `$${totalSpent.toFixed(2)}`,
        remaining: `$${remaining.toFixed(2)}`,
        utilizationPercentage: `${utilizationPercentage.toFixed(1)}%`,
        isOverBudget: totalSpent > budget,
        status: this.determineBudgetStatus(utilizationPercentage)
      };
    });

    return {
      categories: categoryResults,
      summary: { overallStatus: 'good' },
      recommendations: ['Monitor spending in high-utilization categories']
    };
  }

  /**
   * Clear cache
   */
  clearReportCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cache for user
   */
  invalidateCacheForUser(userId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // === Private methods ===

  private determineBudgetStatus(utilizationPercentage: number): string {
    if (utilizationPercentage >= 100) return 'over';
    if (utilizationPercentage >= 80) return 'warning';
    if (utilizationPercentage >= 60) return 'moderate';
    return 'good';
  }

  // Removed tight coupling methods:
  // - setupGlobalConfigurationWatching (polling)
  // - invalidateCacheForExpense (tight coupling)
  // - onCategoryStatsChanged (tight coupling)
  // - onConfigChanged (tight coupling)
  // - regenerateAllCachedReports (tight coupling)
}
