// --- DOM ---
const form = document.getElementById('signup-form');
const fullNameInput = document.getElementById('full-name');
const emailInput = document.getElementById('email');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const errorMsgEl = document.getElementById('error-msg');
const successMsgEl = document.getElementById('success-msg');

if (!form) {
  throw new Error('Signup form not found: #signup-form');
}

const fields = [
  { key: 'fullName', input: fullNameInput, label: 'Full name' },
  { key: 'email', input: emailInput, label: 'Email' },
  { key: 'username', input: usernameInput, label: 'Username' },
  { key: 'password', input: passwordInput, label: 'Password' },
  { key: 'confirmPassword', input: confirmPasswordInput, label: 'Confirm password' },
];

for (const f of fields) {
  if (!f.input) throw new Error(`Signup input not found for: ${f.key}`);
}

// --- Validation helpers ---
function required(value) {
  return value.trim().length > 0;
}

function isEmail(value) {
  const v = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function minLen(value, n) {
  return value.length >= n;
}

function validateField(key) {
  const fullName = fullNameInput.value;
  const email = emailInput.value;
  const username = usernameInput.value;
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  switch (key) {
    case 'fullName':
      if (!required(fullName)) return 'Full name is required.';
      return null;
    case 'email':
      if (!required(email)) return 'Email is required.';
      if (!isEmail(email)) return 'Please enter a valid email address.';
      return null;
    case 'username':
      if (!required(username)) return 'Username is required.';
      if (!minLen(username.trim(), 3)) return 'Username must be at least 3 characters.';
      return null;
    case 'password':
      if (!required(password)) return 'Password is required.';
      if (!minLen(password, 8)) return 'Password must be at least 8 characters.';
      return null;
    case 'confirmPassword':
      if (!required(confirmPassword)) return 'Please confirm your password.';
      if (confirmPassword !== password) return 'Passwords do not match.';
      return null;
    default:
      return 'Unknown field.';
  }
}

// --- Global messages ---
function showError(message) {
  errorMsgEl.textContent = message || '';
  successMsgEl.textContent = '';
}

function showSuccess(message) {
  successMsgEl.textContent = message || '';
  errorMsgEl.textContent = '';
}

function clearMessages() {
  errorMsgEl.textContent = '';
  successMsgEl.textContent = '';
}

// --- Field UI ---
function setFieldState(inputEl, state) {
  inputEl.classList.remove('valid', 'invalid');
  if (state === 'valid') inputEl.classList.add('valid');
  if (state === 'invalid') inputEl.classList.add('invalid');
}

function validateAndMark(key, { setMessage = false } = {}) {
  const err = validateField(key);
  const field = fields.find((f) => f.key === key);

  if (!field) return { ok: false, error: 'Unknown field.' };

  setFieldState(field.input, err ? 'invalid' : 'valid');
  if (setMessage) {
    if (err) showError(err);
    else clearMessages();
  }
  return { ok: !err, error: err };
}

const touched = Object.fromEntries(fields.map((f) => [f.key, false]));

function onBlur(key) {
  touched[key] = true;
  validateAndMark(key);

  if (key === 'password' && touched.confirmPassword) {
    validateAndMark('confirmPassword');
  }
}

function onInput(key) {
  if (!touched[key]) return;
  validateAndMark(key);

  if (key === 'password' && touched.confirmPassword) {
    validateAndMark('confirmPassword');
  }
}

// --- Events ---
for (const f of fields) {
  f.input.addEventListener('blur', () => onBlur(f.key));
  f.input.addEventListener('input', () => onInput(f.key));
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearMessages();

  const order = ['fullName', 'email', 'username', 'password', 'confirmPassword'];
  let firstInvalid = null;
  let firstError = null;

  for (const key of order) {
    touched[key] = true;
    const res = validateAndMark(key);
    if (!res.ok && !firstInvalid) {
      firstInvalid = fields.find((f) => f.key === key)?.input || null;
      firstError = res.error;
    }
  }

  if (firstInvalid) {
    showError(firstError || 'Please correct the highlighted fields.');
    firstInvalid.focus();
    return;
  }

  showSuccess('Looks good. Creating your account…');
  setTimeout(() => form.submit(), 150);
});

