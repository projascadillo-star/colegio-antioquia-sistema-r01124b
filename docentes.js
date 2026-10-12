// ═══════════════════════════════════════════════════════════════
// DOCENTES (ADMIN)
// ═══════════════════════════════════════════════════════════════
async function pageDocentes() {
  const { data: docentes } = await sb.from('docentes').select('*, usuarios(correo,activo)').order('apellido');

  setContent(`
  <div class="card">
    <div class="card-header">
      <span style="font-weight:700;color:var(--g800)">${docentes?.length||0} docentes</span>
      <div style="display:flex;gap:8px;align-items:center">
        <input class="form-input" style="width:200px;padding:7px 10px" placeholder="🔍 Buscar por nombre o especialidad…" oninput="filterTable(this,'doc-table')"/>
        <button class="btn btn-primary btn-sm" onclick="modalDocente()">+ Nuevo</button>
      </div>
    </div>
    <div class="table-wrap">
      ${docentes?.length ? `
      <table id="doc-table">
        <thead><tr><th>Apellidos y Nombre</th><th>DNI</th><th>Especialidad</th><th>Teléfono</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
        ${docentes.map(d=>`<tr>
          <td><b>${d.apellido||''}, ${d.nombre}</b></td>
          <td>${d.dni||'—'}</td>
          <td>${d.especialidad||'—'}</td>
          <td>${d.telefono||'—'}</td>
          <td><span class="badge badge-${d.usuarios?.activo!==false?'green':'gray'}">${d.usuarios?.activo!==false?'Activo':'Inactivo'}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="modalDocente(${JSON.stringify(d).replace(/"/g,'&quot;')})">Editar</button>
            <button class="btn btn-sm btn-danger" style="margin-left:4px" onclick="confirmDelete('docentes','${norm(d.id)}','${d.nombre} ${d.apellido}')">Eliminar</button>
          </td>
        </tr>`).join('')}
        </tbody>
      </table>` : '<div class="empty-state"><div class="ico">👨‍🏫</div><p>Sin docentes</p></div>'}
    </div>
  </div>`);
}

window.modalDocente = (doc=null) => {
  showModal(doc ? 'Editar Docente' : 'Nuevo Docente', `
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="m-nombre" placeholder="Ej: María Elena" maxlength="40" data-filtro="letras" autocomplete="off" value="${doc?.nombre||''}"/></div>
      <div class="form-group"><label class="form-label">Apellido</label><input class="form-input" id="m-apellido" placeholder="Ej: Torres Huanca" maxlength="50" data-filtro="letras" autocomplete="off" value="${doc?.apellido||''}"/></div>
      <div class="form-group"><label class="form-label">DNI</label><input class="form-input" id="m-dni" placeholder="Ej: 42318756" inputmode="numeric" maxlength="8" data-filtro="numeros" data-contador autocomplete="off" value="${doc?.dni||''}"/></div>
      <div class="form-group"><label class="form-label">Especialidad</label><input class="form-input" id="m-esp" maxlength="60" placeholder="Ej: Matemática, Comunicación…" value="${doc?.especialidad||''}"/></div>
      <div class="form-group form-full"><label class="form-label">Teléfono</label><input class="form-input" id="m-tel" placeholder="Ej: 987654321" inputmode="numeric" maxlength="9" data-filtro="numeros" data-contador autocomplete="off" value="${doc?.telefono||''}"/></div>
      ${!doc ? `
      <div class="form-group form-full"><label class="form-label">Correo</label><input class="form-input" type="email" id="m-correo" maxlength="80" autocomplete="off" placeholder="Ej: m.torres@colegio.edu.pe"/></div>
      <div class="form-group form-full"><label class="form-label">Contraseña inicial</label><input class="form-input" type="password" id="m-pass" placeholder="Ej: Docente2026#"/></div>` : ''}
    </div>`,
    async () => {
      const payload = {
        nombre: document.getElementById('m-nombre').value.trim(),
        apellido: document.getElementById('m-apellido').value.trim(),
        dni: document.getElementById('m-dni').value.trim(),
        especialidad: document.getElementById('m-esp').value.trim(),
        telefono: document.getElementById('m-tel').value.trim(),
      };
      const reglas = [
        { id:'m-nombre',   req:true, test:VAL.nombre,   msg:'Solo letras: sin números ni símbolos' },
        { id:'m-apellido', req:true, test:VAL.nombre,   msg:'Solo letras: sin números ni símbolos' },
        { id:'m-dni',      req:true, test:VAL.dni,      msg:'El DNI debe tener exactamente 8 dígitos' },
        { id:'m-tel',      test:VAL.telefono,           msg:'El celular debe tener 9 dígitos y empezar con 9' },
      ];
      if (!doc) reglas.push(
        { id:'m-correo', req:true, test:VAL.correo, msg:'Escribe un correo válido (ej: nombre@colegio.edu.pe)' },
        { id:'m-pass',   req:true, raw:true, test:v => v.length >= 6, msg:'Mínimo 6 caracteres' }
      );
      if (!validarFormulario(reglas)) return;

      // DNI repetido
      const { data: dup } = await sb.from('docentes').select('id').eq('dni', payload.dni).limit(1);
      if (dup && dup.length && norm(dup[0].id) !== norm(doc?.id)) {
        marcarCampo(document.getElementById('m-dni'), 'Ya existe un docente con este DNI');
        toast('DNI duplicado', 'error'); return;
      }

      if (doc) {
        const { error } = await sb.from('docentes').update(payload).eq('id', norm(doc.id));
        if (error) { toast(error.message,'error'); return; }
      } else {
        const correo = document.getElementById('m-correo').value.trim();
        const pass = document.getElementById('m-pass').value;
        if (!correo || !pass) { toast('Correo y contraseña requeridos', 'error'); return; }
        if (pass.length < 6) { toast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }

        // 1. Crear en Supabase Auth (bcrypt lo maneja Supabase, no el frontend)
       const { data: authData, error: authError } = await sb.auth.signUp({
       email: correo,
        password: pass
        });
        if (authError) { toast('Error al crear usuario: ' + authError.message, 'error'); return; }

        // 2. Insertar en tabla usuarios vinculando el auth_id
       const { data: user, error: ue } = await sb.from('usuarios').insert({
      nombre: `${payload.nombre} ${payload.apellido}`,
       correo,
       contrasena_hash: '—',  // ya no se usa, Auth maneja la contraseña
        rol: 'DOCENTE',
        activo: true,
        auth_id: authData.user.id
      }).select().single();
      if (ue) {
       // Si falla la inserción, eliminar el usuario de Auth para no dejar inconsistencias
         await sb.auth.admin.deleteUser(authData.user.id);
       toast(ue.message, 'error'); return;
      }

      // 3. Insertar en tabla docentes
       const { error } = await sb.from('docentes').insert({ ...payload, usuario_id: norm(user.id) });
        if (error) { toast(error.message, 'error'); return; }
      }
      toast(doc ? 'Docente actualizado' : 'Docente creado');
      closeModal(); pageDocentes();
    }
  );
};

