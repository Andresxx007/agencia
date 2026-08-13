# FORTIS GLESNOR GROUP — Portal de Gestión Deportiva

Sistema profesional para la representación de jugadores de fútbol: contratos, documentos, negociaciones, transferencias, reportes, inteligencia artificial y administración de usuarios.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend API | C# · ASP.NET Core 8 · EF Core · PostgreSQL |
| Autenticación | JWT + ASP.NET Identity (roles) |
| Documentación | Swagger / OpenAPI |
| PDF | QuestPDF |
| Frontend | React 19 · TypeScript · Vite · Recharts |
| Tests unitarios/integración | xUnit · WebApplicationFactory · EF InMemory |
| Tests E2E | Playwright |
| Contenedores | Docker · Docker Compose |

---

## Módulos implementados

### Fase 1 — Base
- Gestión de jugadores (CRUD, paginación, visibilidad)
- Autenticación JWT con roles (`Administrador`, `Supervisor`, `Representante`, `Consulta`)
- Auditoría automática de todas las operaciones

### Fase 2 — Operaciones
- Contratos de representación (generación PDF con QuestPDF)
- Documentos del jugador (carga/descarga de archivos)
- Negociaciones (CRUD + interacciones por negociación)
- Transferencias (CRUD paginado con filtros)
- Notificaciones (lectura y marcado)
- Auditoría con filtros avanzados (entidad, acción, usuario, rango de fechas)
- Gestión de usuarios y roles desde el panel

### Fase 3 — Inteligencia y analítica
- Módulo inteligente: ranking de jugadores + compatibilidad por posición/edad
- Estadísticas por partido (goles, asistencias, minutos, rating)
- Currículum PDF del jugador
- Filtros avanzados de jugadores (posición, rango de edad, pie dominante)
- Importación masiva vía CSV
- Gráficas interactivas con Recharts (reportes, estadísticas)
- Pestaña **Perfil completo** del jugador

### Fase 4 — Calidad y UX
- Sistema de toasts (notificaciones visuales por operación)
- Badge de notificaciones no leídas con auto-polling cada 30 s
- **Informe PDF completo** del jugador (estadísticas, negociaciones, transferencias, contratos, documentos)
- Catálogos del sistema (CRUD de parámetros y valores)
- Code splitting del bundle frontend (recharts / react / axios en chunks independientes)
- Spinner y barra de carga por sección

### Fase 5 — Tests E2E y Dockerización completa
- 28 tests E2E con Playwright (auth, jugadores, perfil, reportes, catálogos, contratos, documentos, negociaciones, transferencias)
- `docker-compose.yml` con health checks y orden de arranque garantizado
- `docker-compose.test.yml` para ejecutar los tests de integración en CI contra PostgreSQL real
- `backend/tests/Dockerfile.tests` — imagen dedicada para el runner de tests

---

## Inicio rápido

### Desarrollo local

```bash
# 1. Backend
cd backend
dotnet run --project src/FortisSports.Api

# 2. Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

Accede a `http://localhost:5173`  
Credenciales por defecto: `admin@fortis.local` / `Fortis123*`

Swagger: `http://localhost:5100/swagger`

---

### Docker (producción / staging)

```bash
# Construye y levanta los tres servicios (BD + API + Frontend)
docker compose up --build

# Parar y eliminar contenedores
docker compose down
```

Los servicios arrancan en orden garantizado gracias a los health checks:
1. `db` (PostgreSQL) → espera hasta que `pg_isready` responde
2. `api` → espera hasta que el health check HTTP responde
3. `frontend` → sirve el build de Vite con nginx

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:5100 |
| PostgreSQL | localhost:5432 |

---

## Pruebas de integración (backend)

```bash
# Ejecución local (EF Core InMemory)
dotnet test FortisSports.slnx

# Ejecución en Docker contra PostgreSQL real
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from tests
```

Los resultados en formato TRX se guardan en `/test-results/results.trx` dentro del contenedor.

**Tests activos: 8/8**
- `Login_correcto_devuelve_token`
- `Crear_jugador_y_listar_funciona`
- `Acceso_sin_token_devuelve_401`
- `Filtro_por_posicion_devuelve_solo_jugadores_de_esa_posicion`
- `Generar_contrato_y_listar_por_jugador_funciona`
- `Crear_negociacion_y_listar_paginado_funciona`
- `Registrar_estadistica_y_consultar_historial_funciona`
- `Dashboard_report_devuelve_totales_coherentes`

---

## Tests E2E (Playwright)

```bash
cd frontend

# Instalar navegadores la primera vez
npx playwright install chromium firefox

# Ejecutar todos los tests (requiere backend + frontend corriendo)
npm run e2e

# Modo visual interactivo
npm run e2e:ui

# Ver reporte HTML del último run
npm run e2e:report
```

> Por defecto apunta a `http://localhost:5173`. Para cambiar: `E2E_BASE_URL=http://staging.example.com npm run e2e`

**Suites E2E (28 tests):**

| Archivo | Tests |
|---|---|
| `auth.spec.ts` | Formulario, credenciales incorrectas, login exitoso, cierre de sesión |
| `players.spec.ts` | Alta rápida, filtros avanzados, carga listado, edición, CSV |
| `perfil.spec.ts` | Carga de perfil, datos, botones PDF |
| `reportes.spec.ts` | Dashboard, gráficas Recharts, módulo inteligencia |
| `notificaciones.spec.ts` | Tab, carga, auditoría, catálogos |
| `contratos-docs.spec.ts` | Contratos, documentos, negociaciones, transferencias |

---

## Variables de entorno (backend)

| Variable | Descripción | Defecto dev |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | Cadena de conexión PostgreSQL | (ver appsettings) |
| `Jwt__Key` | Clave secreta JWT (≥ 32 chars) | `CAMBIAR_ESTA_CLAVE...` |
| `Jwt__Issuer` | Emisor del token | `FortisSports.Api` |
| `Jwt__Audience` | Audiencia del token | `FortisSports.Web` |
| `Storage__RootPath` | Ruta de almacenamiento de archivos | `./storage` |
| `Cors__FrontendUrl` | URL del frontend para CORS | `http://localhost:5173` |

---

## Estructura del proyecto

```
agencia/
├── backend/
│   ├── src/
│   │   ├── FortisSports.Api          ← Controladores, middlewares, Program.cs
│   │   ├── FortisSports.Application  ← Contratos (interfaces + DTOs)
│   │   ├── FortisSports.Domain       ← Entidades y enumeraciones
│   │   └── FortisSports.Infrastructure ← Servicios, DbContext, DI
│   └── tests/
│       ├── FortisSports.Tests        ← Tests de integración (xUnit)
│       └── Dockerfile.tests          ← Runner de tests en Docker
├── frontend/
│   ├── src/
│   │   ├── App.tsx                   ← Componente principal (todas las pestañas)
│   │   └── index.css                 ← Estilos globales
│   ├── e2e/                          ← Tests E2E Playwright
│   │   ├── helpers.ts
│   │   ├── auth.spec.ts
│   │   ├── players.spec.ts
│   │   ├── perfil.spec.ts
│   │   ├── reportes.spec.ts
│   │   ├── notificaciones.spec.ts
│   │   └── contratos-docs.spec.ts
│   └── playwright.config.ts
├── docker-compose.yml                ← Producción/staging (DB + API + Frontend)
├── docker-compose.test.yml           ← CI: tests de integración contra PostgreSQL
└── README.md
```
