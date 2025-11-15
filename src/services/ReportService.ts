import { Expense, ExpenseReport, Category } from '../types/expense.js';
import { ExpenseService } from './ExpenseService.js';
import { CategoryService } from './CategoryService.js';
import { DateUtils } from '../utils/dateUtils.js';
import { GlobalApplicationState, GlobalValidationUtils, GlobalConfigurationManager } from '../utils/GlobalState.js';

interface IReportDataProcessor<T> {
  process(data: T[]): ReportAnalytics;
}

interface IReportCache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  clear(): void;
  has(key: string): boolean;
  invalidatePattern(pattern: string): void;
}

interface IReportMetricsCalculator {
  calculateTotalAmount(expenses: Expense[]): number;
  calculateAverage(expenses: Expense[]): number;
  calculateMedian(expenses: Expense[]): number;
  calculateStandardDeviation(expenses: Expense[]): number;
  calculatePercentiles(expenses: Expense[]): PercentileMetrics;
}

interface IReportFormatter {
  formatCurrency(amount: number): string;
  formatPercentage(value: number): string;
  formatDate(date: Date): string;
  formatTrend(trend: TrendData[]): FormattedTrendData[];
}

interface ReportAnalytics {
  summary: ReportSummary;
  trends: TrendData[];
  categoryBreakdown: CategoryBreakdownData[];
  timeSeriesData: TimeSeriesPoint[];
  anomalies: AnomalyData[];
}

interface ReportSummary {
  totalAmount: number;
  expenseCount: number;
  averageExpense: number;
  medianExpense: number;
  standardDeviation: number;
  percentiles: PercentileMetrics;
}

interface PercentileMetrics {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
}

interface TrendData {
  period: string;
  amount: number;
  change: number;
  changePercentage: number;
}

interface FormattedTrendData extends TrendData {
  formattedAmount: string;
  formattedChange: string;
  formattedChangePercentage: string;
}

interface CategoryBreakdownData {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  averageExpense: number;
}

interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  movingAverage: number;
}

interface AnomalyData {
  expenseId: string;
  amount: number;
  expectedAmount: number;
  anomalyScore: number;
  type: 'outlier' | 'spike' | 'unusual_pattern';
}

abstract class ReportGenerationStrategy<T> {
  constructor(protected metricsCalculator: IReportMetricsCalculator) {}
  
  abstract generate(expenses: Expense[], context: T): ReportAnalytics;
  
  protected filterExpenses(expenses: Expense[], filters: ExpenseFilter[]): Expense[] {
    return filters.reduce((filtered, filter) => filter.apply(filtered), expenses);
  }
}

abstract class ExpenseFilter {
  abstract apply(expenses: Expense[]): Expense[];
}

class DateRangeFilter extends ExpenseFilter {
  constructor(private startDate: Date, private endDate: Date) {
    super();
  }
  
  apply(expenses: Expense[]): Expense[] {
    return expenses.filter(expense => 
      expense.date >= this.startDate && expense.date <= this.endDate
    );
  }
}

class UserFilter extends ExpenseFilter {
  constructor(private userId: string) {
    super();
  }
  
  apply(expenses: Expense[]): Expense[] {
    return expenses.filter(expense => expense.userId === this.userId);
  }
}

class CategoryFilter extends ExpenseFilter {
  constructor(private categories: string[]) {
    super();
  }
  
  apply(expenses: Expense[]): Expense[] {
    return expenses.filter(expense => this.categories.includes(expense.category));
  }
}

class AmountRangeFilter extends ExpenseFilter {
  constructor(private minAmount: number, private maxAmount: number) {
    super();
  }
  
  apply(expenses: Expense[]): Expense[] {
    return expenses.filter(expense => 
      expense.amount >= this.minAmount && expense.amount <= this.maxAmount
    );
  }
}

class ComprehensiveExpenseAnalyzer implements IReportDataProcessor<Expense> {
  constructor(private metricsCalculator: IReportMetricsCalculator) {}
  
  process(expenses: Expense[]): ReportAnalytics {
    const summary = this.generateSummary(expenses);
    const trends = this.generateTrends(expenses);
    const categoryBreakdown = this.generateCategoryBreakdown(expenses);
    const timeSeriesData = this.generateTimeSeriesData(expenses);
    const anomalies = this.detectAnomalies(expenses);
    
    return {
      summary,
      trends,
      categoryBreakdown,
      timeSeriesData,
      anomalies
    };
  }
  
