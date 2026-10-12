// ═══════════════════════════════════════════════════════════════
// CURSOS Y COMPETENCIAS
// ═══════════════════════════════════════════════════════════════
async function pageCursos() {
  const { data: cursos } = await sb.from('cursos').select('*, competencias(id,nombre,descripcion)').order('nombre');

  setContent(`
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
    <div></div>
    <button class="btn btn-primary" onclick="modalCurso()">+ Nuevo curso</button>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px">
    ${cursos?.length ? cursos.map(c=>`
    <div class="card">
      <div class="card-header">
        <div>
          <b style="color:var(--g800)">${c.nombre}</b>
          <div style="font-size:.75rem;color:#64748b">${c.grado?c.grado+'° grado ·':''} ${c.competencias?.length||0} competencias</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-secondary" onclick="modalCompetencia('${norm(c.id)}','${c.nombre}')">+ Competencia</button>
          <button class="btn btn-sm btn-secondary" onclick="modalCurso(${JSON.stringify(c).replace(/"/g,'&quot;')})">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="confirmDelete('cursos','${norm(c.id)}','${c.nombre}')">🗑️</button>
        </div>
      </div>
      <div class="card-body" style="padding:12px">
        ${c.competencias?.length ? c.competencias.map(comp=>`
          <div style="display:flex;justify-content:space-between;align-items:center;background:var(--g50);border-radius:6px;padding:7px 10px;margin-bottom:5px">
            <span style="font-size:.82rem;color:var(--g800);font-weight:500">${comp.nombre}</span>
            <button onclick="deleteComp('${norm(comp.id)}')" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:.8rem">✕</button>
          </div>`) .join('') : '<p style="font-size:.8rem;color:#94a3b8;font-style:italic">Sin competencias</p>'}
      </div>
    </div>`).join('') : '<div class="empty-state"><div class="ico">📚</div><p>Sin cursos registrados</p></div>'}
  </div>`);
}

window.modalCurso = (c=null) => {
  showModal(c?'Editar Curso':'Nuevo Curso', `
    <div class="form-group"><label class="form-label">Nombre del curso</label><input class="form-input" id="m-nombre" placeholder="Ej: Matemática, Comunicación, CTA…" value="${c?.nombre||''}"/></div>
    <div class="form-group"><label class="form-label">Grado (opcional)</label>
      <select class="form-input" id="m-grado"><option value="">Todos los grados</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${c?.grado==n?'selected':''}>${n}°</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-input" id="m-desc" rows="2" placeholder="Ej: Área de Comunicación orientada al desarrollo de competencias lectoras y escritas">${c?.descripcion||''}</textarea></div>`,
    async () => {
      const payload = { nombre:document.getElementById('m-nombre').value.trim(), grado:document.getElementById('m-grado').value||null, descripcion:document.getElementById('m-desc').value.trim()||null };
      if (!payload.nombre) { toast('Nombre requerido','error'); return; }
      const fn = c ? sb.from('cursos').update(payload).eq('id',norm(c.id)) : sb.from('cursos').insert(payload);
      const { error } = await fn;
      if (error) { toast(error.message,'error'); return; }
      toast(c?'Curso actualizado':'Curso creado'); closeModal(); pageCursos();
    }
  );
};

window.modalCompetencia = (cursoId, cursoNombre) => {
  showModal(`Nueva Competencia — ${cursoNombre}`, `
    <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="m-nombre" placeholder="Ej: Resuelve problemas de cantidad"/></div>
    <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-input" id="m-desc" rows="2" placeholder="Ej: El estudiante opera con números naturales, fracciones y decimales en situaciones cotidianas"></textarea></div>`,
    async () => {
      const nombre = document.getElementById('m-nombre').value.trim();
      if (!nombre) { toast('Nombre requerido','error'); return; }
      const { error } = await sb.from('competencias').insert({ curso_id:cursoId, nombre, descripcion:document.getElementById('m-desc').value||null });
      if (error) { toast(error.message,'error'); return; }
      toast('Competencia agregada'); closeModal(); pageCursos();
    }
  );
};

window.deleteComp = async (id) => {
  const { error } = await sb.from('competencias').delete().eq('id', id);
  if (error) toast(error.message,'error'); else { toast('Competencia eliminada'); pageCursos(); }
};

