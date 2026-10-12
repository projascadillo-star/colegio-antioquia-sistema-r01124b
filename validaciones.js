// ═══════════════════════════════════════════════════════════════
// VALIDACIONES DE FORMULARIOS
// Uso en un <input>:
//   data-filtro="numeros|letras|alfanum"  → bloquea los demás caracteres al escribir/pegar
//   data-contador                         → muestra "5/8" debajo del campo
//   maxlength="8"                         → limita la cantidad de caracteres
// Uso al guardar:  if (!validarFormulario([{id:'m-dni', req:true, test:VAL.dni, msg:'...'}])) return;
// ═══════════════════════════════════════════════════════════════
const LETRAS = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';

const VAL = {
  dni:      v => /^\d{8}$/.test(v),
  telefono: v => /^9\d{8}$/.test(v),
  nombre:   v => new RegExp(`^[${LETRAS}]+(?:[ '\\-][${LETRAS}]+)*$`).test(v),
  correo:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  fechaNoFutura: v => v <= hoyISO(),
};

// Fecha de hoy en formato AAAA-MM-DD usando la hora local (no UTC)
function hoyISO() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function limpiarTexto(filtro, txt) {
  if (filtro === 'numeros') return txt.replace(/\D/g, '');
  if (filtro === 'letras')  return txt.replace(new RegExp(`[^${LETRAS} '\\-]`, 'g'), '').replace(/\s{2,}/g, ' ');
  if (filtro === 'alfanum') return txt.replace(new RegExp(`[^${LETRAS}0-9 ]`, 'g'), '').replace(/\s{2,}/g, ' ');
  return txt;
}

// ── Mensajes de error bajo cada campo ──
function marcarCampo(el, msg) {
  const grupo = el.closest('.form-group') || el.parentElement;
  let box = grupo.querySelector('.field-error');
  el.classList.toggle('input-error', !!msg);
  if (msg) {
    if (!box) { box = document.createElement('div'); box.className = 'field-error'; grupo.appendChild(box); }
    box.textContent = msg;
  } else if (box) box.remove();
}

function actualizarContador(el) {
  if (el.dataset.contador === undefined || !el.maxLength || el.maxLength < 1) return;
  const grupo = el.closest('.form-group') || el.parentElement;
  let c = grupo.querySelector('.field-count');
  if (!c) { c = document.createElement('div'); c.className = 'field-count'; grupo.appendChild(c); }
  c.textContent = `${el.value.length}/${el.maxLength}`;
  c.classList.toggle('ok', el.value.length === el.maxLength);
}

// reglas: [{ id, req, test, msg, raw }]  (raw:true → no recorta espacios, útil para contraseñas)
function validarFormulario(reglas) {
  let primero = null;
  reglas.forEach(r => {
    const el = document.getElementById(r.id);
    if (!el) return;
    const v = r.raw ? el.value : el.value.trim();
    let msg = '';
    if (!v) { if (r.req) msg = 'Este campo es obligatorio'; }
    else if (r.test && !r.test(v)) msg = r.msg || 'Valor no válido';
    marcarCampo(el, msg);
    if (msg && !primero) primero = el;
  });
  if (primero) { primero.focus(); toast('Revisa los campos marcados en rojo', 'error'); return false; }
  return true;
}

// ── Filtrado en vivo (escribir y pegar) ──
document.addEventListener('input', e => {
  const el = e.target;
  if (!(el instanceof HTMLInputElement)) return;
  if (el.dataset.filtro) {
    const limpio = limpiarTexto(el.dataset.filtro, el.value);
    if (limpio !== el.value) el.value = limpio;
  }
  if (el.classList.contains('input-error')) marcarCampo(el, '');
  actualizarContador(el);
});

document.addEventListener('paste', e => {
  const el = e.target;
  if (!(el instanceof HTMLInputElement) || !el.dataset.filtro) return;
  e.preventDefault();
  const txt = limpiarTexto(el.dataset.filtro, (e.clipboardData || window.clipboardData).getData('text'));
  el.setRangeText(txt, el.selectionStart, el.selectionEnd, 'end');
  if (el.maxLength > 0) el.value = el.value.slice(0, el.maxLength);
  el.dispatchEvent(new Event('input', { bubbles: true }));
});

document.addEventListener('focusin', e => {
  if (e.target instanceof HTMLInputElement) actualizarContador(e.target);
});
