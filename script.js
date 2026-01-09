// ============================================
// WASTE MANAGEMENT SYSTEM - JavaScript
// ============================================

// ============================================
// DATA MANAGEMENT MODULE
// ============================================

// localStorage Keys
const STORAGE_KEYS = {
    WASTE_LOGS: 'wasteLogs',
    USER_STATS: 'userStats',
    ACHIEVEMENTS: 'achievements',
    COLLECTION_SCHEDULE: 'collectionSchedule',
    USER_POINTS: 'userPoints'
};

// Initialize data if not exists
function initializeData() {
    if (!localStorage.getItem(STORAGE_KEYS.WASTE_LOGS)) {
        localStorage.setItem(STORAGE_KEYS.WASTE_LOGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USER_STATS)) {
        localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify({
            totalWaste: 0,
            totalRecycled: 0,
            recyclingRate: 0,
            co2Saved: 0,
            energySaved: 0,
            treesSaved: 0,
            waterSaved: 0
        }));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)) {
        localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COLLECTION_SCHEDULE)) {
        localStorage.setItem(STORAGE_KEYS.COLLECTION_SCHEDULE, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USER_POINTS)) {
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, JSON.stringify({
            points: 0,
            level: 1
        }));
    }
}

// Save waste log
function saveWasteLog(wasteData) {
    const logs = getWasteLogs();
    const newLog = {
        id: Date.now(),
        date: wasteData.date || formatDate(new Date()),
        category: wasteData.category,
        type: wasteData.type,
        quantity: parseFloat(wasteData.quantity),
        unit: wasteData.unit || 'kg'
    };
    logs.push(newLog);
    localStorage.setItem(STORAGE_KEYS.WASTE_LOGS, JSON.stringify(logs));
    return newLog;
}

// Get waste logs
function getWasteLogs(filter = {}) {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.WASTE_LOGS) || '[]');
    if (Object.keys(filter).length === 0) return logs;
    
    return logs.filter(log => {
        if (filter.category && log.category !== filter.category) return false;
        if (filter.date && log.date !== filter.date) return false;
        if (filter.startDate && log.date < filter.startDate) return false;
        if (filter.endDate && log.date > filter.endDate) return false;
        return true;
    });
}

// Calculate statistics from logs
function calculateStats() {
    const logs = getWasteLogs();
    const stats = {
        totalWaste: 0,
        totalRecycled: 0,
        byCategory: {
            recyclable: 0,
            organic: 0,
            hazardous: 0,
            general: 0
        },
        co2Saved: 0,
        energySaved: 0,
        treesSaved: 0,
        waterSaved: 0
    };

    logs.forEach(log => {
        // Convert all to kg for calculations
        let quantityInKg = log.quantity;
        if (log.unit === 'pieces') {
            quantityInKg = log.quantity * 0.05; // Approximate 50g per piece
        } else if (log.unit === 'liters') {
            quantityInKg = log.quantity; // Approximate 1:1 for liquids
        }

        stats.totalWaste += quantityInKg;
        stats.byCategory[log.category] += quantityInKg;

        if (log.category === 'recyclable') {
            stats.totalRecycled += quantityInKg;
            // Environmental impact calculations
            stats.co2Saved += quantityInKg * 2.5; // kg CO2 saved per kg recycled
            stats.energySaved += quantityInKg * 5; // kWh saved per kg recycled
            stats.waterSaved += quantityInKg * 50; // liters saved per kg recycled
            
            // Trees saved (mainly for paper)
            if (log.type.toLowerCase().includes('paper')) {
                stats.treesSaved += quantityInKg * 0.02; // trees saved per kg paper
            }
        }
    });

    stats.recyclingRate = stats.totalWaste > 0 
        ? (stats.totalRecycled / stats.totalWaste * 100).toFixed(1) 
        : 0;

    // Save stats
    localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
    return stats;
}

// Update progress dashboard
function updateProgress() {
    const stats = calculateStats();
    const points = getUserPoints();

    // Update dashboard stats
    document.getElementById('total-waste').textContent = `${stats.totalWaste.toFixed(2)} kg`;
    document.getElementById('recycling-rate').textContent = `${stats.recyclingRate}%`;
    document.getElementById('co2-saved').textContent = `${stats.co2Saved.toFixed(2)} kg`;
    document.getElementById('energy-saved').textContent = `${stats.energySaved.toFixed(2)} kWh`;
    document.getElementById('user-level').textContent = `Level ${points.level}`;
    document.getElementById('total-points').textContent = points.points;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/76aae8b2-238f-4c6b-b723-680fc1cd8300',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D',location:'script.js:updateProgress',message:'Dashboard stats',data:{totalWaste:stats.totalWaste,recyclingRate:stats.recyclingRate,points:points.points,level:points.level},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    // Update category chart
    updateCategoryChart(stats.byCategory);

    // Update recent logs
    updateRecentLogs();
}

// ============================================
// WASTE TRACKING MODULE
// ============================================

function initWasteTracking() {
    const form = document.getElementById('waste-tracking-form');
    if (!form) return;

    // Set default date to today
    const dateInput = document.getElementById('waste-date');
    if (dateInput) {
        dateInput.value = formatDate(new Date());
    }

    form.addEventListener('submit', handleWasteTrackingSubmit);
    displayWasteLogs();
}

function handleWasteTrackingSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const wasteData = {
        date: formData.get('date'),
        category: formData.get('category'),
        type: formData.get('type'),
        quantity: formData.get('quantity'),
        unit: formData.get('unit')
    };

    // Validation
    if (!wasteData.category || !wasteData.type || !wasteData.quantity) {
        alert('Please fill in all required fields');
        return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/76aae8b2-238f-4c6b-b723-680fc1cd8300',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A',location:'script.js:handleWasteTrackingSubmit',message:'Submit waste log',data:{wasteData},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    // Save waste log
    saveWasteLog(wasteData);

    // Award points
    awardPoints(10); // Base points for logging
    if (wasteData.category === 'recyclable') {
        awardPoints(50); // Bonus for recycling
    }

    // Check achievements
    checkAchievements();

    // Update displays
    displayWasteLogs();
    updateProgress();

    // Reset form
    e.target.reset();
    document.getElementById('waste-date').value = formatDate(new Date());
    
    // Show success message
    showNotification('Waste logged successfully!', 'success');
}

function displayWasteLogs() {
    const container = document.getElementById('waste-logs-list');
    if (!container) return;

    const logs = getWasteLogs().reverse(); // Most recent first
    container.innerHTML = '';

    if (logs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No waste logs yet. Start tracking your waste!</p>';
        return;
    }

    logs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        logItem.innerHTML = `
            <div class="log-info">
                <span class="log-category ${log.category}">${capitalizeFirst(log.category)}</span>
                <strong>${log.type}</strong> - ${log.quantity} ${log.unit}
                <span style="color: var(--text-secondary); font-size: 0.9rem;"> • ${formatDisplayDate(log.date)}</span>
            </div>
            <button class="btn btn-secondary" onclick="deleteWasteLog(${log.id})" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Delete</button>
        `;
        container.appendChild(logItem);
    });
}

function deleteWasteLog(id) {
    if (!confirm('Are you sure you want to delete this waste log?')) return;
    
    const logs = getWasteLogs();
    const filtered = logs.filter(log => log.id !== id);
    localStorage.setItem(STORAGE_KEYS.WASTE_LOGS, JSON.stringify(filtered));
    displayWasteLogs();
    updateProgress();
    showNotification('Waste log deleted', 'info');
}

// ============================================
// SEGREGATION GUIDE MODULE
// ============================================

const SEGREGATION_DATA = {
    recyclable: [
        { type: 'Plastic Bottles', disposal: 'Recycle bin', tips: 'Remove caps and rinse before recycling' },
        { type: 'Paper', disposal: 'Recycle bin', tips: 'Keep dry and clean, remove staples' },
        { type: 'Cardboard', disposal: 'Recycle bin', tips: 'Flatten boxes before recycling' },
        { type: 'Glass Bottles', disposal: 'Recycle bin', tips: 'Remove labels and rinse clean' },
        { type: 'Metal Cans', disposal: 'Recycle bin', tips: 'Rinse and remove labels' },
        { type: 'Aluminum Foil', disposal: 'Recycle bin', tips: 'Clean before recycling' },
        { type: 'Newspapers', disposal: 'Recycle bin', tips: 'Keep dry and bundle together' }
    ],
    organic: [
        { type: 'Food Scraps', disposal: 'Compost bin', tips: 'Can be composted at home or collected separately' },
        { type: 'Vegetable Peels', disposal: 'Compost bin', tips: 'Excellent for composting' },
        { type: 'Coffee Grounds', disposal: 'Compost bin', tips: 'Rich in nitrogen, great for compost' },
        { type: 'Eggshells', disposal: 'Compost bin', tips: 'Crush before adding to compost' },
        { type: 'Garden Waste', disposal: 'Compost bin', tips: 'Leaves, grass clippings can be composted' },
        { type: 'Fruit Waste', disposal: 'Compost bin', tips: 'Natural compost material' }
    ],
    hazardous: [
        { type: 'Batteries', disposal: 'Hazardous waste facility', tips: 'Never throw in regular trash' },
        { type: 'Electronics', disposal: 'E-waste collection center', tips: 'Contains valuable materials for recycling' },
        { type: 'Paint', disposal: 'Hazardous waste facility', tips: 'Check for local paint recycling programs' },
        { type: 'Medications', disposal: 'Pharmacy or hazardous waste', tips: 'Never flush down the drain' },
        { type: 'Fluorescent Bulbs', disposal: 'Hazardous waste facility', tips: 'Contains mercury, needs special handling' },
        { type: 'Chemicals', disposal: 'Hazardous waste facility', tips: 'Handle with care, follow local regulations' }
    ],
    general: [
        { type: 'Plastic Bags', disposal: 'General waste', tips: 'Some stores accept for recycling' },
        { type: 'Styrofoam', disposal: 'General waste', tips: 'Not easily recyclable, reduce usage' },
        { type: 'Chip Bags', disposal: 'General waste', tips: 'Multi-layer packaging is hard to recycle' },
        { type: 'Diapers', disposal: 'General waste', tips: 'Not recyclable, dispose in regular trash' },
        { type: 'Ceramics', disposal: 'General waste', tips: 'Not recyclable through standard programs' }
    ]
};

function initSegregationGuide() {
    const selector = document.querySelector('.segregation-selector');
    const guide = document.getElementById('segregation-guide');
    if (!selector || !guide) return;

    // Category button handlers
    selector.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            // Update active button
            selector.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');

            // Display guide
            const category = e.target.dataset.category;
            displaySegregationGuide(category);
        }
    });

    // Initial display
    displaySegregationGuide('all');
}

function displaySegregationGuide(category) {
    const guide = document.getElementById('segregation-guide');
    if (!guide) return;

    guide.innerHTML = '';

    if (category === 'all') {
        Object.keys(SEGREGATION_DATA).forEach(cat => {
            SEGREGATION_DATA[cat].forEach(item => {
                guide.appendChild(createSegregationItem(item, cat));
            });
        });
    } else if (SEGREGATION_DATA[category]) {
        SEGREGATION_DATA[category].forEach(item => {
            guide.appendChild(createSegregationItem(item, category));
        });
    }
}

function createSegregationItem(item, category) {
    const div = document.createElement('div');
    div.className = `segregation-item ${category}`;
    div.innerHTML = `
        <h3>${item.type}</h3>
        <p><strong>Disposal:</strong> ${item.disposal}</p>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">${item.tips}</p>
    `;
    return div;
}

// ============================================
// RECYCLING INFO MODULE
// ============================================

const RECYCLING_INFO = [
    {
        title: 'Plastic Recycling',
        content: 'Most plastic containers (bottles, jugs, tubs) can be recycled. Look for the recycling symbol. Clean and dry items before recycling. Remove caps from bottles.',
        icon: '♻️'
    },
    {
        title: 'Paper Recycling',
        content: 'Newspapers, magazines, office paper, and cardboard can all be recycled. Keep paper dry and remove any plastic or metal components like staples.',
        icon: '📄'
    },
    {
        title: 'Glass Recycling',
        content: 'Glass bottles and jars are 100% recyclable and can be recycled endlessly. Remove labels and rinse clean. Broken glass should be wrapped and disposed safely.',
        icon: '🍶'
    },
    {
        title: 'Metal Recycling',
        content: 'Aluminum cans, steel cans, and other metal items are highly recyclable. Rinse clean before recycling. Metal can be recycled indefinitely without losing quality.',
        icon: '🥫'
    },
    {
        title: 'E-Waste Recycling',
        content: 'Electronics contain valuable materials and should be recycled at designated e-waste centers. Never throw electronics in regular trash as they contain hazardous materials.',
        icon: '💻'
    },
    {
        title: 'Composting',
        content: 'Organic waste like food scraps and yard waste can be composted. Composting reduces methane emissions and creates nutrient-rich soil. Start a compost bin at home!',
        icon: '🌱'
    }
];

function initRecyclingInfo() {
    const grid = document.getElementById('recycling-grid');
    if (!grid) return;

    grid.innerHTML = '';
    RECYCLING_INFO.forEach(info => {
        const card = document.createElement('div');
        card.className = 'recycling-card';
        card.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem;">${info.icon}</div>
            <h3>${info.title}</h3>
            <p>${info.content}</p>
        `;
        grid.appendChild(card);
    });
}

// ============================================
// WASTE CALCULATOR MODULE
// ============================================

function initWasteCalculator() {
    const form = document.getElementById('calculator-form');
    if (!form) return;

    form.addEventListener('submit', handleCalculatorSubmit);
}

function handleCalculatorSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const category = formData.get('category');
    const type = formData.get('type');
    const quantity = parseFloat(formData.get('quantity'));

    if (!category || !type || !quantity) {
        alert('Please fill in all fields');
        return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/76aae8b2-238f-4c6b-b723-680fc1cd8300',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B',location:'script.js:handleCalculatorSubmit',message:'Calculator submit',data:{category,type,quantity},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const results = calculateEnvironmentalImpact(category, type, quantity);
    displayCalculatorResults(results, quantity, type);
}

function calculateEnvironmentalImpact(category, type, quantity) {
    const results = {
        co2Saved: 0,
        energySaved: 0,
        treesSaved: 0,
        waterSaved: 0
    };

    if (category === 'recyclable') {
        results.co2Saved = quantity * 2.5; // kg CO2
        results.energySaved = quantity * 5; // kWh
        results.waterSaved = quantity * 50; // liters
        
        // Trees saved mainly for paper
        if (type.toLowerCase().includes('paper')) {
            results.treesSaved = quantity * 0.02;
        }
    } else if (category === 'organic') {
        // Composting benefits
        results.co2Saved = quantity * 0.5; // Less methane emissions
    }

    return results;
}

function displayCalculatorResults(results, quantity, type) {
    const container = document.getElementById('calculator-results');
    if (!container) return;

    container.innerHTML = `
        <h3>Environmental Impact for ${quantity} kg of ${type}</h3>
        <div class="result-item">
            <span class="result-label">CO₂ Emissions Saved:</span>
            <span class="result-value">${results.co2Saved.toFixed(2)} kg</span>
        </div>
        <div class="result-item">
            <span class="result-label">Energy Saved:</span>
            <span class="result-value">${results.energySaved.toFixed(2)} kWh</span>
        </div>
        ${results.treesSaved > 0 ? `
        <div class="result-item">
            <span class="result-label">Trees Saved:</span>
            <span class="result-value">${results.treesSaved.toFixed(2)} trees</span>
        </div>
        ` : ''}
        <div class="result-item">
            <span class="result-label">Water Saved:</span>
            <span class="result-value">${results.waterSaved.toFixed(2)} liters</span>
        </div>
    `;
}

// ============================================
// COLLECTION SCHEDULE MODULE
// ============================================

function initCollectionSchedule() {
    const form = document.getElementById('schedule-form');
    if (!form) return;

    form.addEventListener('submit', handleScheduleSubmit);
    displaySchedule();
}

function handleScheduleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const schedule = {
        id: Date.now(),
        date: formData.get('date'),
        type: formData.get('type'),
        time: formData.get('time') || '',
        notes: formData.get('notes') || ''
    };

    const schedules = getCollectionSchedule();
    schedules.push(schedule);
    localStorage.setItem(STORAGE_KEYS.COLLECTION_SCHEDULE, JSON.stringify(schedules));

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/76aae8b2-238f-4c6b-b723-680fc1cd8300',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C',location:'script.js:handleScheduleSubmit',message:'Schedule added',data:{count:schedules.length,nextDate:schedule.date,type:schedule.type},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    displaySchedule();
    e.target.reset();
    showNotification('Collection scheduled!', 'success');
}

function getCollectionSchedule() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLECTION_SCHEDULE) || '[]');
}

function displaySchedule() {
    const container = document.getElementById('schedule-list');
    if (!container) return;

    const schedules = getCollectionSchedule()
        .filter(s => s.date >= formatDate(new Date())) // Only future dates
        .sort((a, b) => a.date.localeCompare(b.date));

    container.innerHTML = '';

    if (schedules.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No upcoming collections scheduled.</p>';
        return;
    }

    schedules.forEach(schedule => {
        const item = document.createElement('div');
        item.className = 'schedule-item';
        item.innerHTML = `
            <div class="schedule-date">${formatDisplayDate(schedule.date)}${schedule.time ? ` at ${schedule.time}` : ''}</div>
            <p><strong>Type:</strong> ${capitalizeFirst(schedule.type)}</p>
            ${schedule.notes ? `<p>${schedule.notes}</p>` : ''}
            <button class="btn btn-secondary" onclick="deleteSchedule(${schedule.id})" style="margin-top: 0.5rem; padding: 0.5rem 1rem; font-size: 0.9rem;">Remove</button>
        `;
        container.appendChild(item);
    });
}

function deleteSchedule(id) {
    const schedules = getCollectionSchedule();
    const filtered = schedules.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.COLLECTION_SCHEDULE, JSON.stringify(filtered));
    displaySchedule();
    showNotification('Schedule removed', 'info');
}

// ============================================
// EDUCATIONAL CONTENT MODULE
// ============================================

const EDUCATIONAL_CONTENT = [
    {
        title: 'The 3 R\'s: Reduce, Reuse, Recycle',
        content: 'The foundation of waste management. Reduce consumption, reuse items when possible, and recycle materials that can be processed into new products. This hierarchy helps minimize waste and environmental impact.',
        category: 'Basics'
    },
    {
        title: 'Why Waste Segregation Matters',
        content: 'Proper waste segregation ensures that recyclable materials don\'t end up in landfills. It also prevents contamination, making recycling more efficient and cost-effective. Segregating at source is the first step to effective waste management.',
        category: 'Segregation'
    },
    {
        title: 'The Impact of Plastic Waste',
        content: 'Plastic waste takes hundreds of years to decompose and often ends up in oceans, harming marine life. By reducing plastic use and recycling properly, we can significantly reduce this environmental burden.',
        category: 'Plastic'
    },
    {
        title: 'Composting at Home',
        content: 'Composting organic waste reduces methane emissions from landfills and creates nutrient-rich soil. You can start a simple compost bin in your backyard or use a kitchen composter for food scraps.',
        category: 'Composting'
    },
    {
        title: 'E-Waste: A Growing Concern',
        content: 'Electronic waste contains valuable materials like gold and silver, but also hazardous substances. Proper e-waste recycling recovers valuable resources while safely handling toxic materials.',
        category: 'E-Waste'
    },
    {
        title: 'The Circular Economy',
        content: 'A circular economy aims to eliminate waste by keeping materials in use. Products are designed to be reused, repaired, or recycled, creating a sustainable loop that reduces the need for new resources.',
        category: 'Economy'
    }
];

function initEducationalContent() {
    const grid = document.getElementById('education-grid');
    if (!grid) return;

    grid.innerHTML = '';
    EDUCATIONAL_CONTENT.forEach(content => {
        const card = document.createElement('div');
        card.className = 'education-card';
        card.innerHTML = `
            <span style="display: inline-block; padding: 0.25rem 0.75rem; background-color: var(--primary-color); color: white; border-radius: 20px; font-size: 0.85rem; margin-bottom: 1rem;">${content.category}</span>
            <h3>${content.title}</h3>
            <p>${content.content}</p>
        `;
        grid.appendChild(card);
    });
}

// ============================================
// PROGRESS DASHBOARD MODULE
// ============================================

function updateCategoryChart(byCategory) {
    const chart = document.getElementById('category-chart');
    if (!chart) return;

    const maxValue = Math.max(...Object.values(byCategory), 1);
    
    chart.innerHTML = '<div class="bar-chart"></div>';
    const barChart = chart.querySelector('.bar-chart');

    Object.keys(byCategory).forEach(category => {
        const value = byCategory[category];
        const percentage = maxValue > 0 ? (value / maxValue * 100) : 0;
        
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${percentage}%`;
        bar.style.backgroundColor = getCategoryColor(category);
        
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = capitalizeFirst(category);
        
        const valueLabel = document.createElement('div');
        valueLabel.className = 'bar-value';
        valueLabel.textContent = `${value.toFixed(1)} kg`;
        
        bar.appendChild(valueLabel);
        bar.appendChild(label);
        barChart.appendChild(bar);
    });
}

function updateRecentLogs() {
    const container = document.getElementById('recent-logs');
    if (!container) return;

    const logs = getWasteLogs().slice(-5).reverse(); // Last 5, most recent first
    container.innerHTML = '';

    if (logs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No recent activity</p>';
        return;
    }

    logs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'log-item';
        item.innerHTML = `
            <div class="log-info">
                <span class="log-category ${log.category}">${capitalizeFirst(log.category)}</span>
                <strong>${log.type}</strong> - ${log.quantity} ${log.unit}
                <span style="color: var(--text-secondary); font-size: 0.9rem;"> • ${formatDisplayDate(log.date)}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

function getCategoryColor(category) {
    const colors = {
        recyclable: 'var(--recyclable-color)',
        organic: 'var(--organic-color)',
        hazardous: 'var(--hazardous-color)',
        general: 'var(--general-color)'
    };
    return colors[category] || 'var(--general-color)';
}

// ============================================
// GAMIFICATION MODULE
// ============================================

const ACHIEVEMENTS = [
    { id: 'first_log', name: 'First Step', icon: '🌱', desc: 'Log your first waste entry', requirement: { logs: 1 } },
    { id: 'first_recycle', name: 'First Recycle', icon: '♻️', desc: 'Recycle your first item', requirement: { recycles: 1 } },
    { id: 'week_warrior', name: 'Week Warrior', icon: '📅', desc: 'Log waste for 7 consecutive days', requirement: { streak: 7 } },
    { id: 'eco_champion', name: 'Eco Champion', icon: '🏆', desc: 'Recycle 50 items', requirement: { recycles: 50 } },
    { id: 'waste_tracker', name: 'Waste Tracker', icon: '📊', desc: 'Log 10 waste entries', requirement: { logs: 10 } },
    { id: 'recycling_master', name: 'Recycling Master', icon: '⭐', desc: 'Recycle 100 items', requirement: { recycles: 100 } },
    { id: 'month_warrior', name: 'Month Warrior', icon: '📆', desc: 'Log waste for 30 days', requirement: { logs: 30 } },
    { id: 'zero_waste', name: 'Zero Waste Hero', icon: '🌍', desc: 'Achieve 80% recycling rate', requirement: { recyclingRate: 80 } }
];

function getUserPoints() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || JSON.stringify({ points: 0, level: 1 }));
}

function awardPoints(amount) {
    const userPoints = getUserPoints();
    userPoints.points += amount;
    
    // Calculate level (Level 1: 0-100, Level 2: 101-500, Level 3: 501-1000, etc.)
    userPoints.level = Math.floor(userPoints.points / 100) + 1;
    if (userPoints.points < 100) userPoints.level = 1;
    
    localStorage.setItem(STORAGE_KEYS.USER_POINTS, JSON.stringify(userPoints));
    updateAchievementsDisplay();
}

function checkAchievements() {
    const logs = getWasteLogs();
    const stats = calculateStats();
    const earned = getEarnedAchievements();
    const newAchievements = [];

    // Calculate metrics
    const totalLogs = logs.length;
    const totalRecycles = logs.filter(l => l.category === 'recyclable').length;
    const recyclingRate = parseFloat(stats.recyclingRate);
    
    // Check streak (simplified - check if logged today and yesterday)
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    const hasToday = logs.some(l => l.date === today);
    const hasYesterday = logs.some(l => l.date === yesterday);
    const streak = (hasToday && hasYesterday) ? 2 : (hasToday ? 1 : 0);

    ACHIEVEMENTS.forEach(achievement => {
        if (earned.includes(achievement.id)) return; // Already earned

        let earnedThis = false;
        if (achievement.requirement.logs && totalLogs >= achievement.requirement.logs) {
            earnedThis = true;
        } else if (achievement.requirement.recycles && totalRecycles >= achievement.requirement.recycles) {
            earnedThis = true;
        } else if (achievement.requirement.streak && streak >= achievement.requirement.streak) {
            earnedThis = true;
        } else if (achievement.requirement.recyclingRate && recyclingRate >= achievement.requirement.recyclingRate) {
            earnedThis = true;
        }

        if (earnedThis) {
            awardBadge(achievement);
            newAchievements.push(achievement);
        }
    });

    if (newAchievements.length > 0) {
        showNotification(`Achievement unlocked: ${newAchievements.map(a => a.name).join(', ')}! 🎉`, 'success');
    }
}

function getEarnedAchievements() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS) || '[]');
}

function awardBadge(achievement) {
    const earned = getEarnedAchievements();
    if (!earned.includes(achievement.id)) {
        earned.push(achievement.id);
        localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(earned));
        awardPoints(100); // Bonus points for achievement
    }
    updateAchievementsDisplay();
}

function initAchievements() {
    updateAchievementsDisplay();
}

function updateAchievementsDisplay() {
    const earned = getEarnedAchievements();
    const points = getUserPoints();
    
    // Update points display
    const levelEl = document.getElementById('achievement-level');
    const pointsEl = document.getElementById('achievement-points');
    const progressFill = document.getElementById('level-progress-fill');
    const progressText = document.getElementById('level-progress-text');
    
    if (levelEl) levelEl.textContent = points.level;
    if (pointsEl) pointsEl.textContent = points.points;
    
    // Calculate progress to next level
    const currentLevelPoints = (points.level - 1) * 100;
    const nextLevelPoints = points.level * 100;
    const progress = ((points.points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
    
    if (progressFill) progressFill.style.width = `${Math.min(progress, 100)}%`;
    if (progressText) {
        const pointsNeeded = nextLevelPoints - points.points;
        progressText.textContent = `${pointsNeeded} points to next level`;
    }

    // Display earned badges
    const badgesGrid = document.getElementById('badges-grid');
    if (badgesGrid) {
        badgesGrid.innerHTML = '';
        const earnedAchievements = ACHIEVEMENTS.filter(a => earned.includes(a.id));
        
        if (earnedAchievements.length === 0) {
            badgesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No badges earned yet. Keep tracking your waste!</p>';
        } else {
            earnedAchievements.forEach(achievement => {
                badgesGrid.appendChild(createBadgeItem(achievement, true));
            });
        }
    }

    // Display all badges
    const allBadgesGrid = document.getElementById('all-badges-grid');
    if (allBadgesGrid) {
        allBadgesGrid.innerHTML = '';
        ACHIEVEMENTS.forEach(achievement => {
            const isEarned = earned.includes(achievement.id);
            allBadgesGrid.appendChild(createBadgeItem(achievement, isEarned));
        });
    }
}

function createBadgeItem(achievement, earned) {
    const item = document.createElement('div');
    item.className = `badge-item ${earned ? 'earned' : ''}`;
    item.innerHTML = `
        <div class="badge-icon">${achievement.icon}</div>
        <div class="badge-name">${achievement.name}</div>
        <div class="badge-desc">${achievement.desc}</div>
    `;
    return item;
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

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showNotification(message, type = 'info') {
    // Simple notification - could be enhanced with a toast library
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
        color: white;
        border-radius: 6px;
        box-shadow: var(--shadow-hover);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// NAVIGATION MODULE
// ============================================

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    // Navigation click handlers
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.dataset.section;

            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/76aae8b2-238f-4c6b-b723-680fc1cd8300',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'E',location:'script.js:initNavigation',message:'Nav click',data:{targetSection,sections:sections.length},timestamp:Date.now()})}).catch(()=>{});
            // #endregion

            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show target section
            sections.forEach(s => s.classList.remove('active'));
            const target = document.getElementById(targetSection);
            if (target) {
                target.classList.add('active');
                
                // Update progress when viewing dashboard
                if (targetSection === 'dashboard') {
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
// MODAL MODULE
// ============================================

function initModal() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.modal-close');
    
    if (!modal) return;

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize data storage
    initializeData();

    // Initialize all modules
    initNavigation();
    initModal();
    initWasteTracking();
    initSegregationGuide();
    initRecyclingInfo();
    initWasteCalculator();
    initCollectionSchedule();
    initEducationalContent();
    initAchievements();

    // Initial dashboard update
    updateProgress();

    // Check for achievements on load
    checkAchievements();
});
