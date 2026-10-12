// ═══════════════════════════════════════════════════════════════
// VISTAS ESTUDIANTE
// ═══════════════════════════════════════════════════════════════
async function pageMisNotas() {
  const estId = norm(currentPerfil?.id);
  const [{ data: evals }, { data: cb }] = await Promise.all([
    sb.from('nota_evaluacion').select('*, evaluaciones(nombre,tipo,fecha,competencias(nombre,cursos(nombre)),bimestres(numero))').eq('estudiante_id',estId).order('created_at',{ascending:false}),
    sb.from('calificativo_bimestral').select('*, competencias(nombre,cursos(nombre)), bimestres(numero)').eq('estudiante_id',estId),
  ]);

  setContent(`
  <div class="tabs" id="notas-tabs">
    <button class="tab active" onclick="switchTab(this,'tab-eval')">📝 Evaluaciones</button>
    <button class="tab" onclick="switchTab(this,'tab-cb')">📋 Calificativos Bimestrales</button>
  </div>
  <div id="tab-eval">
    <div class="card">
      <div class="table-wrap">
        ${evals?.length ? `
        <table>
          <thead><tr><th>Evaluación</th><th>Tipo</th><th>Competencia</th><th>Curso</th><th>Bimestre</th><th>Fecha</th><th>Calificativo</th></tr></thead>
          <tbody>
          ${evals.map(n=>`<tr>
            <td>${n.evaluaciones?.nombre}</td>
            <td><span class="badge badge-blue">${n.evaluaciones?.tipo}</span></td>
            <td>${n.evaluaciones?.competencias?.nombre||'—'}</td>
            <td>${n.evaluaciones?.competencias?.cursos?.nombre||'—'}</td>
            <td>B${n.evaluaciones?.bimestres?.numero||'?'}</td>
            <td>${n.evaluaciones?.fecha||'—'}</td>
            <td><span class="badge badge-${n.calificativo}">${n.calificativo}</span></td>
          </tr>`).join('')}
          </tbody>
        </table>` : '<div class="empty-state"><div class="ico">📝</div><p>Sin evaluaciones registradas</p></div>'}
      </div>
    </div>
  </div>
  <div id="tab-cb" style="display:none">
    <div class="card">
      <div class="table-wrap">
        ${cb?.length ? `
        <table>
          <thead><tr><th>Curso</th><th>Competencia</th><th>Bimestre</th><th>Calificativo</th></tr></thead>
          <tbody>
          ${cb.map(c=>`<tr>
            <td>${c.competencias?.cursos?.nombre||'—'}</td>
            <td>${c.competencias?.nombre||'—'}</td>
            <td>B${c.bimestres?.numero||'?'}</td>
            <td><span class="badge badge-${c.calificativo}">${c.calificativo}</span></td>
          </tr>`).join('')}
          </tbody>
        </table>` : '<div class="empty-state"><div class="ico">📋</div><p>Sin calificativos bimestrales</p></div>'}
      </div>
    </div>
  </div>`);
}

window.switchTab = (btn, tabId) => {
  btn.closest('.tabs').querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  const parent = btn.closest('.tabs').nextElementSibling;
  let next = parent;
  while (next) {
    if (next.id && !next.classList.contains('tabs')) next.style.display = 'none';
    next = next.nextElementSibling;
  }
  // simpler approach - hide all tab divs
  document.querySelectorAll('[id^="tab-"]').forEach(d=>d.style.display='none');
  document.getElementById(tabId).style.display='block';
};

async function pageMiAsistencia() {
  const estId = norm(currentPerfil?.id);
  const { data: asist } = await sb.from('registro_asistencia').select('*').eq('estudiante_id',estId).order('fecha',{ascending:false});

  const total = asist?.length||0;
  const presentes = asist?.filter(a=>a.estado==='PRESENTE').length||0;
  const ausentes = asist?.filter(a=>a.estado==='AUSENTE').length||0;
  const tardanzas = asist?.filter(a=>a.estado==='TARDANZA').length||0;
  const pct = total>0?Math.round((presentes/total)*100):100;

  setContent(`
  <div class="stats-grid">
    <div class="stat-card green"><span class="stat-icon">✅</span><div class="stat-label">Presentes</div><div class="stat-value">${presentes}</div></div>
    <div class="stat-card orange"><span class="stat-icon">⏰</span><div class="stat-label">Tardanzas</div><div class="stat-value">${tardanzas}</div></div>
    <div class="stat-card" style="border-top:3px solid #dc2626"><span class="stat-icon">❌</span><div class="stat-label">Ausencias</div><div class="stat-value" style="color:#dc2626">${ausentes}</div></div>
    <div class="stat-card blue"><span class="stat-icon">📊</span><div class="stat-label">% Asistencia</div><div class="stat-value" style="color:${pct>=85?'var(--g700)':'#dc2626'}">${pct}%</div></div>
  </div>
  <div class="card">
    <div class="table-wrap">
      ${asist?.length ? `
      <table>
        <thead><tr><th>Fecha</th><th>Estado</th><th>Justificado</th><th>Motivo</th></tr></thead>
        <tbody>
        ${asist.map(a=>`<tr>
          <td>${a.fecha}</td>
          <td><span class="asist-${a.estado}">${a.estado==='PRESENTE'?'✅ Presente':a.estado==='AUSENTE'?'❌ Ausente':'⏰ Tardanza'}</span></td>
          <td>${a.justificado ? '<span class="badge badge-green">Sí</span>' : '—'}</td>
          <td style="font-size:.8rem;color:#64748b">${a.motivo_justificacion||'—'}</td>
        </tr>`).join('')}
        </tbody>
      </table>` : '<div class="empty-state"><div class="ico">✅</div><p>Sin registros de asistencia</p></div>'}
    </div>
  </div>`);
}

