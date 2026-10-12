// ═══════════════════════════════════════════════════════════════
// CONSOLIDADO
// ═══════════════════════════════════════════════════════════════
async function pageConsolidado() {
  const docenteId = norm(currentPerfil?.id);
  const [{ data: asig }, { data: bimestres }] = await Promise.all([
    sb.from('asignacion_docente').select('*, secciones(id,nombre,grado)').eq('docente_id',docenteId),
    sb.from('bimestres').select('*, ano_escolar(anio)').order('numero'),
  ]);
  const secciones = [...new Map((asig||[]).map(a=>([norm(a.seccion_id),a.secciones]))).values()];

  setContent(`
  <div class="card" style="margin-bottom:16px">
    <div class="card-body" style="padding:14px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
        <div><label class="form-label">Sección</label>
          <select class="form-input" style="width:160px" id="con-sec" onchange="loadConsolidado()">
            <option value="">— Elige una sección —</option>
            ${secciones.map(s=>`<option value="${norm(s.id)}">${s.grado}° "${s.nombre}"</option>`).join('')}
          </select></div>
        <div><label class="form-label">Bimestre</label>
          <select class="form-input" style="width:220px" id="con-bim" onchange="loadConsolidado()">
            <option value="">— Elige el bimestre —</option>
            ${bimestres.map(b=>`<option value="${norm(b.id)}">${b.ano_escolar?.anio||''} — ${b.numero}° Bimestre</option>`).join('')}
          </select></div>
      </div>
    </div>
  </div>
  <div id="con-grid"><div class="empty-state"><div class="ico">📑</div><p>Selecciona sección y bimestre</p></div></div>`);
}

window.loadConsolidado = async () => {
  const secId = document.getElementById('con-sec')?.value;
  const bimId = document.getElementById('con-bim')?.value;
  if (!secId||!bimId) return;

  const docenteId = norm(currentPerfil?.id);
  const [{ data: estudiantes }, { data: cb }, { data: asist }, { data: asig }] = await Promise.all([
    sb.from('estudiantes').select('id,nombre,apellido').eq('seccion_id',secId).order('apellido'),
    sb.from('calificativo_bimestral').select('*, competencias(nombre)').eq('bimestre_id',bimId).eq('docente_id',docenteId),
    sb.from('registro_asistencia').select('estudiante_id,estado,justificado').in('estudiante_id',(await sb.from('estudiantes').select('id').eq('seccion_id',secId)).data?.map(e=>norm(e.id))||[]),
    sb.from('asignacion_docente').select('cursos(id,nombre,competencias(*))').eq('docente_id',docenteId).eq('seccion_id',secId),
  ]);

  const competencias = [];
  (asig||[]).forEach(a => (a.cursos?.competencias||[]).forEach(c => competencias.push({...c,cursoNombre:a.cursos?.nombre})));
  const uniqComps = [...new Map(competencias.map(c=>[norm(c.id),c])).values()];

  const cbMap = {};
  (cb||[]).forEach(c=>{ cbMap[`${norm(c.estudiante_id)}_${norm(c.competencia_id)}`]=c; });

  const grid = document.getElementById('con-grid');
  grid.innerHTML = `
  <div class="card">
    <div class="card-header">
      <span style="font-weight:700;color:var(--g800)">Consolidado de Notas</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Estudiante</th>
            ${uniqComps.map(c=>`<th title="${c.nombre}">${c.cursoNombre}<br><small style="font-weight:400;text-transform:none;letter-spacing:0">${c.nombre.length>18?c.nombre.substring(0,18)+'…':c.nombre}</small></th>`).join('')}
            <th>% Asist.</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
        ${(estudiantes||[]).map(e=>{
          const misAsist = (asist||[]).filter(a=>norm(a.estudiante_id)===norm(e.id));
          const total = misAsist.length||1;
          const aus = misAsist.filter(a=>a.estado==='AUSENTE'&&!a.justificado).length;
          const pct = Math.round(((total-aus)/total)*100);
          const tieneC = uniqComps.some(c=>cbMap[`${norm(e.id)}_${norm(c.id)}`]?.calificativo==='C');
          const enRiesgo = tieneC || pct < 70;
          return `<tr style="${enRiesgo?'background:#fff5f5':''}">
            <td style="font-size:.83rem"><b>${e.apellido}, ${e.nombre}</b></td>
            ${uniqComps.map(c=>{
              const cal = cbMap[`${norm(e.id)}_${norm(c.id)}`]?.calificativo;
              return `<td>${cal ? `<span class="badge badge-${cal}">${cal}</span>` : '<span style="color:#94a3b8;font-size:.8rem">—</span>'}</td>`;
            }).join('')}
            <td><span style="font-weight:700;color:${pct>=85?'#15803d':pct>=70?'#ca8a04':'#dc2626'}">${pct}%</span></td>
            <td>${enRiesgo ? '<span class="badge badge-red">⚠️ Riesgo</span>' : '<span class="badge badge-green">✅ OK</span>'}</td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
};

