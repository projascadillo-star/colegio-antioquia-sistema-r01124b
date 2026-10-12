// ═══════════════════════════════════════════════════════════════
// GATEWAY — el frontend habla con los microservicios a través de
// este único punto de entrada (ya migrado: auth).
// ═══════════════════════════════════════════════════════════════
// En local usa localhost. En producción (Render), reemplaza el placeholder
// de abajo por la URL real de tu gateway una vez que lo despliegues.
const GATEWAY_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://gateway-luiv.onrender.com';
// ── TEMPORAL ──────────────────────────────────────────────────
// Las páginas que TODAVÍA no están migradas (estudiantes, docentes,
// cursos, secciones, evaluaciones, calificativos, asistencia,
// dashboard, libreta) siguen usando este cliente directo mientras
// las vas pasando una por una al mismo patrón que "auth".
// Bórralo cuando termines de migrar TODO (ver README.md).
const SUPA_URL = 'https://jwwhrckqgpdkmheblgqu.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d2hyY2txZ3Bka21oZWJsZ3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDg0NzAsImV4cCI6MjA5NTMyNDQ3MH0.NXywu-CX5612cuH7JiDdQZ9xFTrcp1jdDl4MW4v-rDQ';
const sb = supabase.createClient(SUPA_URL, SUPA_KEY);

let currentUser = null;
let currentPerfil = null;

// ID normalizer
const norm = v => v !== null && v !== undefined ? String(v) : null;

// Helper genérico para llamar al gateway agregando el token de sesión
async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem('ca_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${GATEWAY_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error en la petición');
  return data;
}

