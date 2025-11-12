# Legacy Expense Tracker - AI Code Retreat Challenge
Congratulations, you have just joined the engineering team at ExpenseCo. 
Welcome to the Legacy Expense Tracker codebase!
The team could really do with your help! This TypeScript application is an expense tracking system that has accumulated technical debt over time and contains several known issues that need to be addressed.

## Challenge Overview

Your mission is to improve this legacy codebase by adding new features while fixing existing bugs and improving code quality.

## Current System State

### What's Working ✅
- Basic expense creation, updating, and deletion
- Category management with default categories
- Simple reporting functionality
- Basic filtering of expenses
- Initial UI scaffolding 
- TypeScript compilation

### Known Issues 🐛

The codebase contains several bugs and design problems:

1. **ExpenseService Issues:**
   - Zero amount validation bug (should allow zero amounts for refunds)
   - Missing validation for required fields
   - Memory leaks in expense storage

2. **CategoryService Problems:**
   - Inconsistent soft delete implementation
   - Missing cascade delete for expenses when category is deleted

3. **ReportService Performance Issues:**
   - Inefficient loops and calculations
   - Redundant data processing

4. **General Code Quality Issues:**
   - Inconsistent coding patterns
   - Lack of proper validation
   - Limited test coverage

5. **User Interface:**
   - The User Interface is currently static
   - No support for displaying expenses
   - No support for adding expenses
   - No support for running reports   

There will be bugs or code issues you will encounter not covered in the list above, so you'll have to keep your wits about you!    

## Setup Instructions

```bash
# Install dependencies
npm install

# Run tests (NOTE: Some tests will fail initially - this is intentional!)
npm test

# Run with coverage
npm test:coverage

# Build the project
npm run build

# Run the application
npm run web
```

## ⚠️ Important: Some Tests Will Fail Initially!

This codebase contains **intentional failing tests** that reveal some of the bugs you need to fix. This gives you a clear starting point while simulating real legacy code scenarios. There are other bugs in this codebase also that are not currently covered by any tests.

### Test Status After Setup:
- ✅ **Basic tests pass** - Core functionality works
- ❌ **Bug tests fail** - These reveal issues to fix (marked with 🐛 comments)
- ❌ **Validation tests fail** - Missing validation logic

### Getting Started:
1. Run `npm test` to see which tests fail
2. Use failing tests as your roadmap for bugs to fix
3. Each failing test describes the expected behavior vs. current buggy behavior

## Challenge Tasks


**Task 1: Make all the failing tests pass**

1. **ExpenseService Validation Issues:**
   - Fix inconsistent amount validation between `addExpense` and `updateExpense`
   - Add missing validation for empty descriptions and categories
   - Allow zero amounts for refunds

2. **CategoryService Issues:**
   - Fix soft delete logic inconsistencies  
   - Add proper validation for category names and budgets
   - Handle duplicate names with soft-deleted categories

3. **ReportService Performance Issues:**
   - Implement proper caching mechanism
   - Fix division by zero in budget calculations
   - Handle edge cases gracefully

**Task 2: Implement the following functionality:**

#### Functioning User Interface
- Allow expense retrieval
- Add support for adding new expenses
- Add support for running reports


#### Advanced Expense Search
- Implement fuzzy search for expense descriptions
- Add search by multiple tags
- Create saved search functionality
- Add search result ranking/sorting

#### Budget Alerts System
- Create budget threshold alerts (75%, 90%, 100%)
- Implement notification system for budget overruns
- Add projected spending calculations
- Create budget adjustment recommendations

#### Expense Import/Export
- Add CSV import functionality for bulk expense creation
- Implement data validation for imported expenses
- Create CSV/JSON export functionality
- Add support for different date formats

**Task 3: Code Quality Improvements:**

#### Implement the following code improvements

1. Refactor the ReportService for better performance
2. Improve test coverage to at least 80%
3. Add proper TypeScript strict mode compliance
4. Implement better error handling and validation

## Evaluation Criteria

Your solutions will be evaluated on:
- **Functionality**: Does the code work as expected?
- **Code Quality**: Is the code clean, readable, and maintainable?
- **Testing**: Are there adequate tests with good coverage?
- **Performance**: Are there any performance improvements?
- **Error Handling**: How well does the code handle edge cases?


## Getting Started

1. **Explore the codebase** - Start by running the existing tests and understanding the current structure
2. **Identify the bugs** - Run the application and try different scenarios to find issues
3. **Plan your approach** - Decide which bugs to fix first and how to approach the feature implementation
4. **Test as you go** - Write tests for your fixes and new features

## Deliverables

At the end of the session, be prepared to:
1. Demonstrate your working solution
2. Explain your approach and decisions
3. Discuss any tradeoffs you made
4. Share what you learned about working with/without AI assistance

Good luck, and happy coding! 🚀

---

*This challenge is designed to simulate real-world legacy code scenarios where you need to understand, fix, and extend existing systems while maintaining backward compatibility.*