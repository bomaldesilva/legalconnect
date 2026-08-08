'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // --- Registration Logic ---
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    const errorBox = document.getElementById('authError');
    const submitBtn = document.getElementById('registerSubmit');

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const role = document.getElementById('regRole').value;
      const firstName = document.getElementById('regFirstName').value;
      const lastName = document.getElementById('regLastName').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;

      if (!role) {
        showError(errorBox, 'Please select your role.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';
      hideError(errorBox);

      try {
        const data = await window.authApi.register({
          role,
          first_name: firstName,
          last_name: lastName,
          email,
          password
        });
        
        // Redirect based on role — pass ?welcome=1 so dashboard shows a welcome banner
        if (data.role === 'Client') {
          window.location.href = 'client_dashboard.html?welcome=1';
        } else if (data.role === 'Lawyer') {
          window.location.href = 'lawyer_dashboard.html?welcome=1';
        } else {
          window.location.href = 'admin_dashboard.html?welcome=1';
        }

      } catch (err) {
        showError(errorBox, err.message || 'Registration failed. Please check your details.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up →';
      }
    });
  }

  // --- Login Logic ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const errorBox = document.getElementById('authError');
    const submitBtn = document.getElementById('loginSubmit');
    const expectedRole = loginForm.getAttribute('data-role');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';
      hideError(errorBox);

      try {
        const data = await window.authApi.login(email, password);
        
        if (expectedRole && data.role !== expectedRole) {
          throw new Error(`This portal is for ${expectedRole}s. Please use the correct login portal.`);
        }

        // Redirect based on role
        if (data.role === 'Client') {
          window.location.href = 'client_dashboard.html';
        } else if (data.role === 'Lawyer') {
          window.location.href = 'lawyer_dashboard.html';
        } else {
          window.location.href = 'admin_dashboard.html';
        }

      } catch (err) {
        showError(errorBox, err.message || 'Invalid credentials.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In →';
      }
    });
  }

  function showError(el, msg) {
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
    }
  }

  function hideError(el) {
    if (el) {
      el.style.display = 'none';
      el.textContent = '';
    }
  }

});
