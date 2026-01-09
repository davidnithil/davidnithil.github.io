// ============================================
// ACTIVITY TRACKER - JavaScript
// ============================================

// ============================================
// DATA MANAGEMENT MODULE
// ============================================

// localStorage Keys
const STORAGE_KEYS = {
    ACTIVITIES: 'activities',
    SETTINGS: 'settings'
};

// Initialize data if not exists
function initializeData() {
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
            notificationsEnabled: false,
            reminderTime: 30 // minutes before activity
        }));
    }
}

// Save activity (new or update)
function saveActivity(activityData) {
    const activities = getActivities();
    
    if (activityData.id) {
        // Update existing activity
        const index = activities.findIndex(a => a.id === activityData.id);
        if (index !== -1) {
            activities[index] = {
                ...activities[index],
                ...activityData,
                updatedAt: Date.now()
            };
        }
    } else {
        // Create new activity
        const newActivity = {
            id: Date.now(),
            title: activityData.title,
            date: activityData.date,
            time: activityData.time || '',
            category: activityData.category,
            description: activityData.description || '',
            completed: false,
            completedAt: null,
            reminder: activityData.reminder || false,
            reminderTime: activityData.reminderTime || null,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        activities.push(newActivity);
    }
    
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    return activities;
}

// Get activities with optional filter
function getActivities(filter = {}) {
    const activities = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '[]');
    
    if (Object.keys(filter).length === 0) {
        return activities;
    }
    
    return activities.filter(activity => {
        if (filter.category && filter.category !== 'all' && activity.category !== filter.category) {
            return false;
        }
        if (filter.status) {
            if (filter.status === 'completed' && !activity.completed) return false;
            if (filter.status === 'upcoming' && activity.completed) return false;
            if (filter.status === 'upcoming') {
                const activityDate = new Date(activity.date + (activity.time ? 'T' + activity.time : ''));
                if (activityDate < new Date()) return false;
            }
        }
        if (filter.date && activity.date !== filter.date) {
            return false;
        }
        if (filter.startDate && activity.date < filter.startDate) {
            return false;
        }
        if (filter.endDate && activity.date > filter.endDate) {
            return false;
        }
        return true;
    });
}

// Delete activity
function deleteActivity(id) {
    const activities = getActivities();
    const filtered = activities.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(filtered));
    return filtered;
}

// Toggle completion status
function toggleCompletion(id) {
    const activities = getActivities();
    const activity = activities.find(a => a.id === id);
    if (activity) {
        activity.completed = !activity.completed;
        activity.completedAt = activity.completed ? Date.now() : null;
        activity.updatedAt = Date.now();
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    }
    return activities;
}

// Get activity by ID
function getActivityById(id) {
    const activities = getActivities();
    return activities.find(a => a.id === id);
}

// ============================================
// ACTIVITY FORM MODULE
// ============================================

let editMode = false;
let editingActivityId = null;

function initActivityForm() {
    const form = document.getElementById('activity-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const dateInput = document.getElementById('activity-date');
    
    if (!form) return;
    
    // Set default date to today
    if (dateInput) {
        dateInput.value = formatDate(new Date());
    }
    
    form.addEventListener('submit', handleActivitySubmit);
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetForm);
    }
}

function handleActivitySubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const activityData = {
        id: formData.get('id') ? parseInt(formData.get('id')) : null,
        title: formData.get('title'),
        date: formData.get('date'),
        time: formData.get('time'),
        category: formData.get('category'),
        description: formData.get('description'),
        reminder: formData.get('reminder') === 'on'
    };
    
    // Validation
    if (!activityData.title || !activityData.date || !activityData.category) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Calculate reminder time if reminder is enabled
    if (activityData.reminder && activityData.date && activityData.time) {
        const activityDateTime = new Date(activityData.date + 'T' + activityData.time);
        const reminderDateTime = new Date(activityDateTime.getTime() - 30 * 60000); // 30 minutes before
        activityData.reminderTime = reminderDateTime.getTime();
    }
    
    // Save activity
    saveActivity(activityData);
    
    // Show success message
    showNotification(editMode ? 'Activity updated successfully!' : 'Activity added successfully!', 'success');
    
    // Reset form and refresh displays
    resetForm();
    displayActivities();
    updateProgress();
    displayDashboard();
    
    // Update calendar if visible
    if (document.getElementById('calendar').classList.contains('active')) {
        displayCalendar();
    }
}

function resetForm() {
    const form = document.getElementById('activity-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    if (form) {
        form.reset();
        document.getElementById('activity-id').value = '';
        document.getElementById('activity-date').value = formatDate(new Date());
        editMode = false;
        editingActivityId = null;
    }
    
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (submitBtn) submitBtn.textContent = 'Add Activity';
}

