// Import the compiled TypeScript modules
import { ExpenseTracker } from '../dist/index.js';

// Initialize the expense tracker
const tracker = new ExpenseTracker();
const expenseService = tracker.getExpenseService();
const categoryService = tracker.getCategoryService();
const reportService = tracker.getReportService();

// Make services available globally for calendar and notifications
window.expenseService = expenseService;
window.categoryService = categoryService;
window.reportService = reportService;

// Global state
let currentExpenses = [];
let currentCategories = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadExpenses();
    loadCategories();
    populateCategoryDropdowns();
    setupEventListeners();
    
    // Set today's date as default
    document.getElementById('date').valueAsDate = new Date();
}

function setupEventListeners() {
    // Add expense form
    document.getElementById('addExpenseForm').addEventListener('submit', handleAddExpense);
}

// Tab functionality
function showTab(tabName, buttonElement) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show selected tab
    const tabContent = document.getElementById(tabName);
    if (tabContent) {
        tabContent.classList.add('active');
    }

    // Add active class to the clicked button
    if (buttonElement) {
        buttonElement.classList.add('active');
    }

    // Refresh data when switching tabs
    switch(tabName) {
        case 'expenses':
            loadExpenses();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'reports':
            loadReports();
            break;
        case 'calendar':
            if (window.renderCalendar) {
                window.renderCalendar();
            }
            break;
    }
}

// Make showTab available globally immediately
window.showTab = showTab;

// Load and display expenses
function loadExpenses() {
    try {
        currentExpenses = expenseService.getAllExpenses();
        displayExpenses(currentExpenses);
        updateExpenseSummary(currentExpenses);
    } catch (error) {
        console.error('Error loading expenses:', error);
        showError('Failed to load expenses');
    }
}

function displayExpenses(expenses) {
    const tbody = document.getElementById('expenseTableBody');
    
    if (expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No expenses found</td></tr>';
        return;
    }
    
    tbody.innerHTML = expenses.map(expense => `
        <tr>
            <td>${escapeHtml(expense.description)}</td>
            <td class="amount-positive">$${expense.amount.toFixed(2)}</td>
            <td><span class="category-badge category-${expense.category.toLowerCase()}">${escapeHtml(expense.category)}</span></td>
            <td>${formatDate(expense.date)}</td>
            <td>${escapeHtml(expense.userId)}</td>
            <td>
                <button class="btn btn-small btn-secondary" onclick="editExpense('${expense.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteExpense('${expense.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function updateExpenseSummary(expenses) {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const count = expenses.length;
    const average = count > 0 ? total / count : 0;
    
    const summaryContainer = document.getElementById('expenseSummary');
    summaryContainer.innerHTML = `
        <div class="summary-card">
            <h3>Total Expenses</h3>
            <div class="value">${count}</div>
        </div>
        <div class="summary-card">
            <h3>Total Amount</h3>
            <div class="value">$${total.toFixed(2)}</div>
        </div>
        <div class="summary-card">
            <h3>Average</h3>
            <div class="value">$${average.toFixed(2)}</div>
        </div>
    `;
}

// Load and display categories
function loadCategories() {
    try {
        currentCategories = categoryService.getAllCategories();
        displayCategories(currentCategories);
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Failed to load categories');
    }
}

function displayCategories(categories) {
    const tbody = document.getElementById('categoryTableBody');
    
    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No categories found</td></tr>';
        return;
    }
    
    tbody.innerHTML = categories.map(category => {
        const spent = calculateCategorySpent(category.name);
        const remaining = category.budget ? category.budget - spent : 'No limit';
        const budget = category.budget ? `$${category.budget.toFixed(2)}` : 'No limit';
        
        return `
            <tr>
                <td>${escapeHtml(category.name)}</td>
                <td>${budget}</td>
                <td class="amount-positive">$${spent.toFixed(2)}</td>
                <td>${typeof remaining === 'number' ? `$${remaining.toFixed(2)}` : remaining}</td>
                <td>${category.isActive ? '✅ Active' : '❌ Inactive'}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="editCategory('${category.id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteCategory('${category.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function calculateCategorySpent(categoryName) {
    return currentExpenses
        .filter(expense => expense.category === categoryName)
        .reduce((sum, expense) => sum + expense.amount, 0);
}

// Make it available globally
window.calculateCategorySpent = calculateCategorySpent;

// Populate category dropdowns
function populateCategoryDropdowns() {
    const categorySelect = document.getElementById('category');
    const categoryFilter = document.getElementById('categoryFilter');
    
    const activeCategories = currentCategories.filter(cat => cat.isActive);
    
    // Clear existing options (except the first one)
    categorySelect.innerHTML = '<option value="">Select a category</option>';
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    activeCategories.forEach(category => {
        const option1 = new Option(category.name, category.name);
        const option2 = new Option(category.name, category.name);
        categorySelect.appendChild(option1);
        categoryFilter.appendChild(option2);
    });
}

// Handle add expense form submission
function handleAddExpense(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const expenseData = {
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        date: new Date(formData.get('date')),
        userId: formData.get('userId')
    };
    
    try {
        expenseService.addExpense(expenseData);
        showSuccess('Expense added successfully!');
        event.target.reset();
        document.getElementById('date').valueAsDate = new Date(); // Reset to today
        loadExpenses(); // Refresh the expense list

        // Check budget alerts after adding expense
        if (window.checkBudgetAlerts) {
            setTimeout(() => window.checkBudgetAlerts(), 500);
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        showError(`Failed to add expense: ${error.message}`);
    }
}

// Filter expenses
function filterExpenses() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filteredExpenses = [...currentExpenses];
    
    if (categoryFilter) {
        filteredExpenses = filteredExpenses.filter(expense => 
            expense.category === categoryFilter
        );
    }
    
    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filteredExpenses = filteredExpenses.filter(expense => 
            expense.date.toDateString() === filterDate.toDateString()
        );
    }
    
    displayExpenses(filteredExpenses);
    updateExpenseSummary(filteredExpenses);
}

