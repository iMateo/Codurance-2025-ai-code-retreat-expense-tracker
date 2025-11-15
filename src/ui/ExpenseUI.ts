import { Expense } from '../types/expense.js';
import { ExpenseService } from '../services/ExpenseService.js';
import { CategoryService } from '../services/CategoryService.js';

export class ExpenseUI {
  private expenseService: ExpenseService;
  private categoryService: CategoryService;

  constructor(expenseService: ExpenseService, categoryService: CategoryService) {
    this.expenseService = expenseService;
    this.categoryService = categoryService;
  }

  displayAllExpenses(): void {
    const expenses = this.expenseService.getAllExpenses();
    
    if (expenses.length === 0) {
      console.log('\n📊 No expenses found.');
      return;
    }

    console.log('\n📊 EXPENSE TRACKER - ALL EXPENSES');
    console.log('=' .repeat(80));
    
    this.displayExpenseTable(expenses);
    this.displaySummary(expenses);
  }

  private displayExpenseTable(expenses: Expense[]): void {
    console.log('');
    console.log('ID'.padEnd(8) + 
                'Description'.padEnd(20) + 
                'Amount'.padEnd(10) + 
                'Category'.padEnd(15) + 
                'Date'.padEnd(12) + 
                'User'.padEnd(10));
    console.log('-'.repeat(80));

    expenses.forEach(expense => {
      const formattedAmount = `$${expense.amount.toFixed(2)}`;
      const formattedDate = expense.date.toLocaleDateString();
      
      console.log(
        expense.id.substring(0, 7).padEnd(8) +
        expense.description.substring(0, 19).padEnd(20) +
        formattedAmount.padEnd(10) +
        expense.category.substring(0, 14).padEnd(15) +
        formattedDate.padEnd(12) +
        expense.userId.substring(0, 9).padEnd(10)
      );
    });
  }

  private displaySummary(expenses: Expense[]): void {
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryTotals = this.calculateCategoryTotals(expenses);
    
    console.log('\n📈 SUMMARY');
    console.log('-'.repeat(40));
    console.log(`Total Expenses: ${expenses.length}`);
    console.log(`Total Amount: $${totalAmount.toFixed(2)}`);
    console.log(`Average Expense: $${(totalAmount / expenses.length).toFixed(2)}`);
    
    console.log('\n💰 BY CATEGORY');
    console.log('-'.repeat(40));
    Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, amount]) => {
        console.log(`${category.padEnd(20)} $${amount.toFixed(2)}`);
      });
  }

  private calculateCategoryTotals(expenses: Expense[]): { [category: string]: number } {
    return expenses.reduce((totals, expense) => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
      return totals;
    }, {} as { [category: string]: number });
  }

  displayExpensesByCategory(category: string): void {
    const expenses = this.expenseService.getAllExpenses()
      .filter(expense => expense.category.toLowerCase() === category.toLowerCase());
    
    if (expenses.length === 0) {
      console.log(`\n📊 No expenses found for category: ${category}`);
      return;
    }

    console.log(`\n📊 EXPENSES - ${category.toUpperCase()} CATEGORY`);
    console.log('=' .repeat(80));
    
    this.displayExpenseTable(expenses);
  }

  displayRecentExpenses(days: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentExpenses = this.expenseService.getAllExpenses()
      .filter(expense => expense.date >= cutoffDate)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    if (recentExpenses.length === 0) {
      console.log(`\n📊 No expenses found in the last ${days} days.`);
      return;
    }

    console.log(`\n📊 RECENT EXPENSES (Last ${days} days)`);
    console.log('=' .repeat(80));
    
    this.displayExpenseTable(recentExpenses);
  }

  displayMainMenu(): void {
    console.log('\n🏠 EXPENSE TRACKER MENU');
    console.log('=' .repeat(40));
    console.log('1. View All Expenses');
    console.log('2. View Recent Expenses (7 days)');
    console.log('3. View by Category');
    console.log('4. View Categories');
    console.log('5. Exit');
    console.log('-'.repeat(40));
  }

  displayCategories(): void {
    const categories = this.categoryService.getAllCategories();
    
    console.log('\n📁 AVAILABLE CATEGORIES');
    console.log('=' .repeat(60));
    
    if (categories.length === 0) {
      console.log('No categories found.');
      return;
    }

    console.log('Name'.padEnd(20) + 'Budget'.padEnd(15) + 'Active'.padEnd(10) + 'Description');
    console.log('-'.repeat(60));

    categories.forEach(category => {
      const budget = category.budget ? `$${category.budget.toFixed(2)}` : 'No limit';
      const status = category.isActive ? 'Yes' : 'No';
      const description = category.description || 'No description';
      
      console.log(
        category.name.substring(0, 19).padEnd(20) +
        budget.padEnd(15) +
        status.padEnd(10) +
        description.substring(0, 25)
      );
    });
  }
}