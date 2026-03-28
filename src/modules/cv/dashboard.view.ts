import { authService } from '../../services/auth.service';
import { cvService } from '../../services/cv.service';
import { showToast } from '../../components/toast';
import { showLoader, hideLoader } from '../../components/loader';
import { renderLogin } from '../auth/auth.view';
import { openCVForm } from './cv-form.view';
import { openCVPreview } from './cv-preview.view';
import { formatDate, generatePublicLink, copyToClipboard, debounce } from '../../utils/helpers';
import { storage } from '../../utils/storage';
import type { CV } from '../../types';

let allCVs: CV[] = [];
let sessionTimer: ReturnType<typeof setTimeout> | null = null;
let sessionWarningTimer: ReturnType<typeof setTimeout> | null = null;

const SESSION_WARNING_BEFORE_MS = 5 * 60 * 1000; // warn 5 min before expiry

function clearSessionTimers(): void {
  if (sessionTimer) clearTimeout(sessionTimer);
  if (sessionWarningTimer) clearTimeout(sessionWarningTimer);
}

function startSessionTimer(): void {
  clearSessionTimers();
  const expiresAt = storage.getExpiresAt();
  if (!expiresAt) return;

  const msLeft = expiresAt - Date.now();
  if (msLeft <= 0) {
    handleSessionExpired();
    return;
  }

  const warnAt = msLeft - SESSION_WARNING_BEFORE_MS;
  if (warnAt > 0) {
    sessionWarningTimer = setTimeout(() => {
      showToast({ message: 'Your session expires in 5 minutes', type: 'warning', duration: 6000 });
    }, warnAt);
  }

  sessionTimer = setTimeout(handleSessionExpired, msLeft);
}

function handleSessionExpired(): void {
  clearSessionTimers();
  authService.logout();
  showToast({ message: 'Your session has expired. Please sign in again.', type: 'info', duration: 5000 });
  renderLogin();
}

export function renderDashboard(): void {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    <div class="app-layout">
      <nav class="navbar neu-nav">
        <div class="navbar__brand">
          <i class="fa-solid fa-file-lines"></i>
          <span>CVora</span>
        </div>
        <div class="navbar__actions">
          <button id="theme-toggle" class="btn-icon" aria-label="Toggle theme">
            <i class="fa-solid fa-moon"></i>
          </button>
          <span class="navbar__user">
            <i class="fa-solid fa-circle-user"></i>
            <span id="nav-username">${authService.getUser()}</span>
          </span>
          <button id="logout-btn" class="btn btn--ghost btn--sm">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>
      </nav>

      <main class="main-content">
        <div class="dashboard-header">
          <div>
            <h1 class="dashboard-title">My CVs</h1>
            <p class="dashboard-subtitle">Manage and share your resumes</p>
          </div>
          <button id="create-cv-btn" class="btn btn--primary">
            <i class="fa-solid fa-plus"></i> New CV
          </button>
        </div>

        <div class="dashboard-toolbar">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input id="search-input" type="search" placeholder="Search CVs..." class="form-input" />
          </div>
        </div>

        <div id="cv-grid" class="cv-grid"></div>
      </main>
    </div>`;

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearSessionTimers();
    authService.logout();
    renderLogin();
  });

  document.getElementById('create-cv-btn')?.addEventListener('click', () => {
    openCVForm(null, () => loadCVs());
  });

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  startSessionTimer();

  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  searchInput.addEventListener('input', debounce(() => {
    renderCVCards(allCVs.filter(cv =>
      cv.title.toLowerCase().includes(searchInput.value.toLowerCase()) ||
      cv.description.toLowerCase().includes(searchInput.value.toLowerCase())
    ));
  }, 300));

  loadCVs();
}

async function loadCVs(): Promise<void> {
  const grid = document.getElementById('cv-grid')!;
  showLoader(grid);
  const res = await cvService.list();
  hideLoader(grid);

  if (!res.success) {
    showToast({ message: res.error || 'Failed to load CVs', type: 'error' });
    return;
  }

  allCVs = res.data || [];
  renderCVCards(allCVs);
}

function renderCVCards(cvs: CV[]): void {
  const grid = document.getElementById('cv-grid')!;

  if (cvs.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-folder-open"></i>
        <p>No CVs found. Create your first one!</p>
      </div>`;
    return;
  }

  grid.innerHTML = cvs.map(cv => `
    <div class="cv-card neu-card" data-id="${cv.id}">
      <div class="cv-card__icon">
        <i class="fa-solid fa-file-pdf"></i>
      </div>
      <div class="cv-card__body">
        <h3 class="cv-card__title">${escapeHtml(cv.title)}</h3>
        <p class="cv-card__desc">${escapeHtml(cv.description)}</p>
        <span class="cv-card__date">
          <i class="fa-regular fa-calendar"></i> ${formatDate(cv.createdAt)}
        </span>
      </div>
      <div class="cv-card__actions">
        <button class="btn-icon btn--view" data-id="${cv.id}" title="Preview">
          <i class="fa-solid fa-eye"></i>
        </button>
        <button class="btn-icon btn--edit" data-id="${cv.id}" title="Edit">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn-icon btn--copy" data-id="${cv.id}" title="Copy link">
          <i class="fa-solid fa-link"></i>
        </button>
        <button class="btn-icon btn--delete" data-id="${cv.id}" data-public-id="${cv.publicId}" title="Delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`).join('');

  grid.querySelectorAll('.btn--view').forEach(btn => {
    btn.addEventListener('click', () => {
      const cv = allCVs.find(c => c.id === (btn as HTMLElement).dataset['id']);
      if (cv) openCVPreview(cv);
    });
  });

  grid.querySelectorAll('.btn--edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const cv = allCVs.find(c => c.id === (btn as HTMLElement).dataset['id']);
      if (cv) openCVForm(cv, () => loadCVs());
    });
  });

  grid.querySelectorAll('.btn--copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).dataset['id']!;
      await copyToClipboard(generatePublicLink(id));
      showToast({ message: 'Link copied to clipboard!', type: 'success' });
    });
  });

  grid.querySelectorAll('.btn--delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = btn as HTMLElement;
      confirmDelete(el.dataset['id']!, el.dataset['publicId']!);
    });
  });
}

function confirmDelete(id: string, publicId: string): void {
  const cv = allCVs.find(c => c.id === id);
  if (!cv) return;

  const existing = document.getElementById('confirm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'confirm-modal';
  modal.className = 'modal-backdrop modal-backdrop--visible';
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal__header">
        <h2 class="modal__title">Delete CV</h2>
        <button class="modal__close btn-icon" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal__body">
        <p>Are you sure you want to delete <strong>${escapeHtml(cv.title)}</strong>? This cannot be undone.</p>
        <div class="modal__footer">
          <button id="cancel-delete" class="btn btn--ghost">Cancel</button>
          <button id="confirm-delete" class="btn btn--danger">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);

  modal.querySelector('.modal__close')?.addEventListener('click', () => modal.remove());
  document.getElementById('cancel-delete')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  document.getElementById('confirm-delete')?.addEventListener('click', async () => {
    modal.remove();
    const res = await cvService.delete(id, publicId);
    if (res.success) {
      showToast({ message: 'CV deleted successfully', type: 'success' });
      loadCVs();
    } else {
      showToast({ message: res.error || 'Delete failed', type: 'error' });
    }
  });
}

function toggleTheme(): void {
  const isLight = document.documentElement.classList.toggle('light');
  const icon = document.querySelector('#theme-toggle i') as HTMLElement;
  icon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  localStorage.setItem('cvora_theme', isLight ? 'light' : 'dark');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