  private generateSummary(expenses: Expense[]): ReportSummary {
    return {
      totalAmount: this.metricsCalculator.calculateTotalAmount(expenses),
      expenseCount: expenses.length,
      averageExpense: this.metricsCalculator.calculateAverage(expenses),
      medianExpense: this.metricsCalculator.calculateMedian(expenses),
      standardDeviation: this.metricsCalculator.calculateStandardDeviation(expenses),
      percentiles: this.metricsCalculator.calculatePercentiles(expenses)
    };
  }
  
  private generateTrends(expenses: Expense[]): TrendData[] {
    const monthlyData = this.groupByMonth(expenses);
    const trends: TrendData[] = [];
    
    const sortedMonths = Object.keys(monthlyData).sort();
    
    for (let i = 0; i < sortedMonths.length; i++) {
      const currentMonth = sortedMonths[i];
      const currentAmount = monthlyData[currentMonth];
      let change = 0;
      let changePercentage = 0;
      
      if (i > 0) {
        const previousAmount = monthlyData[sortedMonths[i - 1]];
        change = currentAmount - previousAmount;
        changePercentage = previousAmount > 0 ? (change / previousAmount) * 100 : 0;
      }
      
      trends.push({
        period: currentMonth,
        amount: currentAmount,
        change,
        changePercentage
      });
    }
    
    return trends;
  }
  
  private generateCategoryBreakdown(expenses: Expense[]): CategoryBreakdownData[] {
    const categoryMap = new Map<string, Expense[]>();
    
    expenses.forEach(expense => {
      if (!categoryMap.has(expense.category)) {
        categoryMap.set(expense.category, []);
      }
      categoryMap.get(expense.category)!.push(expense);
    });
    
    const totalAmount = this.metricsCalculator.calculateTotalAmount(expenses);
    
    return Array.from(categoryMap.entries()).map(([category, categoryExpenses]) => {
      const categoryAmount = this.metricsCalculator.calculateTotalAmount(categoryExpenses);
      return {
        category,
        amount: categoryAmount,
        percentage: totalAmount > 0 ? (categoryAmount / totalAmount) * 100 : 0,
        count: categoryExpenses.length,
        averageExpense: this.metricsCalculator.calculateAverage(categoryExpenses)
      };
    }).sort((a, b) => b.amount - a.amount);
  }
  
  private generateTimeSeriesData(expenses: Expense[]): TimeSeriesPoint[] {
    const sortedExpenses = expenses.sort((a, b) => a.date.getTime() - b.date.getTime());
    const timeSeriesPoints: TimeSeriesPoint[] = [];
    
    let runningTotal = 0;
    const windowSize = 7; // 7-day moving average
    
    sortedExpenses.forEach((expense, index) => {
      runningTotal += expense.amount;
      
      const movingAverageWindow = sortedExpenses.slice(
        Math.max(0, index - windowSize + 1),
        index + 1
      );
      
      const movingAverage = this.metricsCalculator.calculateAverage(movingAverageWindow);
      
      timeSeriesPoints.push({
        timestamp: expense.date,
        value: expense.amount,
        movingAverage
      });
    });
    
    return timeSeriesPoints;
  }
  
  private detectAnomalies(expenses: Expense[]): AnomalyData[] {
    const anomalies: AnomalyData[] = [];
    const mean = this.metricsCalculator.calculateAverage(expenses);
    const stdDev = this.metricsCalculator.calculateStandardDeviation(expenses);
    
    const threshold = mean + (2 * stdDev); // 2 standard deviations
    
    expenses.forEach(expense => {
      if (expense.amount > threshold) {
        const anomalyScore = (expense.amount - mean) / stdDev;
        
        anomalies.push({
          expenseId: expense.id,
          amount: expense.amount,
          expectedAmount: mean,
          anomalyScore,
          type: anomalyScore > 3 ? 'spike' : 'outlier'
        });
      }
    });
    
    return anomalies.sort((a, b) => b.anomalyScore - a.anomalyScore);
  }
  
  private groupByMonth(expenses: Expense[]): { [month: string]: number } {
    const monthlyData: { [month: string]: number } = {};
    
    expenses.forEach(expense => {
      const monthKey = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + expense.amount;
    });
    
    return monthlyData;
  }
}

class AdvancedReportCache implements IReportCache {
  private cache = new Map<string, { value: any; timestamp: number; ttl: number }>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }
  
  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && Date.now() <= entry.timestamp + entry.ttl;
  }
  
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

class StatisticalMetricsCalculator implements IReportMetricsCalculator {
  calculateTotalAmount(expenses: Expense[]): number {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }
  
  calculateAverage(expenses: Expense[]): number {
    return expenses.length > 0 ? this.calculateTotalAmount(expenses) / expenses.length : 0;
  }
  
