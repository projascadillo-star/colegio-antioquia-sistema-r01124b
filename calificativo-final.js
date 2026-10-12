// ═══════════════════════════════════════════════════════════════
// CALIFICATIVO FINAL
// ═══════════════════════════════════════════════════════════════
async function pageCalificativoFinal() {
  const docenteId = norm(currentPerfil?.id);
  const [{ data: asig }, { data: anos }] = await Promise.all([
    sb.from('asignacion_docente').select('*, cursos(id,nombre,competencias(*)), secciones(id,nombre,grado)').eq('docente_id', docenteId),
    sb.from('ano_escolar').select('*').order('anio',{ascending:false}),
  ]);
  window._asig=asig||[]; window._anos=anos||[];

  const secciones = [...new Map((asig||[]).map(a=>([norm(a.seccion_id),a.secciones]))).values()];

  setContent(`
  <div class="alert alert-info">
    ℹ️ <b>El Calificativo Final (CF) NO es promedio.</b> Es una decisión pedagógica integral. Se registra al finalizar el año escolar. Determina si el estudiante es Promovido, Recuperación o Repitente.
  </div>
  <div class="card" style="margin-bottom:16px">
    <div class="card-body" style="padding:14px">
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <div><label class="form-label">Sección <small style="color:#94a3b8;font-weight:400">— elige el aula</small></label>
          <select class="form-input" style="width:180px" id="flt-sec-cf" onchange="loadCFGrid()">
            <option value="">— Elige una sección —</option>
            ${secciones.map(s=>`<option value="${norm(s.id)}">${s.grado}° "${s.nombre}"</option>`).join('')}
          </select></div>
        <div><label class="form-label">Año Escolar <small style="color:#94a3b8;font-weight:400">— año a cerrar</small></label>
          <select class="form-input" style="width:180px" id="flt-ano-cf" onchange="loadCFGrid()">
            <option value="">— Elige el año —</option>
            ${anos.map(a=>`<option value="${norm(a.id)}">${a.anio}${a.activo?' (Activo)':''}</option>`).join('')}
          </select></div>
      </div>
    </div>
  </div>
  <div id="cf-grid"><div class="empty-state"><div class="ico">🏆</div><p>Selecciona sección y año escolar</p></div></div>`);
}

window.loadCFGrid = async () => {
  const secId = document.getElementById('flt-sec-cf')?.value;
  const anoId = document.getElementById('flt-ano-cf')?.value;
  if (!secId||!anoId) return;

  const docenteId = norm(currentPerfil?.id);
  const [{ data: estudiantes }, { data: cfExist }, { data: asig }] = await Promise.all([
    sb.from('estudiantes').select('id,nombre,apellido').eq('seccion_id',secId).order('apellido'),
    sb.from('calificativo_final').select('*').eq('ano_escolar_id',anoId).eq('docente_id',docenteId),
    sb.from('asignacion_docente').select('cursos(id,nombre,competencias(*))').eq('docente_id',docenteId).eq('seccion_id',secId),
  ]);

  const competencias = [];
  (asig||[]).forEach(a => (a.cursos?.competencias||[]).forEach(c => competencias.push({...c, cursoNombre:a.cursos?.nombre})));
  const uniqComps = [...new Map(competencias.map(c=>[norm(c.id),c])).values()];
  const cfMap = {};
  (cfExist||[]).forEach(c => { cfMap[`${norm(c.estudiante_id)}_${norm(c.competencia_id)}`] = c; });

  const grid = document.getElementById('cf-grid');
  if (!estudiantes?.length || !uniqComps.length) {
    grid.innerHTML = '<div class="empty-state"><p>Sin datos para mostrar</p></div>'; return;
  }

  const estadoEst = (e) => {
    const misC = uniqComps.filter(c => cfMap[`${norm(e.id)}_${norm(c.id)}`]?.calificativo === 'C').length;
    if (misC >= 4) return {label:'REPITENTE',cls:'badge-red'};
    if (misC >= 1) return {label:'EN RECUPERACIÓN',cls:'badge-yellow'};
    return {label:'PROMOVIDO',cls:'badge-green'};
  };

  grid.innerHTML = `
  <div class="card">
    <div class="card-header">
      <span style="font-weight:700;font-size:.9rem;color:var(--g800)">Calificativo Final — Año Escolar</span>
      <button class="btn btn-primary btn-sm" onclick="saveCFAll('${anoId}')">💾 Guardar todo</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Estudiante</th>
            ${uniqComps.map(c=>`<th title="${c.nombre}">${c.cursoNombre}<br><small style="font-weight:400;text-transform:none;letter-spacing:0">${c.nombre.length>18?c.nombre.substring(0,18)+'…':c.nombre}</small></th>`).join('')}
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
        ${(estudiantes||[]).map(e=>{
          const est = estadoEst(e);
          return `<tr>
            <td style="font-size:.83rem;white-space:nowrap"><b>${e.apellido}, ${e.nombre}</b></td>
            ${uniqComps.map(c=>{
              const key = `${norm(e.id)}_${norm(c.id)}`;
              const exist = cfMap[key];
              return `<td><select class="form-input" style="padding:3px 6px;width:75px;font-size:.82rem;font-weight:700" id="cf-${norm(e.id)}-${norm(c.id)}" data-est="${norm(e.id)}" data-comp="${norm(c.id)}" onchange="loadCFGrid()">
                <option value="">--</option>
                ${['AD','A','B','C'].map(v=>`<option value="${v}" ${exist?.calificativo===v?'selected':''}>${v}</option>`).join('')}
              </select></td>`;
            }).join('')}
            <td><span class="badge ${est.cls}">${est.label}</span></td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
};

window.saveCFAll = async (anoId) => {
  const docenteId = norm(currentPerfil?.id);
  const selects = document.querySelectorAll('select[data-est][data-comp]');
  let saved = 0;
  for (const sel of selects) {
    const val = sel.value; if (!val) continue;
    const estId = sel.dataset.est, compId = sel.dataset.comp;
    const { data: exist } = await sb.from('calificativo_final').select('id').eq('estudiante_id',estId).eq('competencia_id',compId).eq('ano_escolar_id',anoId).single();
    if (exist) await sb.from('calificativo_final').update({calificativo:val,docente_id:docenteId}).eq('id',norm(exist.id));
    else await sb.from('calificativo_final').insert({estudiante_id:estId,competencia_id:compId,ano_escolar_id:anoId,calificativo:val,docente_id:docenteId});
    saved++;
  }
  toast(`${saved} calificativos finales guardados`);
};

