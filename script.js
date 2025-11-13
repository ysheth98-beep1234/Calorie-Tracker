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
    
    // Initialize app after authentication check
    initializeApp();
});

// State management
let currentMealType = 'breakfast';
let dailyCalories = {
    breakfast: 0,
    lunch: 0,
    dinner: 0
};

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

        // Add user message to chat
        addMessage(mealText, 'user');

        // Clear input
        mealInput.value = '';

        // Show loading message
        const loadingId = addLoadingMessage();

        try {
            // Send to backend API
            const response = await fetch('http://localhost:3000/api/estimate-calories', {
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
                
                // Update stats
                dailyCalories[currentMealType] += data.calories;
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
    }

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

