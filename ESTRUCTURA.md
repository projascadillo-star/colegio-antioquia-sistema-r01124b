# Estructura del frontend

Cada pantalla tiene su archivo JS y, si necesita estilos propios, su CSS con el mismo nombre.
El orden de los <script> y <link> en index.html importa: respétalo si agregas archivos.

| Pantalla / parte | JS (carpeta js/) | CSS (carpeta css/) |
|---|---|---|
| URL gateway, Supabase, apiFetch | config.js | - |
| Validaciones de formularios (DNI, teléfono, letras…) | validaciones.js | forms.css |
| Login / logout | auth.js | login.css |
| Inicio, sesión, modo oscuro | init.js | base.css |
| Menú lateral por rol | menu.js | sidebar.css |
| Rutas y títulos de página | router.js | - |
| Dashboard (admin y docente) | dashboard.js | stats.css |
| Estudiantes | estudiantes.js | tables.css, forms.css |
| Docentes | docentes.js | tables.css, forms.css |
| Cursos y competencias | cursos.js | - |
| Secciones | secciones.js | - |
| Asignaciones | asignaciones.js | - |
| Año escolar y bimestres | ano-escolar.js | - |
| Evaluaciones | evaluaciones.js | badges.css |
| Calificativo bimestral | calificativo-bimestral.js | - |
| Calificativo final | calificativo-final.js | - |
| Registro de asistencia | asistencia.js | asistencia.css |
| Consolidado | consolidado.js | tabs.css |
| Mis notas / Mi asistencia (estudiante) | vista-estudiante.js | - |
| Libreta y PDF | libreta.js | libreta.css |
| Vistas del padre | vista-padre.js | - |
| Modales | modal.js | modal.css |
| Avisos (toast) | toast.js | toast.css |

CSS compartido: cards, buttons, forms, tables, badges, tabs, alerts, loading, layout, topbar, responsive.