function editActivity(id) {
    const activity = getActivityById(id);
    if (!activity) return;
    
    editMode = true;
    editingActivityId = id;
    
    // Populate form
    document.getElementById('activity-id').value = activity.id;
    document.getElementById('activity-title').value = activity.title;
    document.getElementById('activity-date').value = activity.date;
    document.getElementById('activity-time').value = activity.time || '';
    document.getElementById('activity-category').value = activity.category;
    document.getElementById('activity-description').value = activity.description || '';
    document.getElementById('activity-reminder').checked = activity.reminder || false;
    
    // Update UI
    document.getElementById('cancel-btn').style.display = 'inline-block';
    document.getElementById('submit-btn').textContent = 'Update Activity';
    
    // Scroll to form
    document.getElementById('activity-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// DISPLAY MODULE
// ============================================

function displayActivities() {
    const container = document.getElementById('activities-list');
    if (!container) return;
    
    const categoryFilter = document.getElementById('filter-category')?.value || 'all';
    const statusFilter = document.getElementById('filter-status')?.value || 'all';
    const dateFilter = document.getElementById('filter-date')?.value || '';
    
    const filter = {
        category: categoryFilter,
        status: statusFilter,
        date: dateFilter || null
    };
    
    const activities = getActivities(filter);
    
    // Sort: upcoming first, then by date
    activities.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        const dateA = new Date(a.date + (a.time ? 'T' + a.time : ''));
        const dateB = new Date(b.date + (b.time ? 'T' + b.time : ''));
        return dateA - dateB;
    });
    
    container.innerHTML = '';
    
    if (activities.length === 0) {
        container.innerHTML = '<p class="empty-message">No activities found. Add your first activity above!</p>';
        return;
    }
    
    activities.forEach(activity => {
        container.appendChild(createActivityCard(activity));
    });
}

function createActivityCard(activity) {
    const card = document.createElement('div');
    card.className = `activity-card ${activity.category} ${activity.completed ? 'completed' : ''}`;
    
    const dateTime = new Date(activity.date + (activity.time ? 'T' + activity.time : ''));
    const isPast = dateTime < new Date() && !activity.completed;
    
    card.innerHTML = `
        <div class="activity-header">
            <div class="activity-title-section">
                <input type="checkbox" class="activity-checkbox" ${activity.completed ? 'checked' : ''} 
                       onchange="handleToggleCompletion(${activity.id})" aria-label="Toggle completion">
                <h3 class="activity-title">${escapeHtml(activity.title)}</h3>
                ${activity.reminder ? '<span class="reminder-badge" title="Reminder set">🔔</span>' : ''}
            </div>
            <div class="activity-actions">
                <button class="btn-icon" onclick="editActivity(${activity.id})" aria-label="Edit activity" title="Edit">✏️</button>
                <button class="btn-icon" onclick="handleDeleteActivity(${activity.id})" aria-label="Delete activity" title="Delete">🗑️</button>
            </div>
        </div>
        <div class="activity-body">
            <div class="activity-meta">
                <span class="activity-category-badge ${activity.category}">${capitalizeFirst(activity.category)}</span>
                <span class="activity-date">${formatDisplayDate(activity.date)}${activity.time ? ' at ' + formatTime(activity.time) : ''}</span>
                ${isPast ? '<span class="overdue-badge">Overdue</span>' : ''}
            </div>
            ${activity.description ? `<p class="activity-description">${escapeHtml(activity.description)}</p>` : ''}
            ${activity.completed && activity.completedAt ? 
                `<p class="completed-info">Completed on ${formatDisplayDateTime(activity.completedAt)}</p>` : ''}
        </div>
    `;
    
    return card;
}

function handleToggleCompletion(id) {
    toggleCompletion(id);
    displayActivities();
    displayDashboard();
    updateProgress();
    
    if (document.getElementById('calendar').classList.contains('active')) {
        displayCalendar();
    }
}

function handleDeleteActivity(id) {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    
    deleteActivity(id);
    showNotification('Activity deleted', 'info');
    displayActivities();
    displayDashboard();
    updateProgress();
    
    if (document.getElementById('calendar').classList.contains('active')) {
        displayCalendar();
    }
}