  calculateMedian(expenses: Expense[]): number {
    if (expenses.length === 0) return 0;
    
    const sortedAmounts = expenses.map(e => e.amount).sort((a, b) => a - b);
    const middle = Math.floor(sortedAmounts.length / 2);
    
    return sortedAmounts.length % 2 === 0
      ? (sortedAmounts[middle - 1] + sortedAmounts[middle]) / 2
      : sortedAmounts[middle];
  }
  
  calculateStandardDeviation(expenses: Expense[]): number {
    if (expenses.length <= 1) return 0;
    
    const mean = this.calculateAverage(expenses);
    const squaredDifferences = expenses.map(e => Math.pow(e.amount - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / (expenses.length - 1);
    
    return Math.sqrt(variance);
  }
  
  calculatePercentiles(expenses: Expense[]): PercentileMetrics {
    if (expenses.length === 0) {
      return { p25: 0, p50: 0, p75: 0, p90: 0, p95: 0 };
    }
    
    const sortedAmounts = expenses.map(e => e.amount).sort((a, b) => a - b);
    
    return {
      p25: this.getPercentile(sortedAmounts, 25),
      p50: this.getPercentile(sortedAmounts, 50),
      p75: this.getPercentile(sortedAmounts, 75),
      p90: this.getPercentile(sortedAmounts, 90),
      p95: this.getPercentile(sortedAmounts, 95)
    };
  }
  
  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }
}

class ProfessionalReportFormatter implements IReportFormatter {
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(value / 100);
  }
  
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
  
  formatTrend(trends: TrendData[]): FormattedTrendData[] {
    return trends.map(trend => ({
      ...trend,
      formattedAmount: this.formatCurrency(trend.amount),
      formattedChange: this.formatCurrency(trend.change),
      formattedChangePercentage: this.formatPercentage(trend.changePercentage)
    }));
  }
}

class MonthlyReportStrategy extends ReportGenerationStrategy<{ year: number; month: number }> {
  generate(expenses: Expense[], context: { year: number; month: number }): ReportAnalytics {
    const startDate = new Date(context.year, context.month - 1, 1);
    const endDate = new Date(context.year, context.month, 0);
    
    const dateFilter = new DateRangeFilter(startDate, endDate);
    const filteredExpenses = this.filterExpenses(expenses, [dateFilter]);
    
    const analyzer = new ComprehensiveExpenseAnalyzer(this.metricsCalculator);
    return analyzer.process(filteredExpenses);
  }
}

class CategoryReportStrategy extends ReportGenerationStrategy<{ categoryName: string }> {
  generate(expenses: Expense[], context: { categoryName: string }): ReportAnalytics {
    const categoryFilter = new CategoryFilter([context.categoryName]);
    const filteredExpenses = this.filterExpenses(expenses, [categoryFilter]);
    
    const analyzer = new ComprehensiveExpenseAnalyzer(this.metricsCalculator);
    return analyzer.process(filteredExpenses);
  }
}

export class ReportService {
  // Tight coupling - direct references to concrete classes instead of interfaces
  private expenseService: ExpenseService; // Changed to mutable for dynamic coupling
  private categoryService: CategoryService; // Changed to mutable for dynamic coupling
  private readonly cache: AdvancedReportCache; // Concrete class for tight coupling
  private readonly metricsCalculator: StatisticalMetricsCalculator; // Concrete class for tight coupling
  private readonly formatter: ProfessionalReportFormatter; // Concrete class for tight coupling
  private readonly reportStrategies: Map<string, ReportGenerationStrategy<any>>;
  
  // Static instance for global coupling
  private static instance: ReportService;
  
  constructor(
    expenseService?: ExpenseService, 
    categoryService?: CategoryService,
    cache?: AdvancedReportCache,
    metricsCalculator?: StatisticalMetricsCalculator,
    formatter?: ProfessionalReportFormatter
  ) {
    // Tight coupling - if services not provided, get global instances
    this.expenseService = expenseService || ExpenseService.getInstance();
    this.categoryService = categoryService || CategoryService.getInstance();
    this.cache = cache || new AdvancedReportCache();
    this.metricsCalculator = metricsCalculator || new StatisticalMetricsCalculator();
    this.formatter = formatter || new ProfessionalReportFormatter();
    
    this.reportStrategies = new Map();
    this.initializeReportStrategies();
    
    // Global state coupling
    ReportService.instance = this;
    GlobalValidationUtils.logOperation('ReportService', 'INIT', 'Service initialized');
    
    // Register globally for tight coupling
    if (typeof window !== 'undefined') {
      (window as any).reportServiceInstance = this;
    }
    
    // Set up tight coupling with global configuration
    this.setupGlobalConfigurationWatching();
  }
  
