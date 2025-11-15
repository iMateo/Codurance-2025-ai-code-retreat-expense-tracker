# Team Workflow Guide

## Repository Setup

### Main Repository
**Repo**: https://github.com/iMateo/Codurance-2025-ai-code-retreat-expense-tracker

We're working directly on this repository. All team members will collaborate here using feature branches.

## Getting Started

### First Time Setup

```bash
# Clone the repository (using SSH)
git clone git@github.com:iMateo/Codurance-2025-ai-code-retreat-expense-tracker.git
cd Codurance-2025-ai-code-retreat-expense-tracker

# Or using HTTPS
# git clone https://github.com/iMateo/Codurance-2025-ai-code-retreat-expense-tracker.git

# Install dependencies
npm install

# Verify everything works
npm run build
npm test
npm run dev
```

### Important Notes About This Codebase

⚠️ **This is a Legacy Code Challenge** - The codebase contains intentional bugs and failing tests!

- Some tests **will fail initially** - this is by design
- The code has intentional technical debt (tight coupling, global state anti-patterns)
- Your job is to fix bugs while maintaining backward compatibility

📖 **Read CLAUDE.md first** - It contains essential architecture and setup information.

## Development Workflow

### Branch Strategy

```bash
# Create feature branches for each task/bug fix
git checkout -b fix/expense-validation-bug
git checkout -b feature/budget-alerts
git checkout -b refactor/remove-global-state
```

### Working on Tasks

1. **Pick a task** from the challenge (see README.md):
   - Task 1: Fix failing tests
   - Task 2: Implement new features
   - Task 3: Code quality improvements

2. **Create a branch**:
   ```bash
   git checkout -b fix/zero-amount-validation
   ```

3. **Make your changes**:
   - Run tests frequently: `npm test`
   - Check your code: `npm run build`
   - Test in dev mode: `npm run dev`
   - Test web UI: `npm run web`

4. **Commit your work**:
   ```bash
   git add .
   git commit -m "Fix: Allow zero amounts for refunds in ExpenseService

   - Updated validation rules to permit zero amounts
   - Fixed inconsistency between addExpense and updateExpense
   - All related tests now pass"
   ```

5. **Push to our team repo**:
   ```bash
   git push origin fix/zero-amount-validation
   ```

## Testing Your Changes

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- ExpenseService.test.ts
```

### Check Test Coverage
```bash
npm test:coverage
# Target: 80% coverage
```

### Manual Testing
```bash
# Console output testing
npm run dev

# Web interface testing
npm run web
# Then open http://localhost:3000
```

## Collaboration Best Practices

### Communication
- 💬 Announce which task/bug you're working on to avoid duplicate work
- 📝 Document significant architectural decisions
- 🤝 Review each other's code before merging to main
- ❓ Ask questions if you're unsure about the intended behavior

### Code Quality Checklist
Before pushing your changes:
- [ ] All tests pass (or new tests added for bugs you found)
- [ ] Code builds without errors: `npm run build`
- [ ] Lint passes (if any errors): `npm run lint`
- [ ] You've tested manually (dev mode or web interface)
- [ ] You've documented any breaking changes
- [ ] Commit messages are clear and descriptive

## Creating the Final PR

When we're ready to submit our collective work:

### Step 1: Prepare the Feature Branch

```bash
# Create a feature branch for the final submission
git checkout -b challenge-solution

# Make sure all team changes are merged
git merge main

# Verify everything works
npm install
npm run build
npm test
npm run web
```

### Step 2: Push and Create PR

```bash
# Push the feature branch
git push origin challenge-solution
```

Then create a PR on GitHub from your feature branch to main with:

**PR Title**: "AI Code Retreat Challenge Solution - [Team Name]"

**PR Description Template**:
```markdown
## Summary
Completed AI Code Retreat Challenge with bug fixes and feature implementations.

## What We Fixed
### Task 1: Failing Tests Fixed
- [ ] ExpenseService validation issues
  - Fixed zero amount validation for refunds
  - Consistent validation between add/update operations
  - Proper required field validation
- [ ] CategoryService issues
  - Fixed soft delete inconsistencies
  - Implemented cascade delete for expenses
  - Handle duplicate names with soft-deleted categories
- [ ] ReportService performance
  - Implemented proper caching mechanism
  - Fixed division by zero in budget calculations
  - Improved calculation efficiency

### Task 2: New Features Implemented
- [ ] Functioning User Interface
  - Expense retrieval and display
  - Add new expenses form
  - Report generation
- [ ] Advanced Expense Search (if implemented)
- [ ] Budget Alerts System (if implemented)
- [ ] Expense Import/Export (if implemented)

### Task 3: Code Quality Improvements
- [ ] Refactored tight coupling issues
- [ ] Improved test coverage to XX%
- [ ] Better error handling
- [ ] Removed global state anti-patterns (if applicable)

## Testing
- All tests pass: ✅
- Test coverage: XX%
- Manual testing completed: ✅

## Breaking Changes
[List any breaking changes, or state "None"]

## Notes
[Any additional context about our approach, decisions, or tradeoffs]

## Team Members
- [Team Member 1]
- [Team Member 2]
- [Team Member 3]
```

### Step 4: After PR Submission

- Monitor the PR for review comments
- Be ready to make adjustments if requested
- Celebrate! 🎉

## Useful Commands Reference

```bash
# Development
npm run dev              # Run in console mode
npm run web              # Run web server on port 3000
npm run build            # Compile TypeScript

# Testing
npm test                 # Run all tests
npm test:coverage        # Run tests with coverage report
npm test -- <filename>   # Run specific test file

# Git
git status               # Check current changes
git log --oneline -10    # See recent commits
git diff                 # See unstaged changes
git remote -v            # Verify remote repos
git pull origin main     # Get latest from main branch
git push origin <branch> # Push your feature branch
```

## Key Files to Know

- **README.md** - Challenge description and requirements
- **CLAUDE.md** - Architecture documentation and known issues
- **src/services/** - Core business logic (where most bugs are)
- **src/types/expense.ts** - Type definitions
- **src/utils/GlobalState.ts** - Global state manager (technical debt)
- **src/**/__tests__/** - Test files

## Tips for Success

1. **Start with failing tests** - They're your roadmap for bugs to fix
2. **Read CLAUDE.md** - Understanding the architecture saves time
3. **Small commits** - Easier to review and revert if needed
4. **Test frequently** - Don't let bugs pile up
5. **Communicate** - Share knowledge and help each other
6. **Have fun!** - This is a learning experience 🚀

## Questions?

If you're stuck or unsure:
1. Check CLAUDE.md for architecture details
2. Look at the test files for expected behavior
3. Ask the team in our chat
4. Review the challenge README.md

Happy coding! 💻
