const ROLE_LABEL = { ADMINISTRADOR:'Administrador', DOCENTE:'Docente', ESTUDIANTE:'Estudiante', PADRE_FAMILIA:'Padre de Familia' };

const NAV_CONFIG = {
  ADMINISTRADOR: [
    { section: 'General' },
    { id:'dashboard', icon:'📊', label:'Dashboard' },
    { section: 'Gestión' },
    { id:'estudiantes', icon:'🎓', label:'Estudiantes' },
    { id:'docentes', icon:'👨‍🏫', label:'Docentes' },
    { id:'cursos', icon:'📚', label:'Cursos' },
    { id:'secciones', icon:'🏫', label:'Secciones' },
    { id:'asignaciones', icon:'🔗', label:'Asignaciones' },
    { section: 'Académico' },
    { id:'ano-escolar', icon:'📅', label:'Año Escolar' },
  ],
  DOCENTE: [
    { section: 'General' },
    { id:'dashboard-docente', icon:'📊', label:'Mi Dashboard' },
    { section: 'Notas' },
    { id:'evaluaciones', icon:'✏️', label:'Evaluaciones' },
    { id:'calificativo-bimestral', icon:'📝', label:'Calificativo Bimestral' },
    { id:'calificativo-final', icon:'🏆', label:'Calificativo Final' },
    { section: 'Asistencia' },
    { id:'asistencia', icon:'✅', label:'Registro Asistencia' },
    { section: 'Reportes' },
    { id:'consolidado', icon:'📑', label:'Consolidado' },
  ],
  ESTUDIANTE: [
    { section: 'Mi información' },
    { id:'mis-notas', icon:'📝', label:'Mis Notas' },
    { id:'mi-asistencia', icon:'✅', label:'Mi Asistencia' },
    { id:'mi-libreta', icon:'📖', label:'Mi Libreta' },
  ],
  PADRE_FAMILIA: [
    { section: 'Mi hijo' },
    { id:'hijo-notas', icon:'📝', label:'Notas' },
    { id:'hijo-asistencia', icon:'✅', label:'Asistencia' },
    { id:'hijo-libreta', icon:'📖', label:'Libreta Académica' },
  ],
};

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';

  // Topbar user
  const u = currentUser;
  document.getElementById('user-name').textContent = u.nombre;
  document.getElementById('user-role').textContent = ROLE_LABEL[u.rol] || u.rol;
  document.getElementById('user-avatar').textContent = (u.nombre || '?')[0].toUpperCase();

  // Build nav
  const nav = NAV_CONFIG[u.rol] || [];
  const container = document.getElementById('nav-container');
  container.innerHTML = nav.map(item => {
    if (item.section) return `<div class="sidebar-section">${item.section}</div>`;
    return `<button class="nav-item" data-page="${item.id}" onclick="navigate('${item.id}')">${item.icon ? `<span class="ico">${item.icon}</span>` : ''}<span>${item.label}</span></button>`;
  }).join('');

  // Navigate to default page
  const defaults = { ADMINISTRADOR:'dashboard', DOCENTE:'dashboard-docente', ESTUDIANTE:'mis-notas', PADRE_FAMILIA:'hijo-notas' };
  navigate(defaults[u.rol] || 'dashboard');
}

function navigate(pageId) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === pageId));
  document.getElementById('sidebar').classList.remove('open');
  renderPage(pageId);
}