function displayDashboard() {
    const activities = getActivities();
    const now = new Date();
    const today = formatDate(now);
    
    // Calculate statistics
    const total = activities.length;
    const completed = activities.filter(a => a.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const upcoming = activities.filter(a => {
        if (a.completed) return false;
        const activityDate = new Date(a.date + (a.time ? 'T' + a.time : ''));
        return activityDate >= now;
    }).length;
    
    // Update stats
    document.getElementById('total-activities').textContent = total;
    document.getElementById('completed-activities').textContent = completed;
    document.getElementById('completion-rate').textContent = completionRate + '%';
    document.getElementById('upcoming-activities').textContent = upcoming;
    
    // Display upcoming activities (next 5)
    const upcomingList = activities
        .filter(a => {
            if (a.completed) return false;
            const activityDate = new Date(a.date + (a.time ? 'T' + a.time : ''));
            return activityDate >= now;
        })
        .sort((a, b) => {
            const dateA = new Date(a.date + (a.time ? 'T' + a.time : ''));
            const dateB = new Date(b.date + (b.time ? 'T' + b.time : ''));
            return dateA - dateB;
        })
        .slice(0, 5);
    
    const upcomingContainer = document.getElementById('upcoming-list');
    if (upcomingContainer) {
        upcomingContainer.innerHTML = '';
        if (upcomingList.length === 0) {
            upcomingContainer.innerHTML = '<p class="empty-message">No upcoming activities</p>';
        } else {
            upcomingList.forEach(activity => {
                upcomingContainer.appendChild(createActivityCard(activity));
            });
        }
    }
    
    // Display recent activities (last 5 completed)
    const recentList = activities
        .filter(a => a.completed)
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
        .slice(0, 5);
    
    const recentContainer = document.getElementById('recent-list');
    if (recentContainer) {
        recentContainer.innerHTML = '';
        if (recentList.length === 0) {
            recentContainer.innerHTML = '<p class="empty-message">No completed activities yet</p>';
        } else {
            recentList.forEach(activity => {
                recentContainer.appendChild(createActivityCard(activity));
            });
        }
    }
}

function initFilters() {
    const categoryFilter = document.getElementById('filter-category');
    const statusFilter = document.getElementById('filter-status');
    const dateFilter = document.getElementById('filter-date');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', displayActivities);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', displayActivities);
    }
    if (dateFilter) {
        dateFilter.addEventListener('change', displayActivities);
    }
}

// ============================================
// CALENDAR MODULE
// ============================================

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function initCalendar() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            displayCalendar();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            displayCalendar();
        });
    }
    
    displayCalendar();
}

function displayCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthYear = document.getElementById('current-month-year');
    
    if (!grid || !monthYear) return;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Get all activities for the month
    const startDate = formatDate(new Date(currentYear, currentMonth, 1));
    const endDate = formatDate(new Date(currentYear, currentMonth + 1, 0));
    const monthActivities = getActivities({ startDate, endDate });
    
    // Create calendar grid
    grid.innerHTML = '';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        grid.appendChild(emptyCell);
    }
    
    // Days of the month
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        const dateStr = formatDate(new Date(currentYear, currentMonth, day));
        const dayActivities = monthActivities.filter(a => a.date === dateStr);
        
        const isToday = isCurrentMonth && day === today.getDate();
        const isPast = new Date(currentYear, currentMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        dayCell.className = `calendar-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${dayActivities.length > 0 ? 'has-activities' : ''}`;
        dayCell.dataset.date = dateStr;
        
        dayCell.innerHTML = `
            <span class="day-number">${day}</span>
            ${dayActivities.length > 0 ? `<span class="activity-count">${dayActivities.length}</span>` : ''}
        `;
        
        dayCell.addEventListener('click', () => showDateActivities(dateStr, day));
        grid.appendChild(dayCell);
    }
}

