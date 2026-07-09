/**
 * SentinelCore SecureOps - Authentication Script
 */

document.addEventListener('DOMContentLoaded', () => {
    // Pre-authentication check: redirect to dashboard if session exists
    const activeSessionCheck = localStorage.getItem('sentinel_session');
    if (activeSessionCheck) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const alertContainer = document.getElementById('validationAlert');
    const forgotBtn = document.getElementById('forgotBtn');

    // Toggle buttons and containers
    const toggleRegisterBtn = document.getElementById('toggleRegisterBtn');
    const toggleLoginBtn = document.getElementById('toggleLoginBtn');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');

    // Hardcoded authentication registry (User credentials matching requirements)
    const userRegistry = {
        'admin': { password: 'admin123', role: 'Admin', display: 'Security Admin' },
        'user': { password: 'user123', role: 'User', display: 'User Access' },
        'analyst': { password: 'analyst123', role: 'Threat Analyst', display: 'Threat Analyst' }
    };

    // Toggle event listeners
    toggleRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alertContainer.style.display = 'none';
        loginFormContainer.style.display = 'none';
        registerFormContainer.style.display = 'block';
        document.getElementById('regUsername').focus();
    });

    toggleLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alertContainer.style.display = 'none';
        registerFormContainer.style.display = 'none';
        loginFormContainer.style.display = 'block';
        document.getElementById('username').focus();
    });

    /**
     * Render alert banner with specific validation feedback
     * @param {string} text - Error details
     * @param {string} type - Alert class type
     */
    function showAlert(text, type = 'danger') {
        alertContainer.innerText = text;
        alertContainer.style.display = 'block';

        alertContainer.className = 'alert';
        if (type === 'danger') {
            alertContainer.classList.add('alert-danger');

            // Auto-shake login card for dynamic tactile feedback
            const card = document.querySelector('.login-card');
            card.style.animation = 'none';
            void card.offsetWidth; // Trigger reflow
            card.style.animation = 'loginShake 0.4s ease-in-out';
        } else {
            // Success alert green style (inlined dynamically for styling consistency)
            alertContainer.style.backgroundColor = 'rgba(52, 199, 89, 0.1)';
            alertContainer.style.borderColor = 'rgba(52, 199, 89, 0.3)';
            alertContainer.style.color = '#30d158';
        }
    }

    // Wrap older showError function for safety
    function showError(text) {
        showAlert(text, 'danger');
    }

    // Inject dynamic shake keyframes into document
    if (!document.getElementById('shake-keyframes')) {
        const style = document.createElement('style');
        style.id = 'shake-keyframes';
        style.innerHTML = `
      @keyframes loginShake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-8px); }
        40%, 80% { transform: translateX(8px); }
      }
    `;
        document.head.appendChild(style);
    }

    // Handle Form Registration
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alertContainer.style.display = 'none';

        const regUser = document.getElementById('regUsername').value.trim().toLowerCase();
        const regPass = document.getElementById('regPassword').value;
        const regRoleVal = document.getElementById('regRole').value;

        // Validation: Cannot overwrite hardcoded users
        if (userRegistry[regUser]) {
            showError('Registration failure: Service ID is reserved by System Admin.');
            return;
        }

        // Fetch custom users registry
        const customUsers = JSON.parse(localStorage.getItem('sentinel_users') || '{}');
        if (customUsers[regUser]) {
            showError('Registration failure: Operator ID is already registered.');
            return;
        }

        // Register new user parameters
        customUsers[regUser] = {
            password: regPass,
            role: regRoleVal,
            display: `Op: ${regUser.toUpperCase()}`
        };

        localStorage.setItem('sentinel_users', JSON.stringify(customUsers));

        // Redirect inputs back to login
        document.getElementById('username').value = regUser;
        document.getElementById('password').value = regPass;
        document.getElementById('role').value = regRoleVal;

        // Switch panel and show success notice
        registerFormContainer.style.display = 'none';
        loginFormContainer.style.display = 'block';
        showAlert('Operator Registration Successful. Log in to authenticate.', 'success');

        // Reset registration fields
        registerForm.reset();
    });

    // Handle Form Submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Remove style overrides from success banner if any style remains
        alertContainer.removeAttribute('style');
        alertContainer.style.display = 'none';

        const usernameInput = document.getElementById('username').value.trim().toLowerCase();
        const passwordInput = document.getElementById('password').value;
        const roleInput = document.getElementById('role').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validate User Directory (fallback to localStorage users)
        const customUsers = JSON.parse(localStorage.getItem('sentinel_users') || '{}');
        const account = userRegistry[usernameInput] || customUsers[usernameInput];

        if (!account) {
            showError('Authentication failure: Unknown Operator ID.');
            return;
        }

        if (account.password !== passwordInput) {
            showError('Authentication failure: Invalid security token.');
            return;
        }

        if (account.role !== roleInput) {
            showError(`Clearance mismatch: Selected '${roleInput}' does not match assigned role for this ID.`);
            return;
        }

        // Successful credentials validation - generate local session token
        const sessionObj = {
            username: usernameInput,
            displayName: account.display,
            role: account.role,
            authenticated: true,
            remember: rememberMe,
            timestamp: Date.now()
        };

        localStorage.setItem('sentinel_session', JSON.stringify(sessionObj));

        // Redirect to operational dashboard
window.location.href = '/dashboard';
    });

    // Forgot password callback dialog
    forgotBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('For security reasons, credential resets require SentinelCore physical HSM terminal configurations. Please consult the Infrastructure Integrity team.');
    });
});
