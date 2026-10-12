// ═══════════════════════════════════════════════════════════════
// CALIFICATIVO BIMESTRAL
// ═══════════════════════════════════════════════════════════════
async function pageCalificativoBimestral() {
  const docenteId = norm(currentPerfil?.id);
  const [{ data: asig }, { data: bimestres }] = await Promise.all([
    sb.from('asignacion_docente').select('*, cursos(id,nombre,competencias(*)), secciones(id,nombre,grado)').eq('docente_id', docenteId),
    sb.from('bimestres').select('*, ano_escolar(anio)').order('numero'),
  ]);
  window._asig=asig||[]; window._bimestres=bimestres||[];

  const secciones = [...new Map((asig||[]).map(a=>([norm(a.seccion_id),a.secciones]))).values()];

  setContent(`
  <div class="alert alert-info">
    ℹ️ <b>El Calificativo Bimestral (CB) es una valoración pedagógica integral.</b> NO es promedio matemático. El docente decide el CB considerando el desempeño global del estudiante en la competencia.
  </div>
  <div class="card" style="margin-bottom:16px">
    <div class="card-body" style="padding:14px">
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <div><label class="form-label">Sección <small style="color:#94a3b8;font-weight:400">— elige el aula</small></label>
          <select class="form-input" style="width:180px" id="flt-sec-cb" onchange="loadCBGrid()">
            <option value="">— Elige una sección —</option>
            ${secciones.map(s=>`<option value="${norm(s.id)}">${s.grado}° "${s.nombre}"</option>`).join('')}
          </select></div>
        <div><label class="form-label">Bimestre <small style="color:#94a3b8;font-weight:400">— período a registrar</small></label>
          <select class="form-input" style="width:220px" id="flt-bim-cb" onchange="loadCBGrid()">
            <option value="">— Elige el bimestre —</option>
            ${bimestres.map(b=>`<option value="${norm(b.id)}">${b.ano_escolar?.anio||''} — ${b.numero}° Bimestre (${b.estado})</option>`).join('')}
          </select></div>
      </div>
    </div>
  </div>
  <div id="cb-grid"><div class="empty-state"><div class="ico">📝</div><p>Selecciona sección y bimestre</p></div></div>`);
}

window.loadCBGrid = async () => {
  const secId = document.getElementById('flt-sec-cb')?.value;
  const bimId = document.getElementById('flt-bim-cb')?.value;
  if (!secId||!bimId) return;

  const bim = (window._bimestres||[]).find(b=>norm(b.id)===bimId);
  const closed = bim?.estado==='CERRADO';
  const docenteId = norm(currentPerfil?.id);

  const [{ data: estudiantes }, { data: cbExist }, { data: asig }] = await Promise.all([
    sb.from('estudiantes').select('id,nombre,apellido').eq('seccion_id',secId).order('apellido'),
    sb.from('calificativo_bimestral').select('*').eq('bimestre_id',bimId).eq('docente_id',docenteId),
    sb.from('asignacion_docente').select('cursos(id,nombre,competencias(*))').eq('docente_id',docenteId).eq('seccion_id',secId),
  ]);

  const competencias = [];
  (asig||[]).forEach(a => (a.cursos?.competencias||[]).forEach(c => competencias.push({...c, cursoNombre:a.cursos?.nombre})));
  const uniqComps = [...new Map(competencias.map(c=>[norm(c.id),c])).values()];

  const cbMap = {};
  (cbExist||[]).forEach(c => { cbMap[`${norm(c.estudiante_id)}_${norm(c.competencia_id)}`] = c; });

  const grid = document.getElementById('cb-grid');
  if (!estudiantes?.length) { grid.innerHTML = '<div class="empty-state"><p>Sin estudiantes en esta sección</p></div>'; return; }
  if (!uniqComps.length) { grid.innerHTML = '<div class="empty-state"><p>Sin competencias asignadas para esta sección</p></div>'; return; }

  grid.innerHTML = `
  ${closed ? '<div class="alert alert-warning">⚠️ Bimestre cerrado — solo lectura</div>' : ''}
  <div class="card">
    <div class="card-header">
      <span style="font-weight:700;font-size:.9rem;color:var(--g800)">Calificativo Bimestral — B${bim?.numero}</span>
      ${!closed ? `<button class="btn btn-primary btn-sm" onclick="saveCBAll('${bimId}')">💾 Guardar todo</button>` : ''}
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Estudiante</th>
            ${uniqComps.map(c=>`<th title="${c.nombre}">${c.cursoNombre}<br><small style="font-weight:400;text-transform:none;letter-spacing:0">${c.nombre.length>20?c.nombre.substring(0,20)+'…':c.nombre}</small></th>`).join('')}
          </tr>
        </thead>
        <tbody>
        ${(estudiantes||[]).map(e=>`<tr>
          <td style="font-size:.83rem;white-space:nowrap"><b>${e.apellido}, ${e.nombre}</b></td>
          ${uniqComps.map(c=>{
            const key = `${norm(e.id)}_${norm(c.id)}`;
            const exist = cbMap[key];
            return `<td>
              ${closed
                ? `<span class="badge badge-${exist?.calificativo||'gray'}">${exist?.calificativo||'—'}</span>`
                : `<select class="form-input" style="padding:3px 6px;width:75px;font-size:.82rem;font-weight:700" id="cb-${norm(e.id)}-${norm(c.id)}" data-est="${norm(e.id)}" data-comp="${norm(c.id)}">
                    <option value="">--</option>
                    ${['AD','A','B','C'].map(v=>`<option value="${v}" ${exist?.calificativo===v?'selected':''}>${v}</option>`).join('')}
                  </select>`}
            </td>`;
          }).join('')}
        </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
};

window.saveCBAll = async (bimId) => {
  const docenteId = norm(currentPerfil?.id);
  const selects = document.querySelectorAll('select[data-est][data-comp]');
  let saved = 0;
  for (const sel of selects) {
    const val = sel.value;
    if (!val) continue;
    const estId = sel.dataset.est, compId = sel.dataset.comp;
    const { data: exist } = await sb.from('calificativo_bimestral').select('id').eq('estudiante_id',estId).eq('competencia_id',compId).eq('bimestre_id',bimId).single();
    if (exist) await sb.from('calificativo_bimestral').update({calificativo:val,docente_id:docenteId}).eq('id',norm(exist.id));
    else await sb.from('calificativo_bimestral').insert({estudiante_id:estId,competencia_id:compId,bimestre_id:bimId,calificativo:val,docente_id:docenteId});
    saved++;
  }
  toast(`${saved} calificativos guardados`);
};

