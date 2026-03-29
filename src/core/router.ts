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
      // PDF CV — parse JSON and show via Google Docs viewer + direct download button
      const data = await response.json() as CV;
      if (!data?.fileUrl) { showError(app); return; }

      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(data.fileUrl)}&embedded=true`;
      iframe.src = viewerUrl;
      iframe.addEventListener('load', () => { loading.style.display = 'none'; }, { once: true });

      // Add floating download bar
      const bar = document.createElement('div');
      bar.className = 'cv-dl-bar';
      bar.innerHTML = `
        <button class="cv-dl-btn cv-dl-btn--primary" id="pdf-dl-btn">
          <i class="fa-solid fa-file-arrow-down"></i> Download PDF
        </button>`;
      app.appendChild(bar);

      document.getElementById('pdf-dl-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('pdf-dl-btn') as HTMLButtonElement;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Downloading...';
        try {
          const res = await fetch(data.fileUrl as string);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${data.title || 'cv'}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } catch {
          // fallback: open directly
          window.open(data.fileUrl, '_blank');
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Download PDF';
        }
      });
    }
  } catch {
    showError(app);
  }
}

function showError(app: HTMLElement): void {
  app.innerHTML = `
    <div class="public-page public-page--center">
      <div class="public-error">
        <div class="public-error__404">404</div>
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h2>CV Not Found</h2>
        <p>The CV you're looking for was either moved, deleted, or the secret URL is incorrect.</p>
        <a href="/" class="btn btn--primary"><i class="fa-solid fa-house"></i> Return Home</a>
      </div>
    </div>`;
}
