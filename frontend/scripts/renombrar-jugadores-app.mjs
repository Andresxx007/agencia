/**
 * Renombra identificadores relacionados con jugadores en App.tsx.
 * Las rutas `/players` del API no deben cambiar a `/jugadores`.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const archivoApp = path.join(__dirname, '..', 'src', 'App.tsx');
let s = fs.readFileSync(archivoApp, 'utf8');

s = s.replace(/\bPlayerRow\b/g, 'FilaJugador');
s = s.replace(/\bPlayerFull\b/g, 'JugadorCompleto');

const pares = [
  ['setPlayerPositionValue', 'setPosicionPrincipal'],
  ['playerPositionValue', 'posicionPrincipal'],
  ['setPlayerPreferredFoot', 'setPieHabil'],
  ['playerPreferredFoot', 'pieHabil'],
  ['setPlayerCurrentClub', 'setClubActual'],
  ['playerCurrentClub', 'clubActual'],
  ['setPlayerNationality', 'setNacionalidadJugador'],
  ['playerNationality', 'nacionalidadJugador'],
  ['setPlayerBirthDate', 'setFechaNacimiento'],
  ['playerBirthDate', 'fechaNacimiento'],
  ['setPlayerLastName', 'setApellidoJugador'],
  ['playerLastName', 'apellidoJugador'],
  ['setPlayerHeightCm', 'setAlturaCm'],
  ['playerHeightCm', 'alturaCm'],
  ['setPlayerWeightKg', 'setPesoKg'],
  ['playerWeightKg', 'pesoKg'],
  ['setPlayerAgencyStatus', 'setEstadoAgenciaFiltro'],
  ['playerAgencyStatus', 'estadoAgenciaFiltro'],
  ['setPlayerMinAge', 'setEdadMinimaFiltro'],
  ['playerMinAge', 'edadMinimaFiltro'],
  ['setPlayerMaxAge', 'setEdadMaximaFiltro'],
  ['playerMaxAge', 'edadMaximaFiltro'],
  ['setPlayerFoot', 'setPieFiltro'],
  ['playerFoot', 'pieFiltro'],
  ['setPlayerSearch', 'setBusquedaJugadores'],
  ['playerSearch', 'busquedaJugadores'],
  ['setPlayerPosition', 'setFiltroPosicion'],
  ['playerPosition', 'filtroPosicion'],
  ['setPlayerPage', 'setPaginaJugadores'],
  ['playerPage', 'paginaJugadores'],
  ['setPlayerTotal', 'setTotalJugadores'],
  ['playerTotal', 'totalJugadores'],
  ['setEditingPlayer', 'setJugadorEnEdicion'],
  ['editingPlayer', 'jugadorEnEdicion'],
  ['setPlayerName', 'setNombreJugador'],
  ['playerName', 'nombreJugador'],
  ['setPlayers', 'setJugadores'],
  ['setSelectedPlayerId', 'setIdJugadorSeleccionado'],
  ['selectedPlayerId', 'idJugadorSeleccionado'],
  ['setProfilePlayer', 'setJugadorPerfil'],
  ['profilePlayer', 'jugadorPerfil'],
  ['setPositionOptions', 'setOpcionesPosicion'],
  ['positionOptions', 'opcionesPosicion'],
  ['setNationalityOptions', 'setOpcionesNacionalidad'],
  ['nationalityOptions', 'opcionesNacionalidad'],
  ['setClubOptions', 'setOpcionesClubes'],
  ['clubOptions', 'opcionesClubes'],
  ['loadPlayers', 'cargarJugadores'],
  ['totalPlayerPages', 'totalPaginasJugadores'],
  ['playerSelector', 'selectorJugador'],
];

s = s.replace(/\bPAGE_SIZE\b/g, 'TAMANIO_PAGINA_JUGADORES');

for (const [viejo, nuevo] of pares) {
  const re = new RegExp(`\\b${viejo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
  s = s.replace(re, nuevo);
}

// Resguardar rutas que contienen la palabra "players" antes de renombrar el identificador `players`.
const rutasApi = [];
s = s.replace(/(['"`])\/players\b[^'"`]*/g, (coincidencia) => {
  rutasApi.push(coincidencia);
  return `\x00API${rutasApi.length - 1}\x00`;
});

s = s.replace(/\bplayers\b/g, 'jugadores');

for (let i = rutasApi.length - 1; i >= 0; i--) {
  s = s.split(`\x00API${i}\x00`).join(rutasApi[i]);
}

fs.writeFileSync(archivoApp, s);
console.log('OK: rutas API preservadas:', rutasApi.length);
