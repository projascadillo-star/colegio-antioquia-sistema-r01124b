// ═══════════════════════════════════════════════════════════════
// VISTAS PADRE
// ═══════════════════════════════════════════════════════════════
async function pageHijoNotas() {
  const hijoId = norm(currentPerfil?.estudiante_id || currentPerfil?.estudiantes?.id);
  if (!hijoId) { setContent('<div class="alert alert-danger">No se encontró el hijo vinculado</div>'); return; }
  currentPerfil = { ...currentPerfil, id: hijoId };
  await pageMisNotas();
}

async function pageHijoAsistencia() {
  const hijoId = norm(currentPerfil?.estudiante_id || currentPerfil?.estudiantes?.id);
  if (!hijoId) { setContent('<div class="alert alert-danger">No se encontró el hijo vinculado</div>'); return; }
  const orig = currentPerfil?.id;
  currentPerfil = { ...currentPerfil, id: hijoId };
  await pageMiAsistencia();
  if (orig) currentPerfil = { ...currentPerfil, id: orig };
}

