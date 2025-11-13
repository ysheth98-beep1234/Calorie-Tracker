// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
        // User is already logged in, redirect to main app
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize tabs
    initializeTabs();
});

// Current mode: 'register' or 'login'
let currentMode = 'register';

// DOM elements
const authForm = document.getElementById('authForm');
const userIdInput = document.getElementById('userId');
const submitBtn = document.getElementById('submitBtn');
const submitBtnText = document.getElementById('submitBtnText');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const registerTab = document.getElementById('registerTab');
const loginTab = document.getElementById('loginTab');

// Initialize tab switching
function initializeTabs() {
    registerTab.addEventListener('click', () => switchMode('register'));
    loginTab.addEventListener('click', () => switchMode('login'));
}

function switchMode(mode) {
    currentMode = mode;
    
    // Update tab styles
    if (mode === 'register') {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        submitBtnText.textContent = 'Register';
    } else {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        submitBtnText.textContent = 'Login';
    }
    
    // Clear messages
    hideError();
    hideSuccess();
    
    // Update placeholder
    userIdInput.placeholder = mode === 'register' 
        ? 'Choose a User ID' 
        : 'Enter your User ID';
}

// Handle form submission
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = userIdInput.value.trim();
    
    // Validate userid
    if (!userId) {
        showError('Please enter your User ID');
        return;
    }
    
    if (userId.length < 3) {
        showError('User ID must be at least 3 characters long');
        return;
    }
    
    // Clear previous messages
    hideError();
    hideSuccess();
    
    // Disable button during processing
    submitBtn.disabled = true;
    const originalText = submitBtnText.textContent;
    submitBtnText.textContent = currentMode === 'register' ? 'Registering...' : 'Logging in...';
    
    try {
        if (currentMode === 'register') {
            await handleRegister(userId);
        } else {
            await handleLogin(userId);
        }
    } catch (error) {
        console.error('Error during authentication:', error);
        showError('Could not connect to server. Please make sure the backend is running.');
        resetButton(originalText);
    }
});

// Handle registration
async function handleRegister(userId) {
        const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: userId
        })
    });
    
    const data = await response.json();
    
    if (!data.success) {
        showError(data.error || 'Registration failed. Please try again.');
        resetButton('Register');
        return;
    }
    
    // Registration successful
    showSuccess('Registration successful! Please login to continue.');
    resetButton('Register');
    
    // Clear input and switch to login mode after 2 seconds
    setTimeout(() => {
        userIdInput.value = '';
        switchMode('login');
        userIdInput.focus();
    }, 2000);
}

// Handle login
async function handleLogin(userId) {
        const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: userId
        })
    });
    
    const data = await response.json();
    
    if (!data.success) {
        showError(data.error || 'Login failed. Please try again.');
        resetButton('Login');
        return;
    }
    
    // Login successful - store userid and redirect
    localStorage.setItem('userId', userId);
    localStorage.setItem('loginTime', new Date().toISOString());
    
    // Redirect to main app
    window.location.href = 'index.html';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    
    // Hide error after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    errorMessage.style.display = 'none';
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

function hideSuccess() {
    successMessage.style.display = 'none';
}

function resetButton(text) {
    submitBtn.disabled = false;
    submitBtnText.textContent = text;
}

// Allow Enter key to submit
userIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        authForm.dispatchEvent(new Event('submit'));
    }
});
