import type { ToastOptions } from '../types';

let container: HTMLElement | null = null;

function getContainer(): HTMLElement {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

export function showToast({ message, type, duration = 3500 }: ToastOptions): void {
  const c = getContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const iconMap = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
  toast.innerHTML = `<i class="fa-solid fa-${iconMap[type]}"></i><span>${message}</span>`;

  c.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}
