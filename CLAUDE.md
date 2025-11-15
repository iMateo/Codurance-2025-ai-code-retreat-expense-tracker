# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Legacy Expense Tracker application for an AI Code Retreat Challenge. It's a TypeScript-based expense tracking system with intentional bugs, technical debt, and design issues that need to be addressed. The project simulates a real-world legacy codebase scenario.

**Important**: This codebase contains intentional failing tests and bugs. Some tests are expected to fail initially - this is by design to simulate legacy code scenarios.

## Common Development Commands

```bash
# Install dependencies
npm install

# Run the application in development mode (console output)
npm run dev

# Run tests (expect some failures initially - this is intentional)
npm test

# Run tests with coverage
npm test:coverage

# Build the project (compiles TypeScript to dist/)
npm run build

# Lint the code
npm lint

# Run the web application (builds and starts server on port 3000)
npm run web

# Alternative: serve the application
npm run serve
```

### TypeScript & ESM Configuration

This project uses **ES Modules (ESM)** with TypeScript:
- `package.json` has `"type": "module"` set
- TypeScript target is ES2020 with ES2020 modules
- ts-node is configured with ESM support via `--loader ts-node/esm`
- tsconfig.json includes `ts-node.esm: true` for proper ESM handling

## Architecture Overview

### Service Layer Architecture

The application uses a three-tier service architecture with **intentional tight coupling** (this is technical debt to be fixed):

1. **ExpenseService** (`src/services/ExpenseService.ts`)
   - Manages CRUD operations for expenses
   - Uses InMemoryExpenseRepository for storage
   - Implements processing pipeline with normalization and validation
   - Contains validation bugs (zero amount handling, inconsistent validation)
   - Tightly coupled to GlobalApplicationState

2. **CategoryService** (`src/services/CategoryService.ts`)
   - Manages expense categories with soft-delete support
   - Uses Command pattern for operations (CreateCategoryCommand, UpdateCategoryCommand)
   - Implements Specification pattern for category filtering
   - Uses Builder pattern for category creation
   - Contains soft delete bugs and cascade delete issues
   - Has validation inconsistencies

3. **ReportService** (`src/services/ReportService.ts`)
   - Generates expense reports and analytics
   - Implements Strategy pattern for different report types
   - Uses caching mechanism (AdvancedReportCache with TTL)
   - Contains performance issues (inefficient loops, polling global state)
   - Implements statistical calculations (median, std deviation, percentiles)

### Global State Anti-Pattern

**Critical**: The codebase uses `GlobalApplicationState` (`src/utils/GlobalState.ts`) which creates tight coupling between all services. This is intentional technical debt:

- Services communicate via global state and window objects
- Configuration changes propagate through global notifications
- Services poll global state for changes (bad practice)
- Static singleton instances are accessible globally

### Key Design Patterns (Some Problematic)

- **Repository Pattern**: In-memory repositories for data storage
- **Strategy Pattern**: Report generation strategies
- **Specification Pattern**: Category filtering
- **Command Pattern**: Category operations
- **Builder Pattern**: Category construction
- **Singleton Pattern**: Global service instances (creates tight coupling - needs refactoring)
- **Null Object Pattern**: NullExpenseEventHandler, NullCategoryAuditLogger

### Data Flow

```
ExpenseUI → ExpenseService → InMemoryExpenseRepository → GlobalApplicationState
                ↓                                              ↓
         CategoryService ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
                ↓
         ReportService (polls global state every 5 seconds)
```

## Known Issues to Fix

### ExpenseService Bugs
- **Zero amount validation**: Currently rejects zero amounts, but should allow them for refunds
- **Inconsistent validation**: Different rules between `addExpense` and `updateExpense`
- **Missing required field validation**: Empty descriptions and categories not properly validated
- **Memory leaks**: Expense history stored in global state without bounds

### CategoryService Bugs
- **Soft delete inconsistencies**: Implementation has edge cases
- **Missing cascade delete**: Expenses not handled when category is deleted
- **Duplicate name handling**: Issues with soft-deleted categories

### ReportService Performance Issues
- **Inefficient calculations**: Redundant loops and data processing
- **Cache invalidation**: Too aggressive, clears entire cache unnecessarily
- **Polling anti-pattern**: Checks global state every 5 seconds (setInterval in `setupGlobalConfigurationWatching`)
- **Division by zero**: Budget calculations don't handle edge cases

## Testing

- Test framework: Jest with ts-jest
- Test files: `src/**/__tests__/*.test.ts`
- Coverage configured for all TypeScript files except tests and index.ts
- **Expected behavior**: Some tests will fail initially - use these as a roadmap for bug fixes

### Running Specific Tests

```bash
# Run specific test file
npm test -- ExpenseService.test.ts

# Run tests in watch mode
npm test -- --watch

# Run with verbose output
npm test -- --verbose
```

## Code Quality Notes

### TypeScript Configuration
- Strict mode enabled
- ES2020 target with ESM modules
- Source maps and declaration files generated
- Output directory: `dist/`

### Tight Coupling Issues to Address

When refactoring, be aware of:
- Services depend on concrete implementations rather than interfaces
- Global state accessed directly throughout the codebase
- Window object used for cross-service communication
- Singleton pattern creates hidden dependencies
- Services instantiate their dependencies rather than using dependency injection

### Validation Flow

Validation happens at multiple levels:
1. **ExpenseValidator**: Validates individual expense fields
2. **GlobalValidationUtils**: Applies global rules (forbidden words, length constraints)
3. **Processing Pipeline**: ExpenseNormalizationProcessor → ExpenseValidationProcessor

Category validation uses a strategy-based approach with `validationStrategies` Map.

## Web Interface

The application includes a simple web server (`server.js`) that:
- Serves static files from `public/` directory
- Serves compiled JavaScript from `dist/` directory
- Runs on port 3000 (configurable via PORT env variable)
- Supports CORS for development

UI currently has limitations:
- Static interface (minimal interactivity)
- No dynamic expense display
- No form for adding expenses
- No report generation UI

## Project Goals

This is a code retreat challenge focused on:
1. Fixing existing bugs while maintaining backward compatibility
2. Adding new features (search, budget alerts, import/export)
3. Improving code quality and test coverage (target: 80%)
4. Refactoring tight coupling and global state dependencies
5. Implementing proper error handling

## Important Implementation Notes

- The codebase intentionally uses anti-patterns for educational purposes
- When fixing bugs, ensure tests pass but don't break existing functionality
- Consider the evaluation criteria: functionality, code quality, testing, performance, error handling
- The global state pattern should eventually be refactored but understand it first
