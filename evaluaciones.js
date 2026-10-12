// ═══════════════════════════════════════════════════════════════
// EVALUACIONES (DOCENTE)
// ═══════════════════════════════════════════════════════════════
async function pageEvaluaciones() {
  const docenteId = norm(currentPerfil?.id);
  const [{ data: asig }, { data: bimestres }] = await Promise.all([
    sb.from('asignacion_docente').select('*, cursos(id,nombre,competencias(*)), secciones(id,nombre,grado)').eq('docente_id', docenteId),
    sb.from('bimestres').select('*, ano_escolar(anio)').order('numero'),
  ]);
  window._asig=asig||[]; window._bimestres=bimestres||[];

  // Selector de filtros
  const cursos = [...new Map((asig||[]).map(a=>([norm(a.curso_id), a.cursos]))).values()];
  const secciones = [...new Map((asig||[]).map(a=>([norm(a.seccion_id), a.secciones]))).values()];

  setContent(`
  <div class="card" style="margin-bottom:16px">
    <div class="card-body" style="padding:14px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
        <div><label class="form-label">Bimestre</label>
          <select class="form-input" style="width:180px" id="flt-bim" onchange="loadEvaluacionesList()">
            <option value="">— Mostrar todas —</option>
            ${bimestres.map(b=>`<option value="${norm(b.id)}">${b.ano_escolar?.anio} — ${b.numero}° Bimestre (${b.estado})</option>`).join('')}
          </select></div>
        <button class="btn btn-primary" onclick="modalEvaluacion()">+ Nueva evaluación</button>
      </div>
    </div>
  </div>
  <div id="eval-list"><div class="spinner"></div></div>`);

  await loadEvaluacionesList();
}

