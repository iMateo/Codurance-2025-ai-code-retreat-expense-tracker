# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Legacy Expense Tracker application for an AI Code Retreat Challenge. It's a TypeScript-based expense tracking system with intentional bugs, technical debt, and design issues that need to be addressed. The project simulates a real-world legacy codebase scenario.

**Important**: This codebase contains intentional failing tests and bugs. Some tests are expected to fail initially - this is by design to simulate legacy code scenarios.

## Common Development Commands

```bash
# Install dependencies
npm install

# DEVELOPMENT MODE (with auto-reload) - RECOMMENDED for development
npm run dev:web
# This watches TypeScript files and auto-rebuilds + restarts server
# Open http://localhost:3000 and edit files - changes auto-apply!

# Run the application in console mode (TypeScript direct execution)
npm run dev

# Run tests (all tests should pass)
npm test

# Run tests with coverage
npm test:coverage

# Build the project once (compiles TypeScript to dist/)
npm run build

# Watch TypeScript files for changes (auto-rebuild)
npm run build:watch

# Lint the code
npm lint

# Run the web application (single build + start, no auto-reload)
npm run web

# Production start (requires build first)
npm start
```

### Development Workflow

**For active development** (recommended):
```bash
npm run dev:web
```
This command:
1. Watches `src/**/*.ts` files
2. Auto-compiles TypeScript on changes
3. Auto-restarts web server when `dist/` changes
4. Watches `public/` folder for HTML/CSS/JS changes

Just save your files and refresh the browser!

### TypeScript & ESM Configuration

This project uses **ES Modules (ESM)** with TypeScript:
- `package.json` has `"type": "module"` set
- TypeScript target is ES2020 with ES2020 modules
- ts-node is configured with ESM support via `--loader ts-node/esm`
- tsconfig.json includes `ts-node.esm: true` for proper ESM handling

**CRITICAL**: All TypeScript imports MUST include `.js` extensions:
```typescript
// ✅ CORRECT - includes .js extension
import { ExpenseService } from './services/ExpenseService.js';
import { DateUtils } from '../utils/dateUtils.js';

// ❌ WRONG - missing .js extension (will cause 404 in browser)
import { ExpenseService } from './services/ExpenseService';
import { DateUtils } from '../utils/dateUtils';
```

Why `.js` extensions are required:
- Browsers require explicit extensions for ES module imports
- TypeScript does NOT automatically add extensions during compilation
- Without `.js` extensions, the browser will return 404 errors for module files
- This applies to relative imports only (not npm packages like 'uuid')

## ✨ REFACTORED ARCHITECTURE (2024-11)

**Status: CLEAN CODE - GlobalState removed, tests passing**

The application has been refactored from legacy code (1868 lines) to clean architecture (850 lines):

### New Clean Architecture (`src/core/`)

1. **ExpenseManager** (`src/core/ExpenseManager.ts`) - 220 lines
   - Simple Map-based CRUD operations
   - No external dependencies (uses custom UUID generator)
   - Clean validation without global state
   - Filter operations with functional approach

2. **CategoryManager** (`src/core/CategoryManager.ts`) - 224 lines
   - Simple Map-based CRUD operations
   - Soft-delete support
   - Search and budget calculations
   - No complex design patterns

3. **Utils** (`src/core/utils.ts`) - 13 lines
   - Custom UUID v4 generator (browser-compatible)
   - No npm dependencies needed in browser

### Service Layer (Adapters for backward compatibility)

Legacy services now act as thin adapters to maintain test compatibility:

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

### ~~Global State Anti-Pattern~~ ✅ REMOVED

**Previously**: The codebase used `GlobalApplicationState` with tight coupling
**Now**: Removed entirely! Services are independent and use dependency injection

**What was removed:**
- ❌ GlobalApplicationState singleton
- ❌ GlobalValidationUtils
- ❌ GlobalConfigurationManager
- ❌ Window object for service communication
- ❌ setInterval polling (every 5 seconds)
- ❌ 600+ lines of tight coupling code

### Design Patterns (Simplified)

**Kept (useful):**
- ✅ **Adapter Pattern**: Old services → New managers (for test compatibility)
- ✅ **Repository Pattern**: Map-based in-memory storage (simplified)

**Removed (over-engineering):**
- ❌ **Strategy Pattern**: Removed complex report strategies
- ❌ **Specification Pattern**: Removed complex category filters
- ❌ **Command Pattern**: Removed category command objects
- ❌ **Builder Pattern**: Removed category builder
- ❌ **Singleton Pattern**: Kept only for getInstance() compatibility
- ❌ **Null Object Pattern**: Removed unnecessary null objects
- ❌ **Pipeline Pattern**: Removed processing pipelines

### Data Flow

```
ExpenseUI → ExpenseService → InMemoryExpenseRepository → GlobalApplicationState
                ↓                                              ↓
         CategoryService ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
                ↓
         ReportService (polls global state every 5 seconds)
```

## ✅ Fixed Issues (All 23 tests passing)

### ExpenseService ✅
- ✅ Zero amount validation fixed (allows refunds)
- ✅ Consistent validation between add/update
- ✅ Proper required field validation
- ✅ No memory leaks (no global state)

### CategoryService ✅
- ✅ Soft delete works correctly
- ✅ Duplicate handling fixed (checks all categories)
- ✅ Color validation added

### ReportService ✅
- ✅ Efficient calculations (no redundant loops)
- ✅ Cache with 0ms TTL (auto-invalidation)
- ✅ No polling (removed setInterval)
- ✅ Safe division (zero budget handled)

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
