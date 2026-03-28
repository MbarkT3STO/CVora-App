import { createModal, closeModal } from '../../components/modal';
import { generatePublicLink, copyToClipboard } from '../../utils/helpers';
import { showToast } from '../../components/toast';
import type { CV } from '../../types';

const MODAL_ID = 'cv-preview-modal';

// Cloudinary raw files trigger download — use Google Docs viewer to embed inline
function getViewerUrl(fileUrl: string): string {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
}

export function openCVPreview(cv: CV): void {
  const viewerUrl = getViewerUrl(cv.fileUrl);

  const bodyHtml = `
    <div class="preview-toolbar">
      <button id="toggle-viewer" class="btn btn--ghost btn--sm" data-mode="google">
        <i class="fa fa-refresh"></i> Switch viewer
      </button>
      <button id="copy-preview-link" class="btn btn--ghost btn--sm">
        <i class="fa fa-link"></i> Copy link
      </button>
      <a href="${cv.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--ghost btn--sm">
        <i class="fa fa-external-link"></i> Open file
      </a>
      <a href="${cv.fileUrl}" download="${cv.title}.pdf" class="btn btn--primary btn--sm">
        <i class="fa fa-download"></i> Download
      </a>
    </div>
    <div class="pdf-viewer">
      <div id="viewer-loading" class="viewer-loading">
        <div class="spinner"></div>
        <p>Loading preview...</p>
      </div>
      <iframe
        id="pdf-iframe"
        src="${viewerUrl}"
        title="${cv.title}"
        class="pdf-frame"
        loading="lazy"
      ></iframe>
    </div>
    <p class="viewer-hint">
      <i class="fa fa-info-circle"></i>
      If the preview doesn't load, click "Switch viewer" or "Open file".
    </p>`;

  createModal(MODAL_ID, cv.title, bodyHtml);

  // Hide spinner once iframe loads
  const iframe = document.getElementById('pdf-iframe') as HTMLIFrameElement;
  const loading = document.getElementById('viewer-loading')!;
  iframe.addEventListener('load', () => loading.style.display = 'none');

  // Toggle between Google Docs viewer and direct URL
  let useGoogle = true;
  document.getElementById('toggle-viewer')?.addEventListener('click', () => {
    loading.style.display = 'flex';
    useGoogle = !useGoogle;
    iframe.src = useGoogle ? viewerUrl : cv.fileUrl;
    const btn = document.getElementById('toggle-viewer')!;
    btn.dataset['mode'] = useGoogle ? 'google' : 'direct';
  });

  document.getElementById('copy-preview-link')?.addEventListener('click', async () => {
    await copyToClipboard(generatePublicLink(cv.id));
    showToast({ message: 'Link copied!', type: 'success' });
  });
}
