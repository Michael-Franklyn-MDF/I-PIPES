// --- DOM ---
const form = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMessageEl = document.getElementById('error-message');

if (!form) {
  throw new Error('Login form not found: #login-form');
}
if (!usernameInput) {
  throw new Error('Login input not found: #username');
}
if (!passwordInput) {
  throw new Error('Login input not found: #password');
}
if (!errorMessageEl) {
  throw new Error('Login error container not found: #error-message');
}

// --- Validation helpers ---
function required(value) {
  return value.trim().length > 0;
}

function validateField(key) {
  switch (key) {
    case 'username': {
      if (!required(usernameInput.value)) return 'Username is required.';
      return null;
    }
    case 'password': {
      if (!required(passwordInput.value)) return 'Password is required.';
      return null;
    }
    default:
      return 'Unknown field.';
  }
}

// --- UI helpers ---
function showError(message) {
  errorMessageEl.textContent = message || '';
}

function clearError() {
  errorMessageEl.textContent = '';
}

function setFieldState(inputEl, state) {
  inputEl.classList.remove('valid', 'invalid');
  if (state === 'valid') inputEl.classList.add('valid');
  if (state === 'invalid') inputEl.classList.add('invalid');
}

function validateAndMark(key) {
  const err = validateField(key);
  const inputEl = key === 'username' ? usernameInput : passwordInput;
  setFieldState(inputEl, err ? 'invalid' : 'valid');
  return { ok: !err, error: err };
}

const touched = { username: false, password: false };

function onBlur(key) {
  touched[key] = true;
  validateAndMark(key);
}

function onInput(key) {
  if (!touched[key]) return;
  validateAndMark(key);
}

// --- Events ---
usernameInput.addEventListener('blur', () => onBlur('username'));
usernameInput.addEventListener('input', () => onInput('username'));

passwordInput.addEventListener('blur', () => onBlur('password'));
passwordInput.addEventListener('input', () => onInput('password'));

form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearError();

  touched.username = true;
  touched.password = true;

  const usernameRes = validateAndMark('username');
  const passwordRes = validateAndMark('password');

  if (!usernameRes.ok) {
    showError(usernameRes.error);
    usernameInput.focus();
    return;
  }

  if (!passwordRes.ok) {
    showError(passwordRes.error);
    passwordInput.focus();
    return;
  }

  form.submit();
});

