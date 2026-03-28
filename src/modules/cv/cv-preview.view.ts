import { createModal, closeModal } from '../../components/modal';
import { generatePublicLink, copyToClipboard } from '../../utils/helpers';
import { showToast } from '../../components/toast';
import type { CV } from '../../types';

const MODAL_ID = 'cv-preview-modal';

export function openCVPreview(cv: CV): void {
  const bodyHtml = `
    <div class="preview-toolbar">
      <a href="${cv.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--ghost btn--sm">
        <i class="fa fa-external-link"></i> Open in new tab
      </a>
      <button id="copy-preview-link" class="btn btn--ghost btn--sm">
        <i class="fa fa-link"></i> Copy link
      </button>
      <a href="${cv.fileUrl}" download class="btn btn--primary btn--sm">
        <i class="fa fa-download"></i> Download
      </a>
    </div>
    <div class="pdf-viewer">
      <iframe
        src="${cv.fileUrl}#toolbar=0"
        title="${cv.title}"
        class="pdf-frame"
        loading="lazy"
      ></iframe>
    </div>`;

  createModal(MODAL_ID, cv.title, bodyHtml);

  document.getElementById('copy-preview-link')?.addEventListener('click', async () => {
    await copyToClipboard(generatePublicLink(cv.id));
    showToast({ message: 'Link copied!', type: 'success' });
    closeModal(MODAL_ID);
  });
}
