// ═══════════════════════════════════════════════════════════════
// MODAL HELPERS
// ═══════════════════════════════════════════════════════════════
function showModal(title, body, onConfirm, confirmLabel='✅ Guardar', isDanger=false) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  box.innerHTML = `
  <div class="modal-header">
    <h3>${title}</h3>
    <button class="modal-close" onclick="closeModal()">×</button>
  </div>
  <div class="modal-body">${body}</div>
  <div class="modal-footer">
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn ${isDanger?'btn-danger':'btn-primary'}" id="modal-confirm-btn">${confirmLabel}</button>
  </div>`;
  document.getElementById('modal-confirm-btn').onclick = onConfirm;
  overlay.style.display = 'flex';
}

window.closeModal = () => { document.getElementById('modal-overlay').style.display='none'; };