function clearFilters() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('dateFilter').value = '';
    displayExpenses(currentExpenses);
    updateExpenseSummary(currentExpenses);
}

// Delete expense
function deleteExpense(expenseId) {
    if (confirm('Are you sure you want to delete this expense?')) {
        try {
            expenseService.deleteExpense(expenseId);
            showSuccess('Expense deleted successfully!');
            loadExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
            showError('Failed to delete expense');
        }
    }
}

// Edit expense (placeholder)
function editExpense(expenseId) {
    const expense = expenseService.getExpenseById(expenseId);
    if (expense) {
        // For now, just show the expense details
        alert(`Edit expense: ${expense.description} - $${expense.amount}`);
        // TODO: Implement edit modal
    }
}

// Category management
function editCategory(categoryId) {
    alert('Edit category functionality not implemented yet');
    // TODO: Implement edit category modal
}

function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category?')) {
        alert('Delete category functionality not implemented yet');
        // TODO: Implement category deletion
    }
}

function showAddCategoryForm() {
    alert('Add category functionality not implemented yet');
    // TODO: Implement add category modal
}

// Load reports
function loadReports() {
    try {
        const report = reportService.generateReport();
        displayReports(report);
    } catch (error) {
        console.error('Error loading reports:', error);
        showError('Failed to load reports');
    }
}

function displayReports(report) {
    // Monthly Summary
    document.getElementById('monthlySummary').innerHTML = `
        <p><strong>Total Amount:</strong> $${report.totalAmount.toFixed(2)}</p>
        <p><strong>Expense Count:</strong> ${report.expenseCount}</p>
        <p><strong>Average Expense:</strong> $${report.averageExpense.toFixed(2)}</p>
    `;
    
    // Category Breakdown
    const categoryBreakdown = Object.entries(report.categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .map(([category, amount]) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>${category}</span>
                <strong>$${amount.toFixed(2)}</strong>
            </div>
        `).join('');
    
    document.getElementById('categoryBreakdown').innerHTML = categoryBreakdown;
    
    // Recent Activity
    const recentExpenses = currentExpenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    const recentActivity = recentExpenses.map(expense => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            <div>
                <strong>${expense.description}</strong><br>
                <small>${expense.category} • ${formatDate(expense.date)}</small>
            </div>
            <strong class="amount-positive">$${expense.amount.toFixed(2)}</strong>
        </div>
    `).join('');
    
    document.getElementById('recentActivity').innerHTML = recentActivity || '<p>No recent activity</p>';
}

// Modal functionality
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Utility functions
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSuccess(message) {
    if (window.notifications) {
        window.notifications.success(message);
    } else {
        alert(`✅ ${message}`);
    }
}

function showError(message) {
    if (window.notifications) {
        window.notifications.error(message);
    } else {
        alert(`❌ ${message}`);
    }
}

// Make functions available globally for onclick handlers
window.filterExpenses = filterExpenses;
window.clearFilters = clearFilters;
window.deleteExpense = deleteExpense;
window.editExpense = editExpense;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.showAddCategoryForm = showAddCategoryForm;
window.closeModal = closeModal;