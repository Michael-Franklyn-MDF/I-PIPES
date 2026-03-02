document.addEventListener('DOMContentLoaded', function () {

    // Grab elements from the HTML
    const form     = document.getElementById('login-form');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const errorMsg = document.getElementById('error-msg');
  
    // Helper function to show an error
    function showError(message) {
      errorMsg.textContent = message;
    }
  
    function clearError() {
      errorMsg.textContent = '';
    }
  
    // Listen for form submit
    form.addEventListener('submit', function (e) {
  
      // Stop the default page refresh
      e.preventDefault();
  
      // Clear old error
      clearError();
  
      // Read the values the user typed
      const userVal = username.value.trim();
      const passVal = password.value;
  
      // Check nothing is empty
      if (!userVal || !passVal) {
        showError('Please enter your username and password.');
        return;
      }
  
      // Build the form data
      const formData = new FormData();
      formData.append('username', userVal);
      formData.append('password', passVal);
  
      // Send to login.php in the background
      fetch('login.php', {
        method: 'POST',
        body: formData
      })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          // Redirect to dashboard on success
          window.location.href = '../dashboard/index.php';
        } else {
          showError(data.message);
        }
      })
      .catch(function () {
        showError('Something went wrong. Please try again.');
      });
  
    });
  
  });