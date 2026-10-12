// ═══════════════════════════════════════════════════════════════
// SECCIONES
// ═══════════════════════════════════════════════════════════════
async function pageSecciones() {
  const [{ data: secciones }, { data: anos }] = await Promise.all([
    sb.from('secciones').select('*, ano_escolar(anio)').order('grado'),
    sb.from('ano_escolar').select('id,anio').order('anio',{ascending:false}),
  ]);
  window._anos = anos||[];

  setContent(`
  <div class="card">
    <div class="card-header">
      <span style="font-weight:700;color:var(--g800)">${secciones?.length||0} secciones</span>
      <button class="btn btn-primary btn-sm" onclick="modalSeccion()">+ Nueva sección</button>
    </div>
    <div class="table-wrap">
      ${secciones?.length ? `
      <table>
        <thead><tr><th>Sección</th><th>Grado</th><th>Capacidad</th><th>Año Escolar</th><th>Acciones</th></tr></thead>
        <tbody>
        ${secciones.map(s=>`<tr>
          <td><b>${s.nombre}</b></td>
          <td>${s.grado}°</td>
          <td>${s.capacidad||'—'}</td>
          <td>${s.ano_escolar?.anio||'—'}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="modalSeccion(${JSON.stringify(s).replace(/"/g,'&quot;')})">Editar</button>
            <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="confirmDelete('secciones','${norm(s.id)}','${s.nombre}')">Eliminar</button>
          </td>
        </tr>`).join('')}
        </tbody>
      </table>` : '<div class="empty-state"><div class="ico">🏫</div><p>Sin secciones</p></div>'}
    </div>
  </div>`);
}

window.modalSeccion = (s=null) => {
  const anos = window._anos||[];
  showModal(s?'Editar Sección':'Nueva Sección', `
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Nombre (A, B…)</label><input class="form-input" id="m-nombre" placeholder="Ej: A, B, Única" maxlength="10" data-filtro="alfanum" autocomplete="off" value="${s?.nombre||''}"/></div>
      <div class="form-group"><label class="form-label">Grado</label>
        <select class="form-input" id="m-grado">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${s?.grado==n?'selected':''}>${n}°</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Capacidad</label><input class="form-input" type="text" inputmode="numeric" maxlength="2" data-filtro="numeros" id="m-cap" placeholder="Ej: 30 (máx. 60)" value="${s?.capacidad||''}"/></div>
      <div class="form-group"><label class="form-label">Año Escolar</label>
        <select class="form-input" id="m-ano">
          <option value="">Sin asignar</option>
          ${anos.map(a=>`<option value="${norm(a.id)}" ${norm(s?.ano_escolar_id)===norm(a.id)?'selected':''}>${a.anio}</option>`).join('')}
        </select></div>
    </div>`,
    async () => {
      const payload = { nombre:document.getElementById('m-nombre').value.trim(), grado:document.getElementById('m-grado').value, capacidad:document.getElementById('m-cap').value||null, ano_escolar_id:document.getElementById('m-ano').value||null };
      if (!validarFormulario([
        { id:'m-nombre', req:true, msg:'Escribe el nombre de la sección' },
        { id:'m-cap', test:v => +v >= 1 && +v <= 60, msg:'La capacidad debe estar entre 1 y 60 alumnos' },
      ])) return;
      const fn = s ? sb.from('secciones').update(payload).eq('id',norm(s.id)) : sb.from('secciones').insert(payload);
      const { error } = await fn;
      if (error) { toast(error.message,'error'); return; }
      toast(s?'Actualizada':'Sección creada'); closeModal(); pageSecciones();
    }
  );
};

