import { authService } from '../services/auth.service';
import { renderLogin } from '../modules/auth/auth.view';
import { renderDashboard } from '../modules/cv/dashboard.view';
import { api } from '../services/api';
import type { CV } from '../types';

export async function initRouter(): Promise<void> {
  const path = window.location.pathname;

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

function getViewerUrl(fileUrl: string): string {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
}

async function renderPublicCV(id: string): Promise<void> {
  const app = document.getElementById('app')!;

  app.innerHTML = `
    <div class="public-page">
      <div class="public-page__loading">
        <div class="spinner"></div>
        <p>Loading CV...</p>
      </div>
    </div>`;

  const res = await api.getPublic<CV>(`cv-public?id=${id}`);

  if (!res.success || !res.data) {
    app.innerHTML = `
      <div class="public-page public-page--center">
        <div class="neu-card public-error">
          <i class="fa fa-exclamation-circle"></i>
          <h2>CV not found</h2>
          <p>This CV may have been removed or the link is invalid.</p>
          <a href="/" class="btn btn--primary"><i class="fa fa-home"></i> Go Home</a>
        </div>
      </div>`;
    return;
  }

  const cv = res.data;
  const viewerUrl = getViewerUrl(cv.fileUrl);

  app.innerHTML = `
    <div class="public-page">
      <div class="public-navbar neu-nav">
        <div class="navbar__brand">
          <i class="fa fa-file-text-o"></i>
          <span>CVora</span>
        </div>
        <div class="public-navbar__meta">
          <span class="public-navbar__title">${escapeHtml(cv.title)}</span>
        </div>
        <div class="navbar__actions">
          <button id="pub-toggle" class="btn btn--ghost btn--sm">
            <i class="fa fa-refresh"></i> Switch viewer
          </button>
          <a href="${cv.fileUrl}" download="${escapeHtml(cv.title)}.pdf" class="btn btn--primary btn--sm">
            <i class="fa fa-download"></i> Download
          </a>
        </div>
      </div>

      <div class="public-viewer">
        <div id="pub-loading" class="viewer-loading">
          <div class="spinner"></div>
          <p>Loading preview...</p>
        </div>
        <iframe
          id="pub-iframe"
          src="${viewerUrl}"
          title="${escapeHtml(cv.title)}"
          class="public-frame"
          loading="lazy"
        ></iframe>
      </div>
    </div>`;

  const iframe = document.getElementById('pub-iframe') as HTMLIFrameElement;
  const loading = document.getElementById('pub-loading')!;
  iframe.addEventListener('load', () => loading.style.display = 'none');

  let useGoogle = true;
  document.getElementById('pub-toggle')?.addEventListener('click', () => {
    loading.style.display = 'flex';
    useGoogle = !useGoogle;
    iframe.src = useGoogle ? viewerUrl : cv.fileUrl;
  });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
