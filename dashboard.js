// ═══════════════════════════════════════════════════════════════
// DASHBOARD ADMIN
// ═══════════════════════════════════════════════════════════════
async function pageDashboard() {
  const [{ count: totalEst }, { count: totalDoc }, { count: totalCursos }, { data: bimestres }, { data: notas }, { data: asist }] = await Promise.all([
    sb.from('estudiantes').select('*',{count:'exact',head:true}),
    sb.from('docentes').select('*',{count:'exact',head:true}),
    sb.from('cursos').select('*',{count:'exact',head:true}),
    sb.from('bimestres').select('*').order('numero'),
    sb.from('calificativo_bimestral').select('calificativo'),
    sb.from('registro_asistencia').select('estado').limit(500),
  ]);

  const dist = {AD:0,A:0,B:0,C:0};
  notas?.forEach(n => { if(dist[n.calificativo]!==undefined) dist[n.calificativo]++; });
  const totalNotas = Object.values(dist).reduce((a,b)=>a+b,0)||1;

  const totalAsist = asist?.length||1;
  const presentes = asist?.filter(a=>a.estado==='PRESENTE').length||0;
  const pctAsist = Math.round((presentes/totalAsist)*100);

  const bimAbier = bimestres?.filter(b=>b.estado==='ABIERTO').length||0;

  setContent(`
  <div class="stats-grid">
    <div class="stat-card green"><span class="stat-icon">🎓</span><div class="stat-label">Estudiantes</div><div class="stat-value">${totalEst||0}</div></div>
    <div class="stat-card blue"><span class="stat-icon">👨‍🏫</span><div class="stat-label">Docentes</div><div class="stat-value">${totalDoc||0}</div></div>
    <div class="stat-card purple"><span class="stat-icon">📚</span><div class="stat-label">Cursos</div><div class="stat-value">${totalCursos||0}</div></div>
    <div class="stat-card orange"><span class="stat-icon">✅</span><div class="stat-label">% Asistencia</div><div class="stat-value">${pctAsist}%</div></div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px">
    <div class="card">
      <div class="card-header"><h3 style="font-weight:700;color:var(--g800);font-size:.95rem">📊 Distribución de Calificativos</h3></div>
      <div class="card-body">
        ${['AD','A','B','C'].map(k => {
          const colors = {AD:'#16a34a',A:'#22c55e',B:'#ca8a04',C:'#dc2626'};
          const labels = {AD:'AD – Logro Destacado',A:'A – Logro Esperado',B:'B – En Proceso',C:'C – En Inicio'};
          const pct = Math.round((dist[k]/totalNotas)*100);
          return `<div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:4px">
              <span style="font-weight:600;color:${colors[k]}">${labels[k]}</span>
              <span style="font-weight:700;color:#64748b">${dist[k]} (${pct}%)</span>
            </div>
            <div style="height:8px;background:#f1f5f9;border-radius:999px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${colors[k]};border-radius:999px;transition:width .5s"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 style="font-weight:700;color:var(--g800);font-size:.95rem">📅 Estado de Bimestres</h3></div>
      <div class="card-body">
        <div style="background:var(--g50);border-radius:8px;padding:12px;margin-bottom:12px;display:flex;align-items:center;gap:10px">
          <span style="font-size:1.5rem">📅</span>
          <div><b style="color:var(--g800)">${bimAbier} bimestre(s) abierto(s)</b><br><span style="font-size:.78rem;color:#64748b">Registro de notas activo</span></div>
        </div>
        ${[1,2,3,4].map(n => {
          const b = bimestres?.find(x=>x.numero===n);
          const open = b?.estado==='ABIERTO';
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:8px;margin-bottom:4px;background:${open?'var(--g50)':'#f8fafc'}">
            <span style="font-weight:600;font-size:.84rem">Bimestre ${n}</span>
            ${b ? `<span class="badge badge-${open?'green':'gray'}">${open?'🟢 Abierto':'⚫ Cerrado'}</span>` : '<span class="badge badge-gray">No creado</span>'}
          </div>`;
        }).join('')}
        <div style="margin-top:12px;padding:10px;background:#f8fafc;border-radius:8px;font-size:.75rem;color:#64748b">
          <b>MINEDU RVM N° 033-2022</b><br>AD=Logro Destacado · A=Logro Esperado · B=En Proceso · C=En Inicio
        </div>
      </div>
    </div>
  </div>
  `);
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD DOCENTE
// ═══════════════════════════════════════════════════════════════
async function pageDashboardDocente() {
  const docenteId = norm(currentPerfil?.id);
  if (!docenteId) { setContent(`<div class="alert alert-danger">Perfil docente no encontrado</div>`); return; }

  const [{ data: asig }, { data: alertas }] = await Promise.all([
    sb.from('asignacion_docente').select('*, cursos(nombre), secciones(nombre,grado), ano_escolar(anio)').eq('docente_id', docenteId),
    sb.from('calificativo_bimestral').select('estudiante_id,calificativo,estudiantes(nombre,apellido,seccion_id)').eq('docente_id', docenteId).eq('calificativo','C'),
  ]);

  const enRiesgo = [...new Map((alertas||[]).map(a => [norm(a.estudiante_id), a])).values()];

  setContent(`
  <div class="stats-grid">
    <div class="stat-card green"><span class="stat-icon">📋</span><div class="stat-label">Mis Cursos</div><div class="stat-value">${[...new Set(asig?.map(a=>norm(a.curso_id)))].length}</div></div>
    <div class="stat-card blue"><span class="stat-icon">🏫</span><div class="stat-label">Secciones</div><div class="stat-value">${[...new Set(asig?.map(a=>norm(a.seccion_id)))].length}</div></div>
    <div class="stat-card orange"><span class="stat-icon">⚠️</span><div class="stat-label">Estudiantes en C</div><div class="stat-value">${enRiesgo.length}</div></div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
    <div class="card">
      <div class="card-header"><h3 style="font-weight:700;font-size:.95rem;color:var(--g800)">📋 Mis asignaciones</h3></div>
      <div class="card-body" style="padding:12px">
        ${asig?.length ? asig.map(a=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:8px;margin-bottom:4px;background:var(--g50)">
            <div>
              <b style="font-size:.85rem;color:var(--g800)">${a.cursos?.nombre}</b>
              <div style="font-size:.75rem;color:#64748b">${a.secciones?.grado}° ${a.secciones?.nombre} · ${a.ano_escolar?.anio}</div>
            </div>
          </div>`).join('') : '<div class="empty-state"><p>Sin asignaciones</p></div>'}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 style="font-weight:700;font-size:.95rem;color:#dc2626">⚠️ Estudiantes en Riesgo (C)</h3></div>
      <div class="card-body" style="padding:12px">
        ${enRiesgo.length ? enRiesgo.map(a=>`
          <div style="padding:10px 12px;border-radius:8px;margin-bottom:4px;background:#fee2e2;border-left:3px solid #dc2626">
            <b style="font-size:.85rem;color:#7f1d1d">${a.estudiantes?.nombre} ${a.estudiantes?.apellido}</b>
            <div style="font-size:.75rem;color:#b91c1c">Calificativo C registrado</div>
          </div>`).join('') : `<div class="empty-state"><div class="ico">✅</div><p>Sin estudiantes en riesgo</p></div>`}
      </div>
    </div>
  </div>
  `);
}