function showDateActivities(dateStr, day) {
    const activities = getActivities({ date: dateStr });
    const container = document.getElementById('date-activities-list');
    const title = document.getElementById('selected-date-title');
    
    if (!container || !title) return;
    
    const date = new Date(dateStr + 'T00:00:00');
    title.textContent = `Activities for ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    
    container.innerHTML = '';
    
    if (activities.length === 0) {
        container.innerHTML = '<p class="empty-message">No activities scheduled for this date</p>';
        return;
    }
    
    activities.sort((a, b) => {
        if (a.time && b.time) {
            return a.time.localeCompare(b.time);
        }
        return a.time ? -1 : 1;
    }).forEach(activity => {
        container.appendChild(createActivityCard(activity));
    });
}

// ============================================
// PROGRESS MODULE
// ============================================

function updateProgress() {
    const activities = getActivities();
    
    // Overall statistics
    const total = activities.length;
    const completed = activities.filter(a => a.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('progress-total').textContent = total;
    document.getElementById('progress-completed').textContent = completed;
    document.getElementById('progress-pending').textContent = pending;
    document.getElementById('progress-rate').textContent = completionRate + '%';
    
    // Update progress bar
    const progressFill = document.getElementById('completion-progress-fill');
    const progressText = document.getElementById('completion-progress-text');
    if (progressFill) {
        progressFill.style.width = completionRate + '%';
    }
    if (progressText) {
        progressText.textContent = `${completionRate}% Complete (${completed} of ${total})`;
    }
    
    // Category statistics
    const categoryStats = {
        homework: { total: 0, completed: 0 },
        sports: { total: 0, completed: 0 },
        other: { total: 0, completed: 0 }
    };
    
    activities.forEach(activity => {
        if (categoryStats[activity.category]) {
            categoryStats[activity.category].total++;
            if (activity.completed) {
                categoryStats[activity.category].completed++;
            }
        }
    });
    
    const categoryContainer = document.getElementById('category-stats');
    if (categoryContainer) {
        categoryContainer.innerHTML = '';
        Object.keys(categoryStats).forEach(category => {
            const stat = categoryStats[category];
            const rate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
            
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-stat-item';
            categoryDiv.innerHTML = `
                <div class="category-stat-header">
                    <span class="category-name ${category}">${capitalizeFirst(category)}</span>
                    <span class="category-rate">${rate}%</span>
                </div>
                <div class="category-progress-bar">
                    <div class="category-progress-fill ${category}" style="width: ${rate}%"></div>
                </div>
                <div class="category-stat-numbers">
                    <span>${stat.completed} completed</span>
                    <span>${stat.total} total</span>
                </div>
            `;
            categoryContainer.appendChild(categoryDiv);
        });
    }
    
    // Weekly chart
    updateWeeklyChart();
}

function updateWeeklyChart() {
    const chart = document.getElementById('weekly-chart');
    if (!chart) return;
    
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    
    const weekData = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = formatDate(date);
        const dayActivities = getActivities({ date: dateStr });
        weekData.push({
            date: dateStr,
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            total: dayActivities.length,
            completed: dayActivities.filter(a => a.completed).length
        });
    }
    
    const maxActivities = Math.max(...weekData.map(d => d.total), 1);
    
    chart.innerHTML = '';
    weekData.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'weekly-chart-day';
        const completedHeight = day.total > 0 ? (day.completed / maxActivities) * 100 : 0;
        const pendingHeight = day.total > 0 ? ((day.total - day.completed) / maxActivities) * 100 : 0;
        
        dayDiv.innerHTML = `
            <div class="weekly-chart-bars">
                <div class="weekly-bar completed" style="height: ${completedHeight}%"></div>
                <div class="weekly-bar pending" style="height: ${pendingHeight}%"></div>
            </div>
            <div class="weekly-chart-label">${day.dayName}</div>
            <div class="weekly-chart-value">${day.total}</div>
        `;
        chart.appendChild(dayDiv);
    });
}

// ============================================
// REMINDER MODULE
// ============================================

function initReminders() {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Check for reminders every minute
    setInterval(checkReminders, 60000);
    
    // Check immediately on load
    checkReminders();
}

function checkReminders() {
    const activities = getActivities({ status: 'upcoming' });
    const now = new Date().getTime();
    
    activities.forEach(activity => {
        if (!activity.reminder || !activity.reminderTime) return;
        
        const reminderTime = activity.reminderTime;
        const timeDiff = reminderTime - now;
        
        // Show notification if reminder time is within next 2 minutes and not already shown
        if (timeDiff > 0 && timeDiff <= 120000 && !activity.reminderShown) {
            showReminderNotification(activity);
            // Mark reminder as shown (temporary, until activity time passes)
            const activities = getActivities();
            const activityIndex = activities.findIndex(a => a.id === activity.id);
            if (activityIndex !== -1) {
                activities[activityIndex].reminderShown = true;
                localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
            }
        }
    });
}

function showReminderNotification(activity) {
    const title = `Reminder: ${activity.title}`;
    const body = activity.time 
        ? `Scheduled for ${formatDisplayDate(activity.date)} at ${formatTime(activity.time)}`
        : `Scheduled for ${formatDisplayDate(activity.date)}`;
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '📅',
            tag: `activity-${activity.id}`
        });
    }
    
    // Visual notification
    showNotification(`${title} - ${body}`, 'info');
}

// ============================================
// NAVIGATION MODULE
// ============================================

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.dataset.section;
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show target section
            sections.forEach(s => s.classList.remove('active'));
            const target = document.getElementById(targetSection);
            if (target) {
                target.classList.add('active');
                
                // Refresh section content
                if (targetSection === 'dashboard') {
                    displayDashboard();
                    updateProgress();
                } else if (targetSection === 'schedule') {
                    displayActivities();
                } else if (targetSection === 'calendar') {
                    displayCalendar();
                } else if (targetSection === 'progress') {
                    updateProgress();
                }
            }
            
            // Close mobile menu
            if (navMenu) navMenu.classList.remove('active');
            if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
        });
    });
    
    // Mobile menu toggle
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            const isActive = navMenu.classList.toggle('active');
            mobileToggle.setAttribute('aria-expanded', isActive);
        });
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDisplayDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize data storage
    initializeData();
    
    // Initialize all modules
    initNavigation();
    initActivityForm();
    initFilters();
    initCalendar();
    initReminders();
    
    // Initial display
    displayDashboard();
    displayActivities();
    updateProgress();
});