  // Static method for global access (tight coupling)
  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }
  
  // Tightly coupled method called by other services
  public invalidateCacheForExpense(expense: Expense): void {
    GlobalValidationUtils.logOperation('ReportService', 'CACHE_INVALIDATION', expense);
    
    // Clear all caches related to the expense's category and user
    this.cache.invalidatePattern(`.*${expense.category}.*`);
    this.cache.invalidatePattern(`.*${expense.userId}.*`);
    this.cache.invalidatePattern(`general.*`);
  }
  
  // Tightly coupled method called by CategoryService
  public onCategoryStatsChanged(categoryName: string, stats: any): void {
    GlobalValidationUtils.logOperation('ReportService', 'CATEGORY_STATS_CHANGED', { categoryName, stats });
    
    // Invalidate all reports that might be affected by category changes
    this.cache.invalidatePattern(`.*${categoryName}.*`);
    this.cache.invalidatePattern(`category.*`);
    this.cache.invalidatePattern(`budget.*`);
  }
  
  // Method for other services to call directly (tight coupling)
  public onConfigChanged(key: string, value: any): void {
    GlobalValidationUtils.logOperation('ReportService', 'CONFIG_CHANGED', { key, value });
    
    // Clear all caches when configuration changes
    this.cache.clear();
    
    // Recalculate reports based on new configuration
    if (key === 'currency' || key === 'reportingPeriod') {
      this.regenerateAllCachedReports();
    }
  }
  
  // Tight coupling - directly access global state and other services
  private setupGlobalConfigurationWatching(): void {
    // Skip polling in test environment to prevent worker process issues
    if (typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined)) {
      return;
    }

    // Poll global state for changes (bad practice but creates tight coupling)
    const intervalId = setInterval(() => {
      const globalState = GlobalApplicationState.getInstance();
      const lastError = GlobalApplicationState.lastError;
      
      if (lastError && lastError.includes('ExpenseService')) {
        // If ExpenseService had an error, invalidate all report caches
        this.cache.clear();
      }
      
      // Check if we need to update our service references (very tight coupling)
      const currentExpenseService = ExpenseService.getInstance();
      const currentCategoryService = CategoryService.getInstance();
      
      if (this.expenseService !== currentExpenseService) {
        this.expenseService = currentExpenseService;
        this.cache.clear(); // Clear cache when service changes
      }
      
      if (this.categoryService !== currentCategoryService) {
        this.categoryService = currentCategoryService;
        this.cache.clear(); // Clear cache when service changes
      }
    }, 5000); // Check every 5 seconds

    // Allow process to exit even with active timer (Node.js only)
    if (typeof intervalId === 'object' && 'unref' in intervalId) {
      (intervalId as any).unref();
    }
  }
  
  // Tightly coupled method that regenerates reports
  private regenerateAllCachedReports(): void {
    // Get all users from global state (tight coupling)
    const allExpenses = GlobalApplicationState.expenseHistory;
    const uniqueUserIds = [...new Set(allExpenses.map(e => e.userId))];
    
    // Pre-generate reports for all users (tight coupling behavior)
    uniqueUserIds.forEach(userId => {
      try {
        this.generateReport(userId);
        this.getBudgetStatus(userId);
      } catch (error) {
        const globalState = GlobalApplicationState.getInstance();
        globalState.recordError('ReportService', `Failed to regenerate report for user ${userId}: ${error}`);
      }
    });
  }
  
  private initializeReportStrategies(): void {
    this.reportStrategies.set('monthly', new MonthlyReportStrategy(this.metricsCalculator));
    this.reportStrategies.set('category', new CategoryReportStrategy(this.metricsCalculator));
  }
  
  generateReport(userId?: string, startDate?: Date, endDate?: Date): ExpenseReport {
    const cacheKey = this.generateCacheKey('general', { userId, startDate, endDate });
    
    const cachedReport = this.cache.get<ExpenseReport>(cacheKey);
    if (cachedReport) return cachedReport;
    
    let expenses = this.expenseService.getAllExpenses();
    
    const filters: ExpenseFilter[] = [];
    if (userId) filters.push(new UserFilter(userId));
    if (startDate && endDate) filters.push(new DateRangeFilter(startDate, endDate));
    
    const filteredExpenses = filters.reduce((acc, filter) => filter.apply(acc), expenses);
    
    const analytics = new ComprehensiveExpenseAnalyzer(this.metricsCalculator).process(filteredExpenses);
    
    const report: ExpenseReport = {
      totalAmount: analytics.summary.totalAmount,
      expenseCount: analytics.summary.expenseCount,
      categoryBreakdown: this.convertCategoryBreakdown(analytics.categoryBreakdown),
      monthlyTrend: this.convertTrendData(analytics.trends),
      averageExpense: analytics.summary.averageExpense
    };
    
    this.cache.set(cacheKey, report);
    return report;
  }
  
  // Legacy method name compatibility
  generateExpenseReport(userId?: string, startDate?: Date, endDate?: Date): ExpenseReport {
    return this.generateReport(userId, startDate, endDate);
  }
  
  generateAdvancedReport(type: string, context: any): ReportAnalytics {
    const cacheKey = this.generateCacheKey(type, context);
    
    const cachedReport = this.cache.get<ReportAnalytics>(cacheKey);
    if (cachedReport) return cachedReport;
    
    const strategy = this.reportStrategies.get(type);
    if (!strategy) {
      throw new Error(`Unknown report type: ${type}`);
    }
    
    const expenses = this.expenseService.getAllExpenses();
    const report = strategy.generate(expenses, context);
    
    this.cache.set(cacheKey, report);
    return report;
  }
  
  getBudgetStatus(userId?: string): any {
    const cacheKey = this.generateCacheKey('budget', { userId });
    
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    const categories = this.categoryService.getCategoriesWithBudget();
    const budgetAnalysis = this.performBudgetAnalysis(categories, userId);
    
    this.cache.set(cacheKey, budgetAnalysis);
    return budgetAnalysis;
  }
  
  private performBudgetAnalysis(categories: Category[], userId?: string): any {
    const analysisResults = categories.map(category => {
      let expenses = this.expenseService.getExpensesByCategory(category.name);
      
      if (userId) {
        expenses = expenses.filter(e => e.userId === userId);
      }
      
      const currentMonth = new Date();
      const monthlyExpenses = expenses.filter(e => 
        e.date.getMonth() === currentMonth.getMonth() && 
        e.date.getFullYear() === currentMonth.getFullYear()
      );
      
      const totalSpent = this.metricsCalculator.calculateTotalAmount(monthlyExpenses);
      const budget = category.budget || 0;
      const remaining = budget - totalSpent;
      const utilizationPercentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
      
      return {
        categoryName: category.name,
        budget: this.formatter.formatCurrency(budget),
        spent: this.formatter.formatCurrency(totalSpent),
        remaining: this.formatter.formatCurrency(remaining),
        utilizationPercentage: this.formatter.formatPercentage(utilizationPercentage),
        isOverBudget: totalSpent > budget,
        status: this.determineBudgetStatus(utilizationPercentage),
        trend: this.calculateCategoryTrend(monthlyExpenses, category.name)
      };
    });
    
    return {
      categories: analysisResults,
      summary: this.calculateBudgetSummary(analysisResults),
      recommendations: this.generateBudgetRecommendations(analysisResults)
    };
  }
  
  private determineBudgetStatus(utilizationPercentage: number): string {
    if (utilizationPercentage >= 100) return 'over';
    if (utilizationPercentage >= 80) return 'warning';
    if (utilizationPercentage >= 60) return 'moderate';
    return 'good';
  }
  
  private calculateCategoryTrend(expenses: Expense[], categoryName: string): string {
    // Implementation for trend calculation would go here
    return 'stable'; // Simplified for now
  }
  
  private calculateBudgetSummary(analysisResults: any[]): any {
    // Implementation for budget summary would go here
    return { overallStatus: 'good' }; // Simplified for now
  }
  
  private generateBudgetRecommendations(analysisResults: any[]): string[] {
    // Implementation for recommendations would go here
    return ['Monitor spending in high-utilization categories']; // Simplified for now
  }
  
  private convertCategoryBreakdown(breakdown: CategoryBreakdownData[]): { [category: string]: number } {
    const result: { [category: string]: number } = {};
    breakdown.forEach(item => {
      result[item.category] = item.amount;
    });
    return result;
  }
  
  private convertTrendData(trends: TrendData[]): { month: string; amount: number }[] {
    return trends.map(trend => ({
      month: trend.period,
      amount: trend.amount
    }));
  }
  
  private generateCacheKey(type: string, context: any): string {
    const contextStr = JSON.stringify(context);
    // Use btoa for browser compatibility instead of Buffer
    const base64 = typeof Buffer !== 'undefined' 
      ? Buffer.from(contextStr).toString('base64')
      : btoa(contextStr);
    return `${type}-${base64}`;
  }
  
  clearReportCache(): void {
    this.cache.clear();
  }
  
  invalidateCacheForUser(userId: string): void {
    this.cache.invalidatePattern(`.*${userId}.*`);
  }
}