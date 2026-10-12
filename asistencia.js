// ═══════════════════════════════════════════════════════════════
// ASISTENCIA (DOCENTE)
// ═══════════════════════════════════════════════════════════════
async function pageAsistencia() {
  const docenteId = norm(currentPerfil?.id);
  const { data: asig } = await sb.from('asignacion_docente').select('*, secciones(id,nombre,grado)').eq('docente_id',docenteId);
  const secciones = [...new Map((asig||[]).map(a=>([norm(a.seccion_id),a.secciones]))).values()];
  const today = new Date().toISOString().split('T')[0];

  setContent(`
  <div class="card" style="margin-bottom:16px">
    <div class="card-body" style="padding:14px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
        <div><label class="form-label">Sección</label>
          <select class="form-input" style="width:180px" id="as-sec">
            <option value="">— Elige una sección —</option>
            ${secciones.map(s=>`<option value="${norm(s.id)}">${s.grado}° "${s.nombre}"</option>`).join('')}
          </select></div>
        <div><label class="form-label">Fecha <small style="color:#94a3b8;font-weight:400">— día de clase</small></label>
          <input class="form-input" type="date" id="as-fecha" value="${today}" style="width:180px" title="Selecciona la fecha de la clase a registrar"/></div>
        <button class="btn btn-primary" onclick="loadAsistenciaGrid()">📋 Cargar lista de alumnos</button>
      </div>
    </div>
  </div>
  <div id="as-grid"><div class="empty-state"><div class="ico">✅</div><p>Selecciona sección y fecha</p></div></div>`);
}

window.loadAsistenciaGrid = async () => {
  const secId = document.getElementById('as-sec')?.value;
  const fecha = document.getElementById('as-fecha')?.value;
  if (!secId||!fecha) { toast('Selecciona sección y fecha','error'); return; }

  const [{ data: estudiantes }, { data: asistExist }] = await Promise.all([
    sb.from('estudiantes').select('id,nombre,apellido').eq('seccion_id',secId).order('apellido'),
    sb.from('registro_asistencia').select('*').eq('fecha',fecha).in('estudiante_id',(await sb.from('estudiantes').select('id').eq('seccion_id',secId)).data?.map(e=>norm(e.id))||[]),
  ]);

  const asistMap = {};
  (asistExist||[]).forEach(a => { asistMap[norm(a.estudiante_id)] = a; });

  const grid = document.getElementById('as-grid');
  if (!estudiantes?.length) { grid.innerHTML = '<div class="empty-state"><p>Sin estudiantes</p></div>'; return; }

  grid.innerHTML = `
  <div class="card">
    <div class="card-header">
      <span style="font-weight:700;color:var(--g800)">Asistencia — ${fecha}</span>
      <div style="display:flex;gap:6px">
        <button class="btn btn-sm btn-secondary" onclick="marcarTodos('PRESENTE')">✅ Todos presentes</button>
        <button class="btn btn-primary btn-sm" onclick="saveAsistencia('${secId}','${fecha}')">💾 Guardar</button>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Estudiante</th><th>Estado</th><th>Justificado</th><th>Motivo</th></tr></thead>
        <tbody id="asist-body">
        ${(estudiantes||[]).map((e,i)=>{
          const a = asistMap[norm(e.id)]||{estado:'PRESENTE',justificado:false,motivo_justificacion:''};
          return `<tr>
            <td style="color:#94a3b8;font-size:.8rem">${i+1}</td>
            <td style="font-size:.83rem"><b>${e.apellido}, ${e.nombre}</b></td>
            <td>
              <select class="form-input" style="padding:4px 8px;width:130px;font-weight:700" id="ast-${norm(e.id)}" data-est="${norm(e.id)}">
                <option value="PRESENTE" ${a.estado==='PRESENTE'?'selected':''}>✅ Presente</option>
                <option value="AUSENTE" ${a.estado==='AUSENTE'?'selected':''}>❌ Ausente</option>
                <option value="TARDANZA" ${a.estado==='TARDANZA'?'selected':''}>⏰ Tardanza</option>
              </select>
            </td>
            <td>
              <input type="checkbox" id="jus-${norm(e.id)}" ${a.justificado?'checked':''} style="width:18px;height:18px;cursor:pointer"/>
            </td>
            <td><input class="form-input" style="padding:4px 8px;font-size:.8rem" id="mot-${norm(e.id)}" placeholder="Ej: Enfermedad, cita médica…" value="${a.motivo_justificacion||''}"/></td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
};

window.marcarTodos = (estado) => {
  document.querySelectorAll('#asist-body select').forEach(sel => sel.value = estado);
};

window.saveAsistencia = async (secId, fecha) => {
  const docenteId = norm(currentPerfil?.id);
  const selects = document.querySelectorAll('#asist-body select[data-est]');
  let saved = 0;
  for (const sel of selects) {
    const estId = sel.dataset.est;
    const estado = sel.value;
    const justificado = document.getElementById(`jus-${estId}`)?.checked||false;
    const motivo = document.getElementById(`mot-${estId}`)?.value||null;
    const { data: exist } = await sb.from('registro_asistencia').select('id').eq('estudiante_id',estId).eq('fecha',fecha).single();
    if (exist) await sb.from('registro_asistencia').update({estado,justificado,motivo_justificacion:motivo,docente_id:docenteId}).eq('id',norm(exist.id));
    else await sb.from('registro_asistencia').insert({estudiante_id:estId,fecha,estado,justificado,motivo_justificacion:motivo,docente_id:docenteId});
    saved++;
  }
  toast(`✅ ${saved} registros guardados`);
};

