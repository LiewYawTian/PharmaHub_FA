const form = document.getElementById('loginForm');
const errorBox = document.getElementById('loginErrorMessage');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('currentUser', data.username);
            window.location.href = 'index.html';
        } 
        else {
            errorBox.innerText = data.message;
            errorBox.style.display = 'block';
        }
    })
    .catch(() => {
        errorBox.innerText = 'Server error, please check connection.';
        errorBox.style.display = 'block';
    });
});