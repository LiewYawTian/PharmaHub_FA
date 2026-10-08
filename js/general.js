if (!localStorage.getItem('currentUser') && !window.location.pathname.endsWith('login.html')) {
    window.location.href = 'login.html';
}

// Real Time Clock
function updateClock() {
    const clockEl = document.getElementById('currentSystemClock');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleString();
    }
}
setInterval(updateClock, 1000);
updateClock();

// User Name Display and Logout Session
const userDisplay = document.getElementById('sidebarUsername');
const storedUser = localStorage.getItem('currentUser');
if (userDisplay && storedUser) {
    userDisplay.innerText = storedUser;
}

//Back to Login Page
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    });
}