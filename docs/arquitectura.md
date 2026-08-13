# Arquitectura inicial

## Convención de nombres (código)

- En el **frontend**, los identificadores propios (estado, funciones, variables locales) se expresan en **español** (por ejemplo `jugadores`, `cargarJugadores`, `FilaJugador`).
- Las **propiedades de los DTO** que viajan en JSON siguen en **inglés** (`firstName`, `items`, etc.) para coincidir con la API sin capa de mapeo.
- Las **rutas HTTP** de la API usan **prefijos y segmentos en español** (p. ej. `api/jugadores`, `api/autenticacion/inicio-sesion`). Los **nombres de parámetros en query** siguen alineados con el código existente (`page`, `search`, …).
- **Controladores** (clases C#): `JugadoresController`, `AutenticacionController`, `CatalogosController`, `ContratosController`, `DocumentosController`, `NegociacionesController`, `TransferenciasController`, `ReportesController`, `UsuariosController`, `AuditoriaController`, `NotificacionesController`, `InteligenciaController`, `EstadisticasJugadorController`.

## Enfoque

Se implementa una arquitectura en capas para mantener separación de responsabilidades:

1. **API**: expone endpoints REST, autenticación, middleware de errores.
2. **Application**: contratos de entrada/salida (DTO) y servicios de negocio.
3. **Domain**: entidades y reglas de dominio base.
4. **Infrastructure**: persistencia EF Core, Identity, JWT, generación de PDF, almacenamiento de archivos.

## Mapa de rutas API (resumen)

| Prefijo | Uso |
|--------|-----|
| `api/autenticacion` | Inicio de sesión (`inicio-sesion`) |
| `api/jugadores` | CRUD jugadores, importar CSV, curriculum, informe completo |
| `api/catalogos` | Listas maestras; `elementos`, `por-codigo/{c}/elementos` |
| `api/contratos` | generar, `jugador/{id}`, `descargar` |
| `api/documentos` | `cargar`, `jugador/{id}`, `descargar` |
| `api/negociaciones` | CRUD, `interacciones`, `jugador/{id}` |
| `api/transferencias` | CRUD paginado, `estado` |
| `api/reportes` | `panel`, informes, `exportar/csv`, `exportar/pdf` |
| `api/usuarios` | administración, `rol` |
| `api/auditoria` | listado filtrado |
| `api/notificaciones` | `sin-leer`, marcar `leida` |
| `api/inteligencia` | `ranking`, `compatibilidad` |
| `api/estadisticas-jugador` | partidos, `jugador/{id}` |

## Decisiones técnicas

- Base de datos relacional: PostgreSQL.
- Persistencia: EF Core Code First con migraciones.
- Seguridad: ASP.NET Identity + JWT.
- Documentos: almacenamiento en sistema de archivos con metadata en BD.
- Contratos: generación PDF con QuestPDF.

## Modelo base de datos (iteración 1)

- `AspNetUsers`, `AspNetRoles`, tablas Identity relacionadas.
- `Players`
- `RepresentationContracts`
- `PlayerDocuments`

## Escalabilidad planeada

- Incorporar módulos de negociaciones, transferencias, reportes y notificaciones.
- Agregar bitácora de auditoría por cambios (`before/after`) en entidades críticas.
- Migrar almacenamiento documental a objeto remoto (S3/Azure Blob) en etapa productiva.
- Integrar un motor de recomendación parametrizable basado en scoring.
