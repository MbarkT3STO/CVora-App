import { authService } from '../../services/auth.service';
import { showToast } from '../../components/toast';
import { setButtonLoading } from '../../components/loader';
import { renderDashboard } from '../cv/dashboard.view';

export function renderLogin(): void {
  document.getElementById('app')!.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card__logo">
          <i class="fa-solid fa-file-lines"></i>
          <span>CVora</span>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab auth-tab--active" data-tab="login">Sign In</button>
          <button class="auth-tab" data-tab="register">Register</button>
        </div>

        <!-- Login Form -->
        <div id="tab-login">
          <h1 class="auth-card__title">Welcome back</h1>
          <p class="auth-card__subtitle">Sign in to manage your CVs</p>
          <form id="login-form" class="form" novalidate>
            <div class="form-group">
              <label class="form-label" for="login-username">
                <i class="fa-solid fa-user"></i> Username
              </label>
              <input id="login-username" name="username" type="text" class="form-input"
                placeholder="Enter username" autocomplete="username" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">
                <i class="fa-solid fa-lock"></i> Password
              </label>
              <div class="input-wrapper">
                <input id="login-password" name="password" type="password" class="form-input"
                  placeholder="Enter password" autocomplete="current-password" required />
                <button type="button" class="btn-icon input-toggle" id="toggle-login-pw" aria-label="Toggle password">
                  <i class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>
            <button type="submit" id="login-btn" class="btn btn--primary btn--full">
              <i class="fa-solid fa-right-to-bracket"></i> Sign In
            </button>
          </form>
          <p class="auth-card__hint">Demo: admin / admin123</p>
        </div>

        <!-- Register Form -->
        <div id="tab-register" class="hidden">
          <h1 class="auth-card__title">Create account</h1>
          <p class="auth-card__subtitle">Start managing your CVs today</p>
          <form id="register-form" class="form" novalidate>
            <div class="form-group">
              <label class="form-label" for="reg-username">
                <i class="fa-solid fa-user"></i> Username <span class="required">*</span>
              </label>
              <input id="reg-username" name="username" type="text" class="form-input"
                placeholder="Min. 3 characters" autocomplete="username" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-password">
                <i class="fa-solid fa-lock"></i> Password <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <input id="reg-password" name="password" type="password" class="form-input"
                  placeholder="Min. 6 characters" autocomplete="new-password" required />
                <button type="button" class="btn-icon input-toggle" id="toggle-reg-pw" aria-label="Toggle password">
                  <i class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-confirm">
                <i class="fa-solid fa-lock"></i> Confirm Password <span class="required">*</span>
              </label>
              <input id="reg-confirm" name="confirm" type="password" class="form-input"
                placeholder="Repeat password" autocomplete="new-password" required />
            </div>
            <button type="submit" id="register-btn" class="btn btn--primary btn--full">
              <i class="fa-solid fa-user-plus"></i> Create Account
            </button>
          </form>
        </div>
      </div>
    </div>`;

  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = (tab as HTMLElement).dataset['tab']!;
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('auth-tab--active'));
      tab.classList.add('auth-tab--active');
      document.getElementById('tab-login')!.classList.toggle('hidden', target !== 'login');
      document.getElementById('tab-register')!.classList.toggle('hidden', target !== 'register');
    });
  });

  // Password toggles
  setupPasswordToggle('toggle-login-pw', 'login-password');
  setupPasswordToggle('toggle-reg-pw', 'reg-password');

  // Login submit
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn') as HTMLButtonElement;
    const username = (document.getElementById('login-username') as HTMLInputElement).value.trim();
    const password = (document.getElementById('login-password') as HTMLInputElement).value;

    if (!username || !password) {
      showToast({ message: 'Please fill in all fields', type: 'warning' });
      return;
    }

    setButtonLoading(btn, true);
    const result = await authService.login({ username, password });
    setButtonLoading(btn, false);

    if (result.success) {
      showToast({ message: 'Welcome back!', type: 'success' });
      renderDashboard();
    } else {
      showToast({ message: result.error || 'Login failed', type: 'error' });
    }
  });

  // Register submit
  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('register-btn') as HTMLButtonElement;
    const username = (document.getElementById('reg-username') as HTMLInputElement).value.trim();
    const password = (document.getElementById('reg-password') as HTMLInputElement).value;
    const confirm = (document.getElementById('reg-confirm') as HTMLInputElement).value;

    if (!username || !password || !confirm) {
      showToast({ message: 'Please fill in all fields', type: 'warning' });
      return;
    }
    if (password !== confirm) {
      showToast({ message: 'Passwords do not match', type: 'warning' });
      return;
    }

    setButtonLoading(btn, true);
    const result = await authService.register({ username, password });
    setButtonLoading(btn, false);

    if (result.success) {
      showToast({ message: 'Account created! Welcome to CVora.', type: 'success' });
      renderDashboard();
    } else {
      showToast({ message: result.error || 'Registration failed', type: 'error' });
    }
  });
}

function setupPasswordToggle(btnId: string, inputId: string): void {
  document.getElementById(btnId)?.addEventListener('click', () => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    const icon = document.querySelector(`#${btnId} i`) as HTMLElement;
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fa-solid fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fa-solid fa-eye';
    }
  });
}
