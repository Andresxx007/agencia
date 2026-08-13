/**
 * Sincroniza rutas del front con controladores en español (api/jugadores, etc.).
 * Ejecutar una sola vez desde la raíz del front: node scripts/actualizar-rutas-api-frontend.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appTsx = path.join(__dirname, '..', 'src', 'App.tsx');
let s = fs.readFileSync(appTsx, 'utf8');

// Orden: cadenas más largas / específicas primero.
const pares = [
  ['/reports/dashboard/export/pdf', '/reportes/panel/exportar/pdf'],
  ['/reports/contracts/export/csv', '/reportes/contratos/exportar/csv'],
  ['/reports/negotiations/export/csv', '/reportes/negociaciones/exportar/csv'],
  ['/reports/transfers/export/csv', '/reportes/transferencias/exportar/csv'],
  ['/reports/dashboard', '/reportes/panel'],
  ['/reports/negotiations', '/reportes/negociaciones'],
  ['/reports/transfers', '/reportes/transferencias'],
  ['/reports/contracts', '/reportes/contratos'],
  ['/notifications/unread-count', '/notificaciones/sin-leer'],
  ['/notifications/', '/notificaciones/'],
  ['/players/import', '/jugadores/importar'],
  ['/full-report', '/informe-completo'],
  ['/players/', '/jugadores/'],
  ['/catalogs/by-code/', '/catalogos/por-codigo/'],
  ['/catalogs/items', '/catalogos/elementos'],
  ['/catalogs/', '/catalogos/'],
  ['/contracts/generate', '/contratos/generar'],
  ['/contracts/player/', '/contratos/jugador/'],
  ['/contracts/', '/contratos/'],
  ['/documents/upload', '/documentos/cargar'],
  ['/documents/player/', '/documentos/jugador/'],
  ['/documents/', '/documentos/'],
  ['/negotiations/interactions', '/negociaciones/interacciones'],
  ['/negotiations/', '/negociaciones/'],
  ['/negotiations?', '/negociaciones?'],
  ['/transfers', '/transferencias'],
  ['/intelligence/ranking', '/inteligencia/ranking'],
  ['/intelligence/compatibility', '/inteligencia/compatibilidad'],
  ['/player-stats/player/', '/estadisticas-jugador/jugador/'],
  ['/player-stats', '/estadisticas-jugador'],
  ['/audit?', '/auditoria?'],
  // No reemplazar `/audit` solo: formaría rutas rotas dentro de `/auditoria`.
  ['/users/', '/usuarios/'],
  ['/auth/login', '/autenticacion/inicio-sesion'],
];

for (const [a, b] of pares) {
  s = s.split(a).join(b);
}

// GET lista usuarios y notificaciones sin barra final
s = s.split("'/notifications'").join("'/notificaciones'");
s = s.split("'/catalogs'").join("'/catalogos'");
s = s.split("'/users'").join("'/usuarios'");
// Listado jugadores inicial: '/jugadores?page...
s = s.split("'/players?page").join("'/jugadores?page");

fs.writeFileSync(appTsx, s);
console.log('App.tsx rutas actualizadas.');
