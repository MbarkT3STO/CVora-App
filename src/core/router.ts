import { authService } from '../services/auth.service';
import { renderLogin } from '../modules/auth/auth.view';
import { renderDashboard } from '../modules/cv/dashboard.view';
import { openCVPreview } from '../modules/cv/cv-preview.view';
import { cvService } from '../services/cv.service';
import { showToast } from '../components/toast';

export async function initRouter(): Promise<void> {
  const path = window.location.pathname;

  // Public CV view route
  if (path.startsWith('/cv/')) {
    const id = path.split('/cv/')[1];
    if (id) {
      await renderPublicCV(id);
      return;
    }
  }

  if (authService.isAuthenticated()) {
    renderDashboard();
  } else {
    renderLogin();
  }
}

async function renderPublicCV(id: string): Promise<void> {
  document.getElementById('app')!.innerHTML = `
    <div class="public-cv-page">
      <div class="neu-card" style="padding:2rem;text-align:center">
        <i class="fa fa-spinner fa-spin fa-2x"></i>
        <p>Loading CV...</p>
      </div>
    </div>`;

  const res = await cvService.list();
  if (!res.success || !res.data) {
    showToast({ message: 'CV not found', type: 'error' });
    return;
  }

  const cv = res.data.find(c => c.id === id);
  if (!cv) {
    document.getElementById('app')!.innerHTML = `
      <div class="public-cv-page">
        <div class="neu-card" style="padding:2rem;text-align:center">
          <i class="fa fa-exclamation-circle fa-2x"></i>
          <p>CV not found or has been removed.</p>
          <a href="/" class="btn btn--primary" style="margin-top:1rem">Go Home</a>
        </div>
      </div>`;
    return;
  }

  document.getElementById('app')!.innerHTML = `
    <nav class="navbar neu-nav">
      <div class="navbar__brand"><i class="fa fa-file-text-o"></i><span>CVora</span></div>
      <a href="/" class="btn btn--ghost btn--sm"><i class="fa fa-home"></i> Home</a>
    </nav>
    <div id="app-inner"></div>`;

  openCVPreview(cv);
}
