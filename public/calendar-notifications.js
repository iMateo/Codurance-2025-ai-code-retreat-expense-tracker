// Calendar functionality
let currentCalendarDate = new Date();

function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    // Update month display
    document.getElementById('currentMonth').textContent =
        new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    // Get all expenses
    const allExpenses = window.expenseService.getAllExpenses();

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayElement = createCalendarDay(year, month - 1, day, allExpenses, true);
        calendarDays.appendChild(dayElement);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createCalendarDay(year, month, day, allExpenses, false);
        calendarDays.appendChild(dayElement);
    }

    // Next month days
    const remainingDays = 42 - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
        const dayElement = createCalendarDay(year, month + 1, day, allExpenses, true);
        calendarDays.appendChild(dayElement);
    }
}

function createCalendarDay(year, month, day, allExpenses, isOtherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';

    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }

    const date = new Date(year, month, day);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
    }

    // Filter expenses for this day
    const dayExpenses = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === year &&
               expenseDate.getMonth() === month &&
               expenseDate.getDate() === day;
    });

    const totalAmount = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Add expense level class
    if (totalAmount > 0) {
        if (totalAmount < 50) {
            dayElement.classList.add('expense-low');
        } else if (totalAmount < 200) {
            dayElement.classList.add('expense-medium');
        } else {
            dayElement.classList.add('expense-high');
        }
    }

    const expenseCountText = dayExpenses.length === 1 ? '1 expense' : dayExpenses.length + ' expenses';

    dayElement.innerHTML = `
        <div class="calendar-day-number">${day}</div>
        ${dayExpenses.length > 0 ? `
            <div class="calendar-day-expenses">${expenseCountText}</div>
            <div class="calendar-day-total">$${totalAmount.toFixed(2)}</div>
        ` : ''}
    `;

    // Add click handler to show expenses for this day
    if (dayExpenses.length > 0) {
        dayElement.onclick = () => showDayExpenses(date, dayExpenses);
    }

    return dayElement;
}

function showDayExpenses(date, expenses) {
    const modalBody = document.getElementById('modalBody');

    const expenseRows = expenses.map(expense => {
        const desc = document.createElement('div');
        desc.textContent = expense.description;
        return `
            <div style="display: flex; justify-content: space-between; padding: 10px; margin-bottom: 10px; background: #f8f9fa; border-radius: 5px;">
                <div>
                    <strong>${desc.innerHTML}</strong><br>
                    <small>${expense.category}</small>
                </div>
                <strong class="amount-positive">$${expense.amount.toFixed(2)}</strong>
            </div>
        `;
    }).join('');

    modalBody.innerHTML = `
        <h2>Expenses for ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
        <div style="margin-top: 20px;">
            ${expenseRows}
            <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #e0e0e0;">
                <strong>Total: $${expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</strong>
            </div>
        </div>
    `;

    document.getElementById('modal').style.display = 'block';
}

// Notification System
class NotificationManager {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <div class="notification-icon">${icons[type]}</div>
            <div class="notification-content">
                <div class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="notification-message">${message}</div>
            </div>
            <span class="notification-close" onclick="this.parentElement.remove()">×</span>
        `;

        this.container.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => {
                notification.remove();
            }, duration);
        }

        return notification;
    }

    success(message) {
        return this.show(message, 'success');
    }

    warning(message) {
        return this.show(message, 'warning');
    }

    error(message) {
        return this.show(message, 'error');
    }

    info(message) {
        return this.show(message, 'info');
    }
}

const notifications = new NotificationManager();

// Budget Alert System
function checkBudgetAlerts() {
    const categories = window.categoryService.getAllCategories();
    const categoriesWithBudget = categories.filter(cat => cat.budget && cat.budget > 0);

    categoriesWithBudget.forEach(category => {
        const spent = window.calculateCategorySpent(category.name);
        const utilization = (spent / category.budget) * 100;

        if (utilization >= 100) {
            notifications.error(`Budget exceeded for ${category.name}! Spent: $${spent.toFixed(2)} / Budget: $${category.budget.toFixed(2)}`);
        } else if (utilization >= 90) {
            notifications.warning(`90% of budget used for ${category.name}. Remaining: $${(category.budget - spent).toFixed(2)}`);
        } else if (utilization >= 75) {
            notifications.info(`75% of budget used for ${category.name}. Remaining: $${(category.budget - spent).toFixed(2)}`);
        }
    });
}

// Make notification functions available globally
window.showNotification = (message, type) => notifications.show(message, type);
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.renderCalendar = renderCalendar;
window.checkBudgetAlerts = checkBudgetAlerts;
window.notifications = notifications;
