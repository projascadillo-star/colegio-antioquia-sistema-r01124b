# Colegio Antioquia — de monolito frontend a microservicios

## Qué se hizo

Tu sistema original era un frontend que hablaba directo con Supabase
(patrón cliente + BaaS). Esto se dividió en **4 microservicios
independientes + 1 API Gateway**, cada uno con su propio dominio de datos:

| Servicio | Puerto | Dueño de | Estado |
|---|---|---|---|
| `auth-service` | 3001 | login, logout, sesión | ✅ Migrado por completo |
| `usuarios-service` | 3002 | estudiantes, docentes, secciones | ✅ Endpoints listos (frontend por conectar) |
| `notas-service` | 3003 | evaluaciones, calificativos | ✅ Endpoints listos (frontend por conectar) |
| `asistencia-service` | 3004 | registro_asistencia | ✅ Endpoints listos (frontend por conectar) |
| `gateway` | 3000 | enruta + compone la libreta | ✅ Listo |

El frontend (`frontend/`) ya usa el gateway para **login/logout/sesión**.
El resto de páginas (dashboard, estudiantes, docentes, cursos,
secciones, asignaciones, evaluaciones, calificativos, asistencia,
libreta) todavía llaman a Supabase directo con el cliente `sb` que
dejé temporalmente en `java.js` — los endpoints de backend para
estudiantes/docentes/secciones/notas/asistencia ya existen y
funcionan, solo falta que el frontend los consuma.

## Cómo correrlo

### Opción A — cada servicio a mano (para desarrollo/entender el flujo)
```bash
# En 5 terminales distintas:
cd auth-service && cp .env.example .env && npm install && npm run dev
cd usuarios-service && cp .env.example .env && npm install && npm run dev
cd notas-service && cp .env.example .env && npm install && npm run dev
cd asistencia-service && cp .env.example .env && npm install && npm run dev
cd gateway && cp .env.example .env && npm install && npm run dev
```
Luego abre `frontend/index.html` en el navegador (o sírvelo con `npx serve frontend`).

**Importante:** en `usuarios-service/.env` necesitas la **service role
key** de Supabase (Project Settings → API), no la anon key. Esa key
nunca debe ir en el frontend.

### Opción B — con Docker (recomendado para la sustentación)
```bash
# Copia los .env.example a .env en cada carpeta de servicio primero
docker compose up --build
```
Esto levanta los 5 contenedores. Pruébalo con:
```bash
curl http://localhost:3000/auth/login -X POST -H "Content-Type: application/json" \
  -d '{"correo":"admin@colegio.edu.pe","pass":"tu_password"}'
```

## Cómo migrar las páginas que faltan

El patrón es siempre el mismo (ya lo aplicamos en auth). Para migrar,
por ejemplo, `pageEstudiantes()`:

1. Busca en `java.js` las líneas con `sb.from('estudiantes')...` dentro de esa función.
2. Reemplázalas por `await apiFetch('/usuarios/estudiantes')` (el endpoint ya existe en `usuarios-service`).
3. Repite con `modalEstudiante`, `confirmDelete`, etc., usando los endpoints `POST/PUT/DELETE /usuarios/estudiantes`.
4. Cuando **todas** las páginas estén migradas, borra el bloque "TEMPORAL" del cliente `sb` en `java.js` y el `<script>` de Supabase en `index.html` — ahí sí tu frontend deja de tocar Supabase directamente al 100%.

Endpoints ya disponibles para seguir el mismo patrón:
- `usuarios-service`: `GET/POST/PUT/DELETE /usuarios/estudiantes`, `GET/POST/PUT /usuarios/docentes`, `GET/POST/PUT /usuarios/secciones`
- `notas-service`: `GET/POST /notas/evaluaciones`, `GET/POST /notas/evaluaciones/:id/notas`, `GET/POST /notas/calificativo-bimestral`, `GET/POST /notas/calificativo-final`
- `asistencia-service`: `GET/POST /asistencia`, `GET /asistencia/estudiante/:id`
- `gateway`: `GET /libreta/:estudianteId` (ya compone datos de 3 servicios)

Faltan por crear (siguiendo exactamente el mismo patrón, puedes
pedírmelo o hacerlo tú): endpoints para `cursos`, `competencias`,
`asignacion_docente`, `ano_escolar` y `bimestres` dentro de
`usuarios-service` (o un `academico-service` aparte, si tu curso pide
más granularidad).

