// ═══════════════════════════════════════════════════════════════
// APP INIT — restaurar sesión si ya estaba logueado
// ═══════════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', async () => {
  // Restaurar sesión: si hay token guardado, lo validamos contra auth-service
  const token = sessionStorage.getItem('ca_token');
  const refreshToken = sessionStorage.getItem('ca_refresh');
  if (token) {
    try {
      const { user } = await apiFetch('/auth/session');
      currentUser = user;
      currentPerfil = JSON.parse(sessionStorage.getItem('ca_perfil') || 'null');

      // TEMPORAL: mismo motivo que en doLogin — sincronizar la sesión
      // con el cliente sb local para que las páginas no migradas vean datos
      if (refreshToken) {
        await sb.auth.setSession({ access_token: token, refresh_token: refreshToken });
      }

      showApp();
    } catch (e) {
      // Token inválido o expirado: limpiar y dejar en login
      sessionStorage.removeItem('ca_user');
      sessionStorage.removeItem('ca_perfil');
      sessionStorage.removeItem('ca_token');
      sessionStorage.removeItem('ca_refresh');
    }
  }

  // Enter en campo contraseña
  document.getElementById('login-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });

  // Dark mode
  if (localStorage.getItem('ca_dark') === '1') document.body.classList.add('dark');
});

function toggleDark() {
  document.body.classList.toggle('dark');
  localStorage.setItem('ca_dark', document.body.classList.contains('dark') ? '1' : '0');
}

