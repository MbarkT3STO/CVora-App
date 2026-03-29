import { cvService } from '../../services/cv.service';
import { showToast } from '../../components/toast';
import { setButtonLoading } from '../../components/loader';
import { createModal, closeModal } from '../../components/modal';
import { fileToBase64 } from '../../utils/helpers';
import type { CV } from '../../types';

const MODAL_ID = 'cv-form-modal';

export function openCVForm(cv: CV | null, onSuccess: () => void): void {
  const isEdit = !!cv;
  const title = isEdit ? 'Edit CV' : 'Create New CV';

  const bodyHtml = `
    <form id="cv-form" class="form" novalidate>
      <div class="form-group">
        <label class="form-label" for="cv-title">
          <i class="fa-solid fa-tag"></i> Title <span class="required">*</span>
        </label>
        <input id="cv-title" type="text" class="form-input"
          placeholder="e.g. Software Engineer Resume"
          value="${cv ? escapeHtml(cv.title) : ''}" required />
      </div>
      <div class="form-group">
        <label class="form-label" for="cv-desc">
          <i class="fa-solid fa-align-left"></i> Description
        </label>
        <textarea id="cv-desc" class="form-input form-textarea"
          placeholder="Brief description of this CV..."
          rows="3">${cv ? escapeHtml(cv.description) : ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">
          <i class="fa-solid fa-file-pdf"></i> PDF File ${isEdit ? '(leave empty to keep current)' : '<span class="required">*</span>'}
        </label>
        <div id="drop-zone" class="drop-zone" role="button" tabindex="0" aria-label="Upload PDF">
          <i class="fa-solid fa-cloud-arrow-up drop-zone__icon"></i>
          <p class="drop-zone__text">Drag & drop PDF here or <span class="link">browse</span></p>
          <p class="drop-zone__hint">Max 10MB · PDF only</p>
          <input id="cv-file" type="file" accept=".pdf,application/pdf" class="drop-zone__input" />
        </div>
        <div id="file-preview" class="file-preview hidden"></div>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn btn--ghost" id="cancel-form-btn">Cancel</button>
        <button type="submit" id="submit-cv-btn" class="btn btn--primary">
          <i class="fa-solid fa-${isEdit ? 'floppy-disk' : 'plus'}"></i> ${isEdit ? 'Save Changes' : 'Create CV'}
        </button>
      </div>
    </form>`;

  const modal = createModal(MODAL_ID, title, bodyHtml);
  setupDropZone();

  document.getElementById('cancel-form-btn')?.addEventListener('click', () => closeModal(MODAL_ID));

  document.getElementById('cv-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-cv-btn') as HTMLButtonElement;
    const titleVal = (document.getElementById('cv-title') as HTMLInputElement).value.trim();
    const descVal = (document.getElementById('cv-desc') as HTMLTextAreaElement).value.trim();
    const fileInput = document.getElementById('cv-file') as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!titleVal) {
      showToast({ message: 'Title is required', type: 'warning' });
      return;
    }
    if (!isEdit && !file) {
      showToast({ message: 'Please select a PDF file', type: 'warning' });
      return;
    }

    setButtonLoading(btn, true);

    let res;
    if (isEdit) {
      const payload: Parameters<typeof cvService.update>[0] = {
        id: cv!.id,
        title: titleVal,
        description: descVal,
      };
      if (file) {
        payload.fileBase64 = await fileToBase64(file);
        payload.fileName = file.name;
      }
      res = await cvService.update(payload);
    } else {
      const fileBase64 = await fileToBase64(file!);
      res = await cvService.create({
        title: titleVal,
        description: descVal,
        fileBase64,
        fileName: file!.name,
      });
    }

    setButtonLoading(btn, false);

    if (res.success) {
      showToast({ message: `CV ${isEdit ? 'updated' : 'created'} successfully!`, type: 'success' });
      closeModal(MODAL_ID);
      onSuccess();
    } else {
      showToast({ message: res.error || 'Operation failed', type: 'error' });
    }
  });

  // Close on backdrop click is handled by modal.ts
  void modal;
}

function setupDropZone(): void {
  const dropZone = document.getElementById('drop-zone')!;
  const fileInput = document.getElementById('cv-file') as HTMLInputElement;
  const preview = document.getElementById('file-preview')!;

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drop-zone--active');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drop-zone--active'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drop-zone--active');
    const file = e.dataTransfer?.files[0];
    if (file) handleFile(file, fileInput, preview, dropZone);
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) handleFile(file, fileInput, preview, dropZone);
  });
}

function handleFile(file: File, input: HTMLInputElement, preview: HTMLElement, dropZone: HTMLElement): void {
  if (file.type !== 'application/pdf') {
    showToast({ message: 'Only PDF files are allowed', type: 'error' });
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast({ message: 'File must be under 10MB', type: 'error' });
    return;
  }

  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;

  preview.classList.remove('hidden');
  preview.innerHTML = `
    <i class="fa-solid fa-file-pdf"></i>
    <span>${escapeHtml(file.name)}</span>
    <span class="file-size">${(file.size / 1024).toFixed(1)} KB</span>
    <button type="button" class="btn-icon" id="remove-file" aria-label="Remove file">
      <i class="fa-solid fa-xmark"></i>
    </button>`;
  dropZone.classList.add('drop-zone--has-file');

  document.getElementById('remove-file')?.addEventListener('click', () => {
    input.value = '';
    preview.classList.add('hidden');
    preview.innerHTML = '';
    dropZone.classList.remove('drop-zone--has-file');
  });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
