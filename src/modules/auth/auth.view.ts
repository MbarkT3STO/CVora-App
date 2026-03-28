import { authService } from '../../services/auth.service';
import { showToast } from '../../components/toast';
import { setButtonLoading } from '../../components/loader';
import { renderDashboard } from '../cv/dashboard.view';

export function renderLogin(): void {
  document.getElementById('app')!.innerHTML = `
    <div class="auth-page">
      <div class="auth-card neu-card">
        <div class="auth-card__logo">
          <i class="fa fa-file-text-o"></i>
          <span>CVora</span>
        </div>
        <h1 class="auth-card__title">Welcome back</h1>
        <p class="auth-card__subtitle">Sign in to manage your CVs</p>
        <form id="login-form" class="form" novalidate>
          <div class="form-group">
            <label class="form-label" for="username">
              <i class="fa fa-user"></i> Username
            </label>
            <input id="username" name="username" type="text" class="form-input"
              placeholder="Enter username" autocomplete="username" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="password">
              <i class="fa fa-lock"></i> Password
            </label>
            <div class="input-wrapper">
              <input id="password" name="password" type="password" class="form-input"
                placeholder="Enter password" autocomplete="current-password" required />
              <button type="button" class="btn-icon input-toggle" id="toggle-pw" aria-label="Toggle password">
                <i class="fa fa-eye"></i>
              </button>
            </div>
          </div>
          <button type="submit" id="login-btn" class="btn btn--primary btn--full">
            <i class="fa fa-sign-in"></i> Sign In
          </button>
        </form>
        <p class="auth-card__hint">Demo: admin / admin123</p>
      </div>
    </div>`;

  document.getElementById('toggle-pw')?.addEventListener('click', () => {
    const pw = document.getElementById('password') as HTMLInputElement;
    const icon = document.querySelector('#toggle-pw i') as HTMLElement;
    if (pw.type === 'password') {
      pw.type = 'text';
      icon.className = 'fa fa-eye-slash';
    } else {
      pw.type = 'password';
      icon.className = 'fa fa-eye';
    }
  });

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn') as HTMLButtonElement;
    const username = (document.getElementById('username') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value;

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
}
