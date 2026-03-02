document.addEventListener('DOMContentLoaded', function () {

    // Grab elements from the HTML
    const form            = document.getElementById('signup-form');
    const fullName        = document.getElementById('full-name');
    const email           = document.getElementById('email');
    const username        = document.getElementById('username');
    const password        = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');
    const errorMsg        = document.getElementById('error-msg');
    const successMsg      = document.getElementById('success-msg');
  
    // Helper functions for showing messages
    function showError(message) {
      errorMsg.textContent = message;
      successMsg.textContent = '';
    }
  
    function showSuccess(message) {
      successMsg.textContent = message;
      errorMsg.textContent = '';
    }
  
    function clearMessages() {
      errorMsg.textContent = '';
      successMsg.textContent = '';
    }
  
    // Listen for form submit
    form.addEventListener('submit', function (e) {
  
      // Stop the default page refresh
      e.preventDefault();
  
      // Clear old messages
      clearMessages();
  
      // Read the values the user typed
      const nameVal    = fullName.value.trim();
      const emailVal   = email.value.trim();
      const userVal    = username.value.trim();
      const passVal    = password.value;
      const confirmVal = confirmPassword.value;
  
      // Check nothing is empty
      if (!nameVal || !emailVal || !userVal || !passVal || !confirmVal) {
        showError('Please fill in all fields.');
        return;
      }
  
      // Check email format
      if (!emailVal.includes('@') || !emailVal.includes('.')) {
        showError('Please enter a valid email address.');
        return;
      }
  
      // Check password length
      if (passVal.length < 8) {
        showError('Password must be at least 8 characters.');
        return;
      }
  
      // Check passwords match
      if (passVal !== confirmVal) {
        showError('Passwords do not match.');
        return;
      }
  
      // All checks passed — build the form data
      const formData = new FormData();
      formData.append('full_name', nameVal);
      formData.append('email', emailVal);
      formData.append('username', userVal);
      formData.append('password', passVal);
  
      // Send to signup.php in the background
      fetch('signup.php', {
        method: 'POST',
        body: formData
      })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          showSuccess('Account created! You can now log in.');
          form.reset();
        } else {
          showError(data.message);
        }
      })
      .catch(function () {
        showError('Something went wrong. Please try again.');
      });
  
    });
  
  });