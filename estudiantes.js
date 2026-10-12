// ═══════════════════════════════════════════════════════════════
// ESTUDIANTES (ADMIN)
// ═══════════════════════════════════════════════════════════════
async function pageEstudiantes() {
  const [{ data: estudiantes }, { data: secciones }] = await Promise.all([
    sb.from('estudiantes').select('*, secciones(nombre,grado), usuarios(correo,activo)').order('apellido'),
    sb.from('secciones').select('id,nombre,grado').order('grado'),
  ]);

  const render = (list) => `
  <div class="card">
    <div class="card-header">
      <span style="font-weight:700;color:var(--g800)">${list.length} estudiantes</span>
      <div style="display:flex;gap:8px;align-items:center">
        <input class="form-input" style="width:220px;padding:7px 10px" placeholder="🔍 Buscar por nombre o DNI…" oninput="filterTable(this,'est-table')" id="est-search"/>
        <button class="btn btn-primary btn-sm" onclick="modalEstudiante()">+ Nuevo</button>
      </div>
    </div>
    <div class="table-wrap">
      ${list.length ? `
      <table id="est-table">
        <thead><tr><th>Apellidos y Nombre</th><th>DNI</th><th>Grado</th><th>Sección</th><th>Correo</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
        ${list.map(e=>`<tr>
          <td><b>${e.apellido || ''}, ${e.nombre}</b></td>
          <td>${e.dni||'—'}</td>
          <td>${e.grado||'—'}°</td>
          <td>${e.secciones ? e.secciones.grado+'° '+e.secciones.nombre : '—'}</td>
          <td style="font-size:.78rem;color:#64748b">${e.usuarios?.correo||'—'}</td>
          <td><span class="badge badge-${e.usuarios?.activo!==false?'green':'gray'}">${e.usuarios?.activo!==false?'Activo':'Inactivo'}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="modalEstudiante(${JSON.stringify(e).replace(/"/g,'&quot;')})">Editar</button>
            <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="confirmDelete('estudiantes','${norm(e.id)}','${e.nombre} ${e.apellido}')">Eliminar</button>
          </td>
        </tr>`).join('')}
        </tbody>
      </table>` : '<div class="empty-state"><div class="ico">🎓</div><p>Sin estudiantes registrados</p></div>'}
    </div>
  </div>`;

  setContent(render(estudiantes||[]));
  window._secciones = secciones||[];
}

window.filterTable = (input, tableId) => {
  const q = input.value.toLowerCase();
  document.querySelectorAll(`#${tableId} tbody tr`).forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
};

window.modalEstudiante = async (est=null) => {
  const secciones = window._secciones || [];
  const title = est ? 'Editar Estudiante' : 'Nuevo Estudiante';
  showModal(title, `
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="m-nombre" placeholder="Ej: Juan Carlos" maxlength="40" data-filtro="letras" autocomplete="off" value="${est?.nombre||''}"/></div>
      <div class="form-group"><label class="form-label">Apellido</label><input class="form-input" id="m-apellido" placeholder="Ej: Pérez Quispe" maxlength="50" data-filtro="letras" autocomplete="off" value="${est?.apellido||''}"/></div>
      <div class="form-group"><label class="form-label">DNI</label><input class="form-input" id="m-dni" placeholder="Ej: 74521836" inputmode="numeric" maxlength="8" data-filtro="numeros" data-contador autocomplete="off" value="${est?.dni||''}"/></div>
      <div class="form-group"><label class="form-label">Fecha nacimiento</label><input class="form-input" type="date" id="m-fnac" max="${hoyISO()}" value="${est?.fecha_nacimiento||''}"/></div>
      <div class="form-group"><label class="form-label">Grado</label>
        <select class="form-input" id="m-grado">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${est?.grado==n?'selected':''}>${n}°</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Sección</label>
        <select class="form-input" id="m-seccion">
          <option value="">Sin sección</option>
          ${secciones.map(s=>`<option value="${norm(s.id)}" ${norm(est?.seccion_id)===norm(s.id)?'selected':''}>${s.grado}° ${s.nombre}</option>`).join('')}
        </select></div>
      ${!est ? `
      <div class="form-group form-full"><label class="form-label">Correo</label><input class="form-input" type="email" id="m-correo" maxlength="80" autocomplete="off" placeholder="Ej: juan.perez@colegio.edu.pe"/></div>
      <div class="form-group form-full"><label class="form-label">Contraseña inicial</label><input class="form-input" type="password" id="m-pass" placeholder="Ej: Estudiante2026#"/></div>` : ''}
    </div>`,
    async () => {
      const payload = {
        nombre: document.getElementById('m-nombre').value.trim(),
        apellido: document.getElementById('m-apellido').value.trim(),
        dni: document.getElementById('m-dni').value.trim(),
        fecha_nacimiento: document.getElementById('m-fnac').value || null,
        grado: document.getElementById('m-grado').value,
        seccion_id: document.getElementById('m-seccion').value || null,
      };
      const reglas = [
        { id:'m-nombre',   req:true, test:VAL.nombre, msg:'Solo letras: sin números ni símbolos' },
        { id:'m-apellido', req:true, test:VAL.nombre, msg:'Solo letras: sin números ni símbolos' },
        { id:'m-dni',      req:true, test:VAL.dni,    msg:'El DNI debe tener exactamente 8 dígitos' },
        { id:'m-fnac',     test:VAL.fechaNoFutura,    msg:'La fecha de nacimiento no puede ser futura' },
      ];
      if (!est) reglas.push(
        { id:'m-correo', req:true, test:VAL.correo, msg:'Escribe un correo válido (ej: nombre@colegio.edu.pe)' },
        { id:'m-pass',   req:true, raw:true, test:v => v.length >= 6, msg:'Mínimo 6 caracteres' }
      );
      if (!validarFormulario(reglas)) return;

      // DNI repetido
      const { data: dup } = await sb.from('estudiantes').select('id').eq('dni', payload.dni).limit(1);
      if (dup && dup.length && norm(dup[0].id) !== norm(est?.id)) {
        marcarCampo(document.getElementById('m-dni'), 'Ya existe un estudiante con este DNI');
        toast('DNI duplicado', 'error'); return;
      }

      if (est) {
        const { error } = await sb.from('estudiantes').update(payload).eq('id', norm(est.id));
        if (error) { toast(error.message,'error'); return; }
      } else {
        const correo = document.getElementById('m-correo').value.trim();
        const pass = document.getElementById('m-pass').value;
       if (!correo || !pass) { toast('Correo y contraseña requeridos', 'error'); return; }
      if (pass.length < 6) { toast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }

      // 1. Crear en Supabase Auth
       const { data: authData, error: authError } = await sb.auth.signUp({
        email: correo,
        password: pass
        });
        if (authError) { toast('Error al crear usuario: ' + authError.message, 'error'); return; }

       // 2. Insertar en tabla usuarios con auth_id vinculado
       const { data: user, error: ue } = await sb.from('usuarios').insert({
       nombre: `${payload.nombre} ${payload.apellido}`,
       correo,
        contrasena_hash: '—',
       rol: 'ESTUDIANTE',
       activo: true,
     auth_id: authData.user.id
       }).select().single();
        if (ue) {
        await sb.auth.admin.deleteUser(authData.user.id);
      toast(ue.message, 'error'); return;
       }

       // 3. Insertar en tabla estudiantes
       const { error } = await sb.from('estudiantes').insert({ ...payload, usuario_id: norm(user.id) });
        if (error) {
        await sb.auth.admin.deleteUser(authData.user.id);
        toast(error.message, 'error'); return;
        }
      }
      toast(est ? 'Estudiante actualizado' : 'Estudiante creado');
      closeModal(); pageEstudiantes();
    }
  );
};

window.confirmDelete = async (table, id, nombre) => {
  showModal('Confirmar eliminación', `<p>¿Eliminar <b>${nombre}</b>?</p>`,
    async () => {
      await sb.from(table).delete().eq('id', id);
      toast('Eliminado'); closeModal();
      if (table==='estudiantes') pageEstudiantes();
      else if (table==='docentes') pageDocentes();
      else if (table==='cursos') pageCursos();
      else if (table==='secciones') pageSecciones();
      else if (table==='asignacion_docente') pageAsignaciones();
    }, '🗑️ Eliminar', true
  );
};



