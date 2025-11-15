# Team Message - AI Code Retreat Challenge

Hi Team! 👋

We're participating in the **AI Code Retreat Challenge** using a legacy expense tracker codebase. Here's what you need to know:

## Quick Start

### 1️⃣ Get the Code
```bash
git clone git@github.com:iMateo/Codurance-2025-ai-code-retreat-expense-tracker.git
cd Codurance-2025-ai-code-retreat-expense-tracker
npm install
```

### 2️⃣ Verify Setup
```bash
npm run build    # Should compile successfully
npm test         # EXPECTED: Some tests will fail (this is intentional!)
npm run dev      # Should run and display expense data
```

### 3️⃣ Read the Docs
- **TEAM_WORKFLOW.md** - Our collaboration workflow and PR process
- **CLAUDE.md** - Architecture, known bugs, and technical details
- **README.md** - Challenge requirements and evaluation criteria

## Important Notes

⚠️ **This codebase has intentional bugs!** Some tests will fail initially - that's the challenge!

📖 **Read CLAUDE.md first** - It explains the architecture and lists all known issues.

🔧 **ESM Setup Fixed** - The `npm run dev` command now works correctly with ES modules.

## The Plan

1. **Work together** using feature branches
2. **Fix bugs** and **implement features** from the challenge
3. **Merge to main** when features are complete and reviewed
4. **Create PR** when ready to submit the challenge solution

## Main Tasks (from README)

**Task 1: Fix All Failing Tests** ✅
- ExpenseService validation bugs
- CategoryService soft delete issues
- ReportService performance problems

**Task 2: Implement New Features** 🚀
- Functioning user interface
- Advanced expense search
- Budget alerts system
- Import/Export functionality

**Task 3: Code Quality** 🎯
- Refactor for better performance
- Increase test coverage to 80%+
- Improve error handling

## Collaboration

📢 **Announce what you're working on** to avoid duplicates

🔄 **Use feature branches**: `fix/bug-name` or `feature/feature-name`

👀 **Review each other's code** before merging

💬 **Ask questions** if something's unclear

## Useful Commands

```bash
npm run dev              # Run in console mode
npm run web              # Start web server (port 3000)
npm test                 # Run tests
npm test:coverage        # Check test coverage
npm test -- <filename>   # Run specific test
```

## Need Help?

1. Check **CLAUDE.md** for architecture details
2. Look at failing tests - they show what needs fixing
3. Review **TEAM_WORKFLOW.md** for detailed process
4. Ask the team!

Let's build something great together! 🚀

---

**Repository**: https://github.com/iMateo/Codurance-2025-ai-code-retreat-expense-tracker
**Goal**: Fix bugs, implement features, and improve code quality!
