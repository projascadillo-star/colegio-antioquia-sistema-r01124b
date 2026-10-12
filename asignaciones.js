// ═══════════════════════════════════════════════════════════════
// ASIGNACIONES
// ═══════════════════════════════════════════════════════════════
async function pageAsignaciones() {
  const [{ data: asig }, { data: docentes }, { data: cursos }, { data: secciones }, { data: anos }] = await Promise.all([
    sb.from('asignacion_docente').select('*, docentes(nombre,apellido), cursos(nombre), secciones(nombre,grado), ano_escolar(anio)').order('created_at',{ascending:false}),
    sb.from('docentes').select('id,nombre,apellido').order('apellido'),
    sb.from('cursos').select('id,nombre').order('nombre'),
    sb.from('secciones').select('id,nombre,grado').order('grado'),
    sb.from('ano_escolar').select('id,anio').order('anio',{ascending:false}),
  ]);
  window._docentes=docentes||[]; window._cursos=cursos||[]; window._secciones=secciones||[]; window._anos=anos||[];

  setContent(`
  <div class="card">
    <div class="card-header">
      <span style="font-weight:700;color:var(--g800)">${asig?.length||0} asignaciones</span>
      <button class="btn btn-primary btn-sm" onclick="modalAsignacion()">+ Nueva asignación</button>
    </div>
    <div class="table-wrap">
      ${asig?.length ? `
      <table>
        <thead><tr><th>Docente</th><th>Curso</th><th>Sección</th><th>Año</th><th>Acción</th></tr></thead>
        <tbody>
        ${asig.map(a=>`<tr>
          <td>${a.docentes?.apellido}, ${a.docentes?.nombre}</td>
          <td>${a.cursos?.nombre}</td>
          <td>${a.secciones?.grado}° ${a.secciones?.nombre}</td>
          <td>${a.ano_escolar?.anio||'—'}</td>
          <td><button class="btn btn-sm btn-danger" onclick="confirmDelete('asignacion_docente','${norm(a.id)}','esta asignación')">Eliminar</button></td>
        </tr>`).join('')}
        </tbody>
      </table>` : '<div class="empty-state"><div class="ico">🔗</div><p>Sin asignaciones</p></div>'}
    </div>
  </div>`);
}

window.modalAsignacion = () => {
  const d=window._docentes||[], c=window._cursos||[], s=window._secciones||[], a=window._anos||[];
  showModal('Nueva Asignación', `
    <div class="form-group"><label class="form-label">Docente</label>
      <select class="form-input" id="m-doc"><option value="">Seleccionar...</option>${d.map(x=>`<option value="${norm(x.id)}">${x.apellido}, ${x.nombre}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Curso</label>
      <select class="form-input" id="m-cur"><option value="">Seleccionar...</option>${c.map(x=>`<option value="${norm(x.id)}">${x.nombre}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Sección</label>
      <select class="form-input" id="m-sec"><option value="">Seleccionar...</option>${s.map(x=>`<option value="${norm(x.id)}">${x.grado}° ${x.nombre}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Año Escolar</label>
      <select class="form-input" id="m-ano"><option value="">Seleccionar...</option>${a.map(x=>`<option value="${norm(x.id)}">${x.anio}</option>`).join('')}</select></div>`,
    async () => {
      const payload = { docente_id:document.getElementById('m-doc').value, curso_id:document.getElementById('m-cur').value, seccion_id:document.getElementById('m-sec').value, ano_escolar_id:document.getElementById('m-ano').value||null };
      if (!payload.docente_id||!payload.curso_id||!payload.seccion_id) { toast('Completa todos los campos','error'); return; }
      const { error } = await sb.from('asignacion_docente').insert(payload);
      if (error) { toast(error.message,'error'); return; }
      toast('Asignación creada'); closeModal(); pageAsignaciones();
    }
  );
};