window.loadEvaluacionesList = async () => {
  const bimId = document.getElementById('flt-bim')?.value;
  const docenteId = norm(currentPerfil?.id);
  let q = sb.from('evaluaciones').select('*, competencias(nombre,cursos(nombre)), bimestres(numero,estado,ano_escolar(anio))').eq('docente_id', docenteId).order('fecha',{ascending:false});
  if (bimId) q = q.eq('bimestre_id', bimId);
  const { data: evals } = await q;

  const html = evals?.length ? `
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Nombre</th><th>Tipo</th><th>Competencia</th><th>Curso</th><th>Bimestre</th><th>Fecha</th><th>Acciones</th></tr></thead>
        <tbody>
        ${evals.map(e=>`<tr>
          <td><b>${e.nombre}</b></td>
          <td><span class="badge badge-blue">${e.tipo}</span></td>
          <td>${e.competencias?.nombre||'—'}</td>
          <td>${e.competencias?.cursos?.nombre||'—'}</td>
          <td>${e.bimestres?.ano_escolar?.anio||''} B${e.bimestres?.numero||'?'}</td>
          <td>${e.fecha||'—'}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="modalRegistrarNotas('${norm(e.id)}','${e.nombre}','${e.bimestres?.estado||''}')">📝 Notas</button>
          </td>
        </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>` : '<div class="empty-state"><div class="ico">✏️</div><p>Sin evaluaciones</p></div>';

  document.getElementById('eval-list').innerHTML = html;
};

window.modalEvaluacion = () => {
  const asig = window._asig||[];
  const bims = window._bimestres||[];
  const competencias = [];
  asig.forEach(a => a.cursos?.competencias?.forEach(c => competencias.push({...c, cursoNombre: a.cursos?.nombre})));
  const uniqComps = [...new Map(competencias.map(c=>[norm(c.id),c])).values()];

  showModal('Nueva Evaluación', `
    <div class="form-group"><label class="form-label">Nombre de la evaluación</label><input class="form-input" id="m-nombre" placeholder="Ej: Práctica N°1, Examen Parcial, Tarea Grupal…"/></div>
    <div class="form-group"><label class="form-label">Tipo de evaluación</label>
      <select class="form-input" id="m-tipo">
        <option value="PRACTICA">📝 PRACTICA — Ejercicio escrito en clase</option>
        <option value="TAREA">📋 TAREA — Trabajo en casa</option>
        <option value="PARTICIPACION">🗣️ PARTICIPACION — Participación oral</option>
        <option value="EXAMEN">📄 EXAMEN — Evaluación formal</option>
      </select></div>
    <div class="form-group"><label class="form-label">Competencia evaluada</label>
      <select class="form-input" id="m-comp"><option value="">— Selecciona la competencia —</option>${uniqComps.map(c=>`<option value="${norm(c.id)}">${c.cursoNombre} — ${c.nombre}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Bimestre</label>
      <select class="form-input" id="m-bim"><option value="">— Selecciona el bimestre —</option>${bims.map(b=>`<option value="${norm(b.id)}" ${b.estado==='CERRADO'?'disabled style="color:#94a3b8"':''}>${b.ano_escolar?.anio||''} — B${b.numero} (${b.estado})</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Fecha de aplicación</label><input class="form-input" type="date" id="m-fecha"/>
      <small style="color:#94a3b8;font-size:.75rem">Ej: fecha en que se tomó la evaluación</small></div>`,
    async () => {
      const bimId = document.getElementById('m-bim').value;
      const bim = (window._bimestres||[]).find(b=>norm(b.id)===bimId);
      if (bim?.estado==='CERRADO') { toast('El bimestre está cerrado','error'); return; }
      const nombre = document.getElementById('m-nombre').value.trim();
      const compId = document.getElementById('m-comp').value;
      if (!nombre||!compId||!bimId) { toast('Completa todos los campos','error'); return; }
      const { error } = await sb.from('evaluaciones').insert({ nombre, tipo:document.getElementById('m-tipo').value, fecha:document.getElementById('m-fecha').value||null, competencia_id:compId, bimestre_id:bimId, docente_id:norm(currentPerfil?.id) });
      if (error) { toast(error.message,'error'); return; }
      toast('Evaluación creada'); closeModal(); loadEvaluacionesList();
    }
  );
};

window.modalRegistrarNotas = async (evalId, evalNombre, bimEstado) => {
  if (bimEstado==='CERRADO') { toast('El bimestre está cerrado — no se puede editar','error'); return; }

  // Obtener la evaluacion y su competencia/bimestre para conocer la sección
  const { data: evalData } = await sb.from('evaluaciones').select('*, competencias(curso_id)').eq('id',evalId).single();
  const docenteId = norm(currentPerfil?.id);

  // Obtener asignacion para saber la sección
  const { data: asig } = await sb.from('asignacion_docente').select('seccion_id').eq('docente_id',docenteId).eq('competencia_id_check',evalData?.competencias?.curso_id||'').limit(1);

  // Obtener estudiantes de todas las secciones del docente
  const { data: myAsig } = await sb.from('asignacion_docente').select('seccion_id, secciones(nombre,grado)').eq('docente_id',docenteId);
  const seccionIds = [...new Set((myAsig||[]).map(a=>norm(a.seccion_id)))];

  let estudiantes = [];
  for (const sid of seccionIds) {
    const { data: ests } = await sb.from('estudiantes').select('id,nombre,apellido,seccion_id').eq('seccion_id',sid).order('apellido');
    if (ests) estudiantes.push(...ests);
  }

  // Notas existentes
  const { data: notasExist } = await sb.from('nota_evaluacion').select('*').eq('evaluacion_id',evalId);
  const notasMap = {};
  (notasExist||[]).forEach(n => { notasMap[norm(n.estudiante_id)] = n; });

  const html = `
  <div style="margin-bottom:12px">
    <b style="color:var(--g800)">${evalNombre}</b>
    <p style="font-size:.78rem;color:#64748b">${estudiantes.length} estudiantes</p>
  </div>
  <div style="max-height:350px;overflow-y:auto">
    <table style="width:100%">
      <thead><tr><th>Estudiante</th><th>Calificativo</th><th>Observación</th></tr></thead>
      <tbody id="notas-tbody">
      ${estudiantes.map(e=>{
        const n = notasMap[norm(e.id)]||{};
        return `<tr>
          <td style="font-size:.83rem">${e.apellido}, ${e.nombre}</td>
          <td>
            <select class="form-input" style="padding:4px 8px;width:80px" data-est="${norm(e.id)}" id="cal-${norm(e.id)}">
              <option value="">--</option>
              ${['AD','A','B','C'].map(v=>`<option value="${v}" ${n.calificativo===v?'selected':''}>${v}</option>`).join('')}
            </select>
          </td>
          <td><input class="form-input" style="padding:4px 8px;font-size:.8rem" id="obs-${norm(e.id)}" placeholder="Ej: Mejoró en la última semana" value="${n.observacion||''}"/></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>
  </div>`;

  showModal(`Registrar Notas — ${evalNombre}`, html, async () => {
    const rows = document.querySelectorAll('#notas-tbody tr');
    const saves = [];
    rows.forEach(tr => {
      const sel = tr.querySelector('select[data-est]');
      const estId = sel?.dataset.est;
      const cal = sel?.value;
      const obs = tr.querySelector(`#obs-${estId}`)?.value||'';
      if (cal && estId) saves.push({ evaluacion_id:evalId, estudiante_id:estId, calificativo:cal, observacion:obs||null });
    });

    for (const s of saves) {
      const exist = notasMap[s.estudiante_id];
      if (exist) await sb.from('nota_evaluacion').update({calificativo:s.calificativo,observacion:s.observacion}).eq('id',norm(exist.id));
      else await sb.from('nota_evaluacion').insert(s);
    }
    toast(`${saves.length} notas guardadas`); closeModal();
  }, '💾 Guardar notas');
};

