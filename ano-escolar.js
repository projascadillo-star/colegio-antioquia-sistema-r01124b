// ═══════════════════════════════════════════════════════════════
// AÑO ESCOLAR
// ═══════════════════════════════════════════════════════════════
async function pageAnoEscolar() {
  const [{ data: anos }, { data: bimestres }] = await Promise.all([
    sb.from('ano_escolar').select('*').order('anio',{ascending:false}),
    sb.from('bimestres').select('*').order('numero'),
  ]);

  setContent(`
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:16px">
    <button class="btn btn-secondary" onclick="modalBimestre()">+ Bimestre</button>
    <button class="btn btn-primary" onclick="modalAno()">+ Año Escolar</button>
  </div>
  ${anos?.length ? anos.map(ano => {
    const bimsAno = bimestres?.filter(b=>norm(b.ano_escolar_id)===norm(ano.id))||[];
    return `<div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <div>
          <b style="font-size:1.1rem;color:var(--g800)">${ano.anio}</b>
          <div style="font-size:.78rem;color:#64748b">${ano.fecha_inicio||''} → ${ano.fecha_fin||''}</div>
        </div>
        <span class="badge badge-${ano.activo?'green':'gray'}">${ano.activo?'🟢 Activo':'Inactivo'}</span>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
        ${[1,2,3,4].map(n => {
          const b = bimsAno.find(x=>x.numero===n);
          const open = b?.estado==='ABIERTO';
          return `<div style="border-radius:10px;border:1px solid ${open?'var(--g300)':'#e2e8f0'};padding:12px;background:${open?'var(--g50)':'#f8fafc'}">
            <b style="font-size:.85rem;color:${open?'var(--g800)':'#64748b'}">Bimestre ${n}</b>
            ${b ? `<div style="font-size:.72rem;color:#94a3b8;margin:3px 0">${b.fecha_inicio||''}<br>${b.fecha_fin||''}</div>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px">
                <span style="font-size:.75rem;font-weight:700;color:${open?'var(--g600)':'#94a3b8'}">${open?'🟢 Abierto':'⚫ Cerrado'}</span>
                <button class="btn btn-sm" style="padding:3px 8px;background:${open?'#fee2e2':'#dcfce7'};color:${open?'#dc2626':'var(--g700)'};border:none;border-radius:6px;cursor:pointer;font-size:.72rem;font-weight:700"
                  onclick="toggleBimestre('${norm(b.id)}','${b.estado}')">${open?'Cerrar':'Abrir'}</button>
              </div>` : '<p style="font-size:.75rem;color:#94a3b8;margin-top:4px;font-style:italic">No creado</p>'}
          </div>`;
        }).join('')}
        </div>
      </div>
    </div>`;
  }).join('') : '<div class="empty-state"><div class="ico">📅</div><p>Sin años escolares</p></div>'}
  `);
  window._anos_data = anos||[];
}

window.toggleBimestre = async (id, estado) => {
  const nuevo = estado==='ABIERTO' ? 'CERRADO' : 'ABIERTO';
  const { error } = await sb.from('bimestres').update({estado:nuevo}).eq('id',id);
  if (error) toast(error.message,'error');
  else { toast(`Bimestre ${nuevo==='ABIERTO'?'abierto':'cerrado'}`); pageAnoEscolar(); }
};

window.modalAno = () => {
  showModal('Nuevo Año Escolar', `
    <div class="form-group"><label class="form-label">Año</label><input class="form-input" type="text" inputmode="numeric" maxlength="4" data-filtro="numeros" id="m-anio" placeholder="Ej: 2026" value="${new Date().getFullYear()}"/></div>
    <div class="form-group"><label class="form-label">Fecha inicio</label><input class="form-input" type="date" id="m-ini" placeholder="Ej: 2026-03-09"/></div>
    <div class="form-group"><label class="form-label">Fecha fin</label><input class="form-input" type="date" id="m-fin" placeholder="Ej: 2026-12-18"/></div>`,
    async () => {
      if (!validarFormulario([
        { id:'m-anio', req:true, test:v => +v >= 2000 && +v <= 2100, msg:'Escribe un año válido (ej: 2026)' },
        { id:'m-ini',  req:true },
        { id:'m-fin',  req:true, test:v => v > document.getElementById('m-ini').value, msg:'La fecha fin debe ser posterior a la fecha inicio' },
      ])) return;
      const { error } = await sb.from('ano_escolar').insert({ anio:document.getElementById('m-anio').value, fecha_inicio:document.getElementById('m-ini').value, fecha_fin:document.getElementById('m-fin').value, activo:true });
      if (error) { toast(error.message,'error'); return; }
      toast('Año escolar creado'); closeModal(); pageAnoEscolar();
    }
  );
};

window.modalBimestre = () => {
  const anos = window._anos_data||[];
  showModal('Nuevo Bimestre', `
    <div class="form-group"><label class="form-label">Año Escolar</label>
      <select class="form-input" id="m-ano"><option value="">Seleccionar año...</option>${anos.map(a=>`<option value="${norm(a.id)}">${a.anio}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Número de Bimestre</label>
      <select class="form-input" id="m-num">${[1,2,3,4].map(n=>`<option value="${n}">${n}° Bimestre</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Fecha inicio <small style="color:#94a3b8">(inicio del bimestre)</small></label><input class="form-input" type="date" id="m-ini"/></div>
    <div class="form-group"><label class="form-label">Fecha fin <small style="color:#94a3b8">(cierre del bimestre)</small></label><input class="form-input" type="date" id="m-fin"/></div>`,
    async () => {
      const anoId = document.getElementById('m-ano').value;
      if (!anoId) { toast('Selecciona un año','error'); return; }
      if (!validarFormulario([
        { id:'m-ini', req:true },
        { id:'m-fin', req:true, test:v => v > document.getElementById('m-ini').value, msg:'La fecha fin debe ser posterior a la fecha inicio' },
      ])) return;
      const { error } = await sb.from('bimestres').insert({ ano_escolar_id:anoId, numero:Number(document.getElementById('m-num').value), fecha_inicio:document.getElementById('m-ini').value, fecha_fin:document.getElementById('m-fin').value, estado:'ABIERTO' });
      if (error) { toast(error.message,'error'); return; }
      toast('Bimestre creado'); closeModal(); pageAnoEscolar();
    }
  );
};

