// ═══════════════════════════════════════════════════════════════
// AUTH — ahora vía auth-service (a través del gateway)
// La contraseña sigue sin tocarse en el frontend: viaja directo
// al backend, que es quien habla con Supabase Auth.
// ═══════════════════════════════════════════════════════════════
async function doLogin() {
  const correo = document.getElementById('login-correo').value.trim();
  const pass   = document.getElementById('login-pass').value;
  const errEl  = document.getElementById('login-error');
  const btn    = document.getElementById('login-btn');
  errEl.style.display = 'none';
  if (!correo || !pass) { showError(errEl, 'Ingresa correo y contraseña'); return; }
  btn.textContent = 'Ingresando...'; btn.disabled = true;

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, pass }),
    });

    currentUser = data.user;
    currentPerfil = data.perfil;

    sessionStorage.setItem('ca_user', JSON.stringify(currentUser));
    sessionStorage.setItem('ca_perfil', JSON.stringify(currentPerfil));
    sessionStorage.setItem('ca_token', data.session.access_token);
    sessionStorage.setItem('ca_refresh', data.session.refresh_token);

    // TEMPORAL: mientras las páginas viejas sigan usando el cliente sb
    // directo, hay que "avisarle" a Supabase en el navegador cuál es la
    // sesión activa — si no, RLS bloquea todas las lecturas porque el
    // cliente sb local queda anónimo (el login real ocurrió en el backend).
    await sb.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    showApp();

  } catch (e) {
    showError(errEl, e.message);
  } finally {
    btn.textContent = 'Ingresar al sistema';
    btn.disabled = false;
  }
}

function showError(el, msg) { el.textContent = msg; el.style.display = 'block'; }

async function doLogout() {
  try { await apiFetch('/auth/logout', { method: 'POST' }); } catch (e) {}
  await sb.auth.signOut();
  currentUser = null;
  currentPerfil = null;
  sessionStorage.removeItem('ca_user');
  sessionStorage.removeItem('ca_perfil');
  sessionStorage.removeItem('ca_token');
  sessionStorage.removeItem('ca_refresh');
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}

