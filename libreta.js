// ═══════════════════════════════════════════════════════════════
// LIBRETA (ESTUDIANTE Y PADRE)
// ═══════════════════════════════════════════════════════════════
async function pageLibreta(estId) {
  if (!estId) { setContent('<div class="alert alert-danger">No se encontró el estudiante</div>'); return; }
  estId = norm(estId);

  const [{ data: est }, { data: cb }, { data: cf }, { data: asist }] = await Promise.all([
    sb.from('estudiantes').select('*, secciones(nombre,grado)').eq('id',estId).single(),
    sb.from('calificativo_bimestral').select('*, competencias(nombre,cursos(nombre)), bimestres(numero)').eq('estudiante_id',estId),
    sb.from('calificativo_final').select('*, competencias(nombre,cursos(nombre)), ano_escolar(anio)').eq('estudiante_id',estId),
    sb.from('registro_asistencia').select('estado,justificado,fecha').eq('estudiante_id',estId).order('fecha',{ascending:false}),
  ]);

  const totalAsist = asist?.length||0;
  const ausencias = asist?.filter(a=>a.estado==='AUSENTE').length||0;
  const tardanzas = asist?.filter(a=>a.estado==='TARDANZA').length||0;
  const pct = totalAsist>0?Math.round(((totalAsist-ausencias)/totalAsist)*100):100;

  const cursosC = cf?.filter(c=>c.calificativo==='C').length||0;
  let estadoFinal = 'PROMOVIDO';
  if (cursosC>=4) estadoFinal='REPITENTE';
  else if (cursosC>=1) estadoFinal='EN_RECUPERACION';

  // Agrupar CB por bimestre
  const bimestres = [...new Set((cb||[]).map(c=>c.bimestres?.numero))].filter(Boolean).sort();
  const cursos = [...new Set((cf||[]).map(c=>c.competencias?.cursos?.nombre))].filter(Boolean);

  setContent(`
  <div class="libreta-header">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <h2>📖 Libreta Académica</h2>
        <p><b>${est?.apellido||''}, ${est?.nombre||''}</b></p>
        <p>${est?.secciones?.grado||''}° grado — Sección ${est?.secciones?.nombre||''}</p>
        <span class="estado-chip estado-${estadoFinal}">${estadoFinal.replace('_',' ')}</span>
      </div>
      <button class="btn btn-secondary" onclick="generarPDF('${estId}')">📄 Descargar PDF</button>
    </div>
  </div>

  <div class="stats-grid" style="margin-bottom:18px">
    <div class="stat-card green"><span class="stat-icon">✅</span><div class="stat-label">Asistencia</div><div class="stat-value">${pct}%</div></div>
    <div class="stat-card orange"><span class="stat-icon">❌</span><div class="stat-label">Ausencias</div><div class="stat-value" style="color:#dc2626">${ausencias}</div></div>
    <div class="stat-card blue"><span class="stat-icon">⏰</span><div class="stat-label">Tardanzas</div><div class="stat-value">${tardanzas}</div></div>
  </div>

  ${cf?.length ? `
  <div class="card" style="margin-bottom:18px">
    <div class="card-header"><h3 style="font-weight:700;color:var(--g800);font-size:.95rem">🏆 Calificativos Finales</h3></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Curso</th><th>Competencia</th><th>Año</th><th>Calificativo Final</th></tr></thead>
        <tbody>
        ${cf.map(c=>`<tr>
          <td>${c.competencias?.cursos?.nombre||'—'}</td>
          <td>${c.competencias?.nombre||'—'}</td>
          <td>${c.ano_escolar?.anio||'—'}</td>
          <td><span class="badge badge-${c.calificativo}">${c.calificativo}</span></td>
        </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>` : ''}

  ${cb?.length ? `
  <div class="card">
    <div class="card-header"><h3 style="font-weight:700;color:var(--g800);font-size:.95rem">📝 Calificativos Bimestrales</h3></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Curso</th><th>Competencia</th>${bimestres.map(b=>`<th>B${b}</th>`).join('')}</tr></thead>
        <tbody>
        ${[...new Map((cb||[]).map(c=>[`${c.competencias?.cursos?.nombre}_${c.competencias?.nombre}`,c])).values()].map(row=>{
          const bims = {};
          (cb||[]).filter(c=>c.competencias?.nombre===row.competencias?.nombre).forEach(c=>{ bims[c.bimestres?.numero]=c.calificativo; });
          return `<tr>
            <td>${row.competencias?.cursos?.nombre||'—'}</td>
            <td>${row.competencias?.nombre||'—'}</td>
            ${bimestres.map(b=>`<td>${bims[b]?`<span class="badge badge-${bims[b]}">${bims[b]}</span>`:'—'}</td>`).join('')}
          </tr>`;
        }).join('')}
        </tbody>
      </table>
    </div>
  </div>` : '<div class="empty-state"><div class="ico">📖</div><p>Sin calificativos registrados aún</p></div>'}
  `);

  window._libretaData = { est, cb, cf, asist, estadoFinal, pct, ausencias, tardanzas };
}

window.generarPDF = async (estId) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const d = window._libretaData;
  if (!d) { toast('Carga la libreta primero','error'); return; }

  const { est, cb, cf, pct, ausencias, tardanzas, estadoFinal } = d;

  // Header verde
  doc.setFillColor(21, 128, 61);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(16); doc.setFont('helvetica','bold');
  doc.text('COLEGIO ANTIOQUIA', 105, 14, {align:'center'});
  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.text('LIBRETA DE NOTAS — Sistema MINEDU RVM N° 033-2022', 105, 21, {align:'center'});

  // Datos estudiante
  doc.setTextColor(0,0,0);
  doc.setFontSize(11); doc.setFont('helvetica','bold');
  doc.text(`${est?.apellido||''}, ${est?.nombre||''}`, 14, 45);
  doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text(`Grado: ${est?.secciones?.grado||''}° | Sección: ${est?.secciones?.nombre||''} | Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, 52);

  // Estado
  const estadoColors = {PROMOVIDO:[21,128,61], EN_RECUPERACION:[202,138,4], REPITENTE:[220,38,38]};
  const [r,g,b] = estadoColors[estadoFinal]||[0,0,0];
  doc.setFillColor(r,g,b);
  doc.roundedRect(14, 56, 60, 8, 2, 2, 'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(8); doc.setFont('helvetica','bold');
  doc.text(estadoFinal.replace('_',' '), 44, 61.5, {align:'center'});

  // Asistencia
  doc.setTextColor(0,0,0);
  doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text(`Asistencia: ${pct}% | Ausencias: ${ausencias} | Tardanzas: ${tardanzas}`, 14, 72);

  // Tabla CF
  if (cf?.length) {
    doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text('CALIFICATIVOS FINALES', 14, 82);
    let y = 88;
    doc.setFillColor(240,253,244);
    doc.rect(14, y-4, 182, 6, 'F');
    doc.setFontSize(8); doc.setFont('helvetica','bold');
    doc.text('CURSO', 16, y); doc.text('COMPETENCIA', 70, y); doc.text('CF', 190, y, {align:'right'});
    y+=7;
    cf.forEach(c => {
      doc.setFont('helvetica','normal'); doc.setFontSize(8);
      doc.text(c.competencias?.cursos?.nombre||'', 16, y);
      doc.text(c.competencias?.nombre||'', 70, y);
      doc.setFont('helvetica','bold');
      doc.text(c.calificativo||'', 190, y, {align:'right'});
      y+=6; if(y>270){doc.addPage();y=20;}
    });
  }

  // Tabla CB
  if (cb?.length) {
    let y = doc.internal.getCurrentPageInfo().pageNumber === 1 ? Math.max(doc.internal.getNumberOfPages()===1?135:20, 20) : 20;
    doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text('CALIFICATIVOS BIMESTRALES', 14, y);
    y+=8;
    const bims = [1,2,3,4];
    const cbMap = {};
    (cb||[]).forEach(c=>{ cbMap[`${c.competencias?.nombre}_${c.bimestres?.numero}`]=c.calificativo; });
    const uniqComps = [...new Map((cb||[]).map(c=>[c.competencias?.nombre,c])).values()];

    doc.setFillColor(240,253,244);
    doc.rect(14, y-4, 182, 6, 'F');
    doc.setFontSize(8); doc.setFont('helvetica','bold');
    doc.text('COMPETENCIA', 16, y); bims.forEach((b,i)=>doc.text(`B${b}`, 155+i*12, y));
    y+=7;
    uniqComps.forEach(comp => {
      doc.setFont('helvetica','normal');
      doc.text(`${comp.competencias?.cursos?.nombre||''} — ${comp.competencias?.nombre||''}`, 16, y);
      bims.forEach((b,i) => {
        const cal = cbMap[`${comp.competencias?.nombre}_${b}`]||'—';
        doc.setFont('helvetica','bold');
        doc.text(cal, 155+i*12, y);
      });
      y+=6; if(y>270){doc.addPage();y=20;}
    });
  }

  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let i=1;i<=pages;i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(150,150,150);
    doc.text('Colegio Antioquia — Sistema de Notas según MINEDU RVM N° 033-2022', 105, 290, {align:'center'});
  }

  doc.save(`libreta_${est?.apellido||'estudiante'}_${est?.nombre||''}.pdf`);
  toast('📄 PDF descargado');
};

