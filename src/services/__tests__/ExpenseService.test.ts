import { ExpenseService } from '../ExpenseService';
import { Expense } from '../../types/expense';

describe('ExpenseService', () => {
  let expenseService: ExpenseService;

  beforeEach(() => {
    expenseService = new ExpenseService();
  });

  describe('addExpense', () => {
    it('should add a new expense successfully', () => {
      const expenseData = {
        amount: 50.0,
        description: 'Test expense',
        category: 'Food',
        date: new Date(),
        userId: 'user1'
      };

      const result = expenseService.addExpense(expenseData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.amount).toBe(50.0);
      expect(result.description).toBe('Test expense');
    });

    it('should throw error for negative amount', () => {
      const expenseData = {
        amount: -10.0,
        description: 'Invalid expense',
        category: 'Food',
        date: new Date(),
        userId: 'user1'
      };

      expect(() => expenseService.addExpense(expenseData)).toThrow('Amount cannot be negative');
    });
  });

  describe('getAllExpenses', () => {
    it('should return all expenses', () => {
      const expenses = expenseService.getAllExpenses();
      expect(Array.isArray(expenses)).toBe(true);
      expect(expenses.length).toBeGreaterThan(0);
    });
  });

  // 🐛 FAILING TESTS - These reveal bugs in the codebase!
  describe('updateExpense - Bug Tests', () => {
    it('should allow updating expense amount to zero for refunds', () => {
      // First create an expense
      const expense = expenseService.addExpense({
        amount: 50.0,
        description: 'Test expense',
        category: 'Food',
        date: new Date(),
        userId: 'user1'
      });

      // This should work but currently fails due to inconsistent validation
      const updatedExpense = expenseService.updateExpense(expense.id, { amount: 0 });
      
      expect(updatedExpense).not.toBeNull();
      expect(updatedExpense?.amount).toBe(0);
    });

    it('should have consistent error messages between add and update', () => {
      const expense = expenseService.addExpense({
        amount: 50.0,
        description: 'Test expense',
        category: 'Food', 
        date: new Date(),
        userId: 'user1'
      });

      // Both should throw the same error message
      expect(() => expenseService.addExpense({
        amount: -10,
        description: 'Invalid',
        category: 'Food',
        date: new Date(), 
        userId: 'user1'
      })).toThrow('Amount cannot be negative');

      // This currently throws "Amount must be positive" - inconsistent!
      expect(() => expenseService.updateExpense(expense.id, { amount: -10 }))
        .toThrow('Amount cannot be negative');
    });
  });

  describe('Validation - Missing Tests', () => {
    it('should reject expenses with empty descriptions', () => {
      expect(() => expenseService.addExpense({
        amount: 50.0,
        description: '',
        category: 'Food',
        date: new Date(),
        userId: 'user1'
      })).toThrow('Description cannot be empty');
    });

    it('should reject expenses with whitespace-only descriptions', () => {
      expect(() => expenseService.addExpense({
        amount: 50.0,
        description: '   ',
        category: 'Food', 
        date: new Date(),
        userId: 'user1'
      })).toThrow('Description cannot be empty');
    });

    it('should reject expenses with invalid categories', () => {
      expect(() => expenseService.addExpense({
        amount: 50.0,
        description: 'Test expense',
        category: '',
        date: new Date(),
        userId: 'user1'
      })).toThrow('Category cannot be empty');
    });
  });
});