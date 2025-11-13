// Authentication check - redirect to login if not authenticated
window.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        // User is not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    // Display user ID in header
    const displayUserId = document.getElementById('displayUserId');
    if (displayUserId) {
        displayUserId.textContent = `User: ${userId}`;
    }
    
    // Update welcome message with user's name
    const welcomeMessage = document.querySelector('.bot-message .message-content p');
    if (welcomeMessage) {
        welcomeMessage.textContent = `👋 Welcome, ${userId}! Tell me what you ate for breakfast, lunch, or dinner, and I'll estimate the calories for you.`;
    }
    
    // Initialize logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('userId');
                localStorage.removeItem('loginTime');
                // Clear daily calories for this session
                dailyCalories = { breakfast: 0, lunch: 0, dinner: 0 };
                window.location.href = 'login.html';
            }
        });
    }
    
    // Load data from database and initialize app
    loadDataFromDatabase().then(dbData => {
        if (dbData && dbData.dailyTotals) {
            cachedDailyTotals = dbData.dailyTotals;
        }
        initializeApp();
    });
});

// State management
let currentMealType = 'breakfast';
let dailyCalories = {
    breakfast: 0,
    lunch: 0,
    dinner: 0
};
let calorieChart = null;

// Get today's date as YYYY-MM-DD
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Load data from database
async function loadDataFromDatabase() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    try {
        // Fetch daily totals for last 7 days
        const response = await fetch('/api/get-daily-totals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Get today's date
            const today = getTodayDate();
            
            // Load today's calories by meal type
            if (data.mealTypeTotals[today]) {
                dailyCalories.breakfast = data.mealTypeTotals[today].breakfast || 0;
                dailyCalories.lunch = data.mealTypeTotals[today].lunch || 0;
                dailyCalories.dinner = data.mealTypeTotals[today].dinner || 0;
            }
            
            return data;
        }
    } catch (error) {
        console.error('Error loading data from database:', error);
    }
    
    return null;
}

// Save meal to database
async function saveMealToDatabase(userId, meal, mealType, calories) {
    try {
        const response = await fetch('/api/save-meal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                meal,
                mealType,
                calories
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            console.error('Failed to save meal to database:', data.error);
        }
        
        return data.success;
    } catch (error) {
        console.error('Error saving meal to database:', error);
        return false;
    }
}

// Get last 7 days of calorie data from cached database data
function getLast7DaysData(dailyTotalsFromDB) {
    const labels = [];
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Format label (e.g., "Mon 15" or "Today")
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = date.getDate();
        const label = i === 0 ? 'Today' : `${dayName} ${dayNum}`;
        labels.push(label);
        
        // Get calories for this date from database data
        const total = dailyTotalsFromDB && dailyTotalsFromDB[dateStr] ? dailyTotalsFromDB[dateStr] : 0;
        data.push(total);
    }
    
    return { labels, data };
}

// Store database data for charts
let cachedDailyTotals = {};

// Initialize the chart
function initializeChart(dailyTotalsFromDB) {
    const ctx = document.getElementById('calorieChart');
    if (!ctx) return;
    
    const { labels, data } = getLast7DaysData(dailyTotalsFromDB);
    
    calorieChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Calories',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return `Calories: ${context.parsed.y.toLocaleString()} kcal`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString() + ' kcal';
                        },
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Update the chart
function updateChart(dailyTotalsFromDB) {
    if (!calorieChart) return;
    
    const { labels, data } = getLast7DaysData(dailyTotalsFromDB || cachedDailyTotals);
    calorieChart.data.labels = labels;
    calorieChart.data.datasets[0].data = data;
    calorieChart.update();
}

// Initialize the main app functionality
function initializeApp() {
    // DOM elements
    const mealInput = document.getElementById('mealInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const mealButtons = document.querySelectorAll('.meal-btn');
    const totalCaloriesEl = document.getElementById('totalCalories');
    const breakfastCaloriesEl = document.getElementById('breakfastCalories');
    const lunchCaloriesEl = document.getElementById('lunchCalories');
    const dinnerCaloriesEl = document.getElementById('dinnerCalories');

    // Initialize meal type buttons
    mealButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            mealButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMealType = btn.dataset.meal;
        });
    });

    // Send message function
    async function sendMessage() {
        const mealText = mealInput.value.trim();
        if (!mealText) return;

        // Disable input while processing
        sendBtn.disabled = true;
        mealInput.disabled = true;

        // Add user message to chat with meal type indicator
        const mealTypeLabel = currentMealType.charAt(0).toUpperCase() + currentMealType.slice(1);
        addMessage(`[${mealTypeLabel}] ${mealText}`, 'user');

        // Clear input
        mealInput.value = '';

        // Show loading message
        const loadingId = addLoadingMessage();

        try {
            // Send to backend API
            const response = await fetch('/api/estimate-calories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    meal: mealText,
                    mealType: currentMealType
                })
            });

            const data = await response.json();

            // Remove loading message
            removeMessage(loadingId);

            // Add bot response
            if (data.success) {
                addCalorieResponse(mealText, data.calories, data.breakdown);
                
                // Save to database
                const userId = localStorage.getItem('userId');
                await saveMealToDatabase(userId, mealText, currentMealType, data.calories);
                
                // Update stats
                dailyCalories[currentMealType] += data.calories;
                
                // Reload data from database to update everything
                const dbData = await loadDataFromDatabase();
                if (dbData && dbData.dailyTotals) {
                    cachedDailyTotals = dbData.dailyTotals;
                }
                
                updateStats();
            } else {
                addMessage(`Sorry, I encountered an error: ${data.error}`, 'bot');
            }
        } catch (error) {
            removeMessage(loadingId);
            addMessage('Sorry, I couldn\'t connect to the server. Please make sure the backend is running.', 'bot');
            console.error('Error:', error);
        } finally {
            // Re-enable input
            sendBtn.disabled = false;
            mealInput.disabled = false;
            mealInput.focus();
        }
    }

    // Add message to chat
    function addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const p = document.createElement('p');
        p.textContent = text;
        
        contentDiv.appendChild(p);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageDiv;
    }

    // Add loading message
    function addLoadingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.id = 'loading-' + Date.now();
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const p = document.createElement('p');
        p.innerHTML = 'Analyzing your meal... <span class="loading"></span>';
        
        contentDiv.appendChild(p);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageDiv.id;
    }

    // Remove message by ID
    function removeMessage(id) {
        const message = document.getElementById(id);
        if (message) {
            message.remove();
        }
    }

    // Add calorie response
    function addCalorieResponse(mealText, calories, breakdown) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const mealP = document.createElement('p');
        mealP.textContent = `For "${mealText}"`;
        
        const calorieDiv = document.createElement('div');
        calorieDiv.className = 'calorie-estimate';
        calorieDiv.textContent = `Estimated calories: ${calories} kcal`;
        
        contentDiv.appendChild(mealP);
        if (breakdown && breakdown.length > 0) {
            const breakdownP = document.createElement('p');
            breakdownP.style.marginTop = '8px';
            breakdownP.style.fontSize = '0.9rem';
            breakdownP.style.color = '#666';
            breakdownP.textContent = breakdown.join(', ');
            contentDiv.appendChild(breakdownP);
        }
        contentDiv.appendChild(calorieDiv);
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Update statistics display
    function updateStats() {
        const total = dailyCalories.breakfast + dailyCalories.lunch + dailyCalories.dinner;
        
        totalCaloriesEl.textContent = total.toLocaleString();
        breakfastCaloriesEl.textContent = dailyCalories.breakfast.toLocaleString();
        lunchCaloriesEl.textContent = dailyCalories.lunch.toLocaleString();
        dinnerCaloriesEl.textContent = dailyCalories.dinner.toLocaleString();
        
        // Update chart with latest data
        updateChart(cachedDailyTotals);
    }
    
    // Initialize chart with database data
    initializeChart(cachedDailyTotals);
    
    // Update stats on load (to show saved data)
    updateStats();

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);

    mealInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendBtn.disabled) {
            sendMessage();
        }
    });

    // Focus input on load
    mealInput.focus();
}

