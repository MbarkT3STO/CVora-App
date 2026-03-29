import { authService } from '../services/auth.service';
import { renderLogin } from '../modules/auth/auth.view';
import { renderDashboard } from '../modules/cv/dashboard.view';
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

async function renderPublicCV(id: string): Promise<void> {
  const app = document.getElementById('app')!;

  app.innerHTML = `
    <div class="public-page">
      <div class="public-viewer">
        <div id="pub-loading" class="viewer-loading">
          <div class="spinner"></div>
          <p>Loading CV...</p>
        </div>
        <iframe id="pub-iframe" class="public-frame" title="CV" loading="lazy"></iframe>
      </div>
    </div>`;

  const iframe = document.getElementById('pub-iframe') as HTMLIFrameElement;
  const loading = document.getElementById('pub-loading')!;

  // First probe: fetch as JSON to detect type.
  // Built CVs return HTML (Content-Type: text/html) — the JSON parse will fail.
  // We detect this by checking the raw response content-type before parsing.
  const endpoint = `/.netlify/functions/cv-public?id=${encodeURIComponent(id)}`;

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      showError(app);
      return;
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      // Built CV — stream the HTML directly into the iframe
      const html = await response.text();
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
      loading.style.display = 'none';
    } else {
      // PDF CV — parse JSON and show via Google Docs viewer
      const data = await response.json() as CV;
      if (!data?.fileUrl) { showError(app); return; }

      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(data.fileUrl)}&embedded=true`;
      iframe.src = viewerUrl;
      iframe.addEventListener('load', () => { loading.style.display = 'none'; }, { once: true });
    }
  } catch {
    showError(app);
  }
}

function showError(app: HTMLElement): void {
  app.innerHTML = `
    <div class="public-page public-page--center">
      <div class="public-error">
        <i class="fa-solid fa-circle-exclamation"></i>
        <h2>CV not found</h2>
        <p>This CV may have been removed or the link is invalid.</p>
        <a href="/" class="btn btn--primary"><i class="fa-solid fa-house"></i> Go Home</a>
      </div>
    </div>`;
}
