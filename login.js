// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
        // User is already logged in, redirect to main app
        window.location.href = 'index.html';
        return;
    }
});

// Handle login form submission
const loginForm = document.getElementById('loginForm');
const userIdInput = document.getElementById('userId');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', (e) => {
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
    
    // Disable button during processing
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span>Signing in...</span>';
    
    // Simulate a brief delay for better UX
    setTimeout(() => {
        // Store userid in localStorage
        localStorage.setItem('userId', userId);
        localStorage.setItem('loginTime', new Date().toISOString());
        
        // Redirect to main app
        window.location.href = 'index.html';
    }, 500);
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Allow Enter key to submit
userIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
});

