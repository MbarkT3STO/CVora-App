export function createModal(id: string, title: string, bodyHtml: string): HTMLElement {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = id;
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="${id}-title">
      <div class="modal__header">
        <h2 id="${id}-title" class="modal__title">${title}</h2>
        <button class="modal__close btn-icon" aria-label="Close modal">
          <i class="fa fa-times"></i>
        </button>
      </div>
      <div class="modal__body">${bodyHtml}</div>
    </div>`;

  document.body.appendChild(modal);

  modal.querySelector('.modal__close')?.addEventListener('click', () => closeModal(id));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(id); });

  requestAnimationFrame(() => modal.classList.add('modal-backdrop--visible'));
  return modal;
}

export function closeModal(id: string): void {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('modal-backdrop--visible');
  modal.addEventListener('transitionend', () => modal.remove(), { once: true });
}
