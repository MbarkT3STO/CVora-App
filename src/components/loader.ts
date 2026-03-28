export function showLoader(container: HTMLElement): void {
  container.classList.add('loading');
  const existing = container.querySelector('.loader-overlay');
  if (existing) return;
  const overlay = document.createElement('div');
  overlay.className = 'loader-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  container.appendChild(overlay);
}

export function hideLoader(container: HTMLElement): void {
  container.classList.remove('loading');
  container.querySelector('.loader-overlay')?.remove();
}

export function setButtonLoading(btn: HTMLButtonElement, loading: boolean): void {
  if (loading) {
    btn.disabled = true;
    btn.dataset['originalText'] = btn.innerHTML;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Loading...';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset['originalText'] || btn.innerHTML;
  }
}