## Cómo desplegarlo en Render

A diferencia de tu versión anterior (un solo sitio estático), ahora vas
a desplegar **6 servicios separados** en Render: 4 microservicios +
gateway (como "Web Service", Node) + el frontend (como "Static Site").

### Opción A — con el blueprint `render.yaml` (recomendado, más rápido)

1. Sube todo este proyecto a un repositorio de GitHub (crea uno nuevo,
   sube esta carpeta completa — el `.gitignore` ya excluye `node_modules`
   y tus `.env` con las keys, así que no se suben por accidente).
2. Entra a [render.com](https://render.com) → **New → Blueprint**.
3. Conecta tu repositorio de GitHub.
4. Render va a leer el archivo `render.yaml` y va a proponerte crear
   los 6 servicios de una sola vez.
5. Antes de confirmar, te va a pedir los valores de las variables de
   entorno marcadas como secretas (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`) — pégalas ahí, son las mismas que usaste
   en tus `.env` locales.
6. Dale **Apply** y espera a que los 6 servicios terminen de desplegar
   (Render construye cada uno con `npm install` y lo levanta con `npm start`).
7. El gateway se conecta automáticamente a los otros 4 servicios (el
   blueprint ya configura esas URLs internas por ti).

### Opción B — manual, servicio por servicio

Si prefieres no usar el blueprint, repite esto 5 veces (una por cada
microservicio + gateway):

1. Render → **New → Web Service** → conecta tu repo.
2. **Root Directory**: el nombre de la carpeta del servicio (ej. `auth-service`).
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. En la pestaña **Environment**, agrega las variables que tenías en
   el `.env` de ese servicio (sin las comillas ni el `=`, solo
   `SUPABASE_URL` → tu valor, etc).
6. Deploy.

Para el `gateway`, en sus variables de entorno pon las URLs públicas
que Render te dio a los otros 4 servicios, por ejemplo:
```
AUTH_SERVICE_URL=https://auth-service-xxxx.onrender.com
USUARIOS_SERVICE_URL=https://usuarios-service-xxxx.onrender.com
NOTAS_SERVICE_URL=https://notas-service-xxxx.onrender.com
ASISTENCIA_SERVICE_URL=https://asistencia-service-xxxx.onrender.com
```

Para el `frontend`: Render → **New → Static Site** → conecta el repo →
**Root Directory**: `frontend` → **Publish Directory**: `.` (deja
Build Command vacío).

### Último paso, en cualquiera de las dos opciones

Una vez que el `gateway` esté desplegado, copia su URL pública
(algo como `https://gateway-xxxx.onrender.com`) y pégala en
`frontend/java.js`, reemplazando `https://TU-GATEWAY.onrender.com`
por esa URL real. Vuelve a subir el cambio a GitHub (Render
redespliega el frontend automáticamente al detectar el push).

### Nota sobre el plan gratuito de Render

Los servicios en el plan free "se duermen" tras 15 minutos sin uso, y
tardan unos segundos en despertar con la primera petición. Como el
login ahora depende de 2 servicios despiertos a la vez (gateway +
auth-service), la primera vez que alguien entre después de un rato
inactivo puede tardar un poco más — es normal, no es un error. Para tu
sustentación, entra al sistema unos minutos antes para "despertar" los
servicios.

## Argumentos para tu sustentación

- **Cada servicio es independiente**: puedes apagar `notas-service` y
  el login, la asistencia y la gestión de usuarios siguen funcionando.
- **Cada servicio tiene su propia API REST** y solo escribe las tablas
  de su dominio — no hay una sola pieza de código que toque todo.
- **El Gateway es el único punto de entrada** del frontend: si mañana
  cambias la URL interna de `notas-service`, el frontend no se entera.
- **La composición de datos** (endpoint `/libreta/:id`) muestra el
  patrón real de microservicios: en vez de un JOIN de base de datos,
  el gateway llama a 3 servicios y arma la respuesta — así es como se
  resuelve un "join" cuando cada dominio es dueño de su propia data.
- **Seguridad real**: la `service role key` (que crea usuarios de
  Auth) ya no está expuesta en el navegador — vive solo en
  `usuarios-service`, en el backend.
