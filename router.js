// ═══════════════════════════════════════════════════════════════
// PAGE ROUTER
// ═══════════════════════════════════════════════════════════════
async function renderPage(id) {
  const titles = {
    'dashboard':'Dashboard', 'dashboard-docente':'Mi Dashboard',
    'estudiantes':'Estudiantes', 'docentes':'Docentes', 'cursos':'Cursos y Competencias',
    'secciones':'Secciones', 'asignaciones':'Asignaciones', 'ano-escolar':'Año Escolar',
    'evaluaciones':'Evaluaciones', 'calificativo-bimestral':'Calificativo Bimestral',
    'calificativo-final':'Calificativo Final', 'asistencia':'Registro de Asistencia',
    'consolidado':'Consolidado de Notas','mis-notas':'Mis Notas',
    'mi-asistencia':'Mi Asistencia', 'mi-libreta':'Mi Libreta',
    'hijo-notas':'Notas de Mi Hijo','hijo-asistencia':'Asistencia del Hijo','hijo-libreta':'Libreta Académica',
  };
  document.getElementById('topbar-title').textContent = titles[id] || id;
  setContent('<div class="loading-page"><div class="spinner"></div></div>');

  try {
    switch(id) {
      case 'dashboard': await pageDashboard(); break;
      case 'dashboard-docente': await pageDashboardDocente(); break;
      case 'estudiantes': await pageEstudiantes(); break;
      case 'docentes': await pageDocentes(); break;
      case 'cursos': await pageCursos(); break;
      case 'secciones': await pageSecciones(); break;
      case 'asignaciones': await pageAsignaciones(); break;
      case 'ano-escolar': await pageAnoEscolar(); break;
      case 'evaluaciones': await pageEvaluaciones(); break;
      case 'calificativo-bimestral': await pageCalificativoBimestral(); break;
      case 'calificativo-final': await pageCalificativoFinal(); break;
      case 'asistencia': await pageAsistencia(); break;
      case 'consolidado': await pageConsolidado(); break;
      case 'mis-notas': await pageMisNotas(); break;
      case 'mi-asistencia': await pageMiAsistencia(); break;
      case 'mi-libreta': await pageLibreta(currentPerfil?.id); break;
      case 'hijo-notas': await pageHijoNotas(); break;
      case 'hijo-asistencia': await pageHijoAsistencia(); break;
      case 'hijo-libreta': await pageLibreta(currentPerfil?.estudiante_id || currentPerfil?.estudiantes?.id); break;
      default: setContent(`<div class="empty-state"><div class="ico">🚧</div><p>Página en construcción</p></div>`);
    }
  } catch(e) {
    setContent(`<div class="alert alert-danger">⚠️ Error al cargar: ${e.message}</div>`);
    console.error(e);
  }
}

function setContent(html) { document.getElementById('page-content').innerHTML = html; }

