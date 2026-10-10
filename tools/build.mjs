import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadProjectContent } from './content.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const demo = process.argv.includes('--demo');
const outputRoot = demo
  ? path.join(projectRoot, 'work', 'demo-site')
  : path.join(projectRoot, 'site');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const styleVersion = createHash('sha256')
  .update(await fs.readFile(path.join(projectRoot, 'assets/css/site.css')))
  .digest('hex').slice(0, 12);

async function readTemplate(name) {
  const template = await fs.readFile(path.join(projectRoot, 'templates', name), 'utf8');
  return template.replaceAll('{{STYLE_VERSION}}', styleVersion);
}

function renderSection(unitGroup, title, sectionClass = '') {
  if (!unitGroup.length) return '';
  const items = unitGroup.map((unit) => '<li>' + escapeHtml(unit.textEs) + '</li>').join('');
  return '<section class="reader-section ' + sectionClass + '"><h3>' + title + '</h3><ul>' + items + '</ul></section>';
}

function renderSheet(character, demo, titleId = 'dialog-title') {
  const name = character.nameEs || character.nameOriginal;
  const units = character.curated.reviewUnits.filter((unit) => unit.decision !== 'omit');
  const bySection = (key) => character.curated.displaySections?.[key] || units.filter((unit) => unit.section === key);
  const summary = renderSection(bySection('summary'), 'Resumen', 'summary-section');
  const tips = renderSection(bySection('tips'), 'Trucos');
  const examples = renderSection(bySection('examples'), 'Ejemplos');
  const bluffing = renderSection(bySection('bluffing'), 'Farolear');
  const howToRunUnits = bySection('howToRun');
  const howToRun = howToRunUnits.length
    ? '<details class="reader-section reader-how-to-run"><summary>Cómo funciona para el narrador</summary><ul>' +
      howToRunUnits.map((unit) => '<li>' + escapeHtml(unit.textEs) + '</li>').join('') +
      '</ul></details>'
    : '';
  const source = !demo && character.curated.source
    ? '<p class="reader-source">Fuente: <a href="' + escapeHtml(character.curated.source.url) + '" target="_blank" rel="noreferrer">wiki oficial</a>' +
      ' · Revisado el ' + escapeHtml(character.curated.source.checkedAt) + '</p>'
    : '<p class="reader-source">Contenido ficticio de desarrollo; no es información del juego.</p>';

  return '<article class="reader-sheet">' +
    '<header class="reader-heading">' + (character.icon ? '<img class="reader-icon" src="../../' + escapeHtml(character.icon) + '" width="64" height="64" alt="">' : '') + '<h2 id="' + escapeHtml(titleId) + '">' + escapeHtml(name) + '</h2></header>' +
    '<blockquote class="reader-ability">' + renderSignedNumbers(character.abilityEs) + '</blockquote>' +
    summary + tips + examples + bluffing + howToRun + source +
    '</article>';
}

function renderCharacterCard(character) {
  const name = character.nameEs || character.nameOriginal;
  const mark = character.icon
    ? '<span class="character-mark"><img src="../../' + escapeHtml(character.icon) + '" alt="" width="42" height="42" loading="lazy"></span>'
    : '';
  const cardClass = character.icon ? 'character-card has-icon' : 'character-card';
  return '<a class="' + cardClass + '" href="#personaje=' + escapeHtml(character.id) + '" data-character-link="' + escapeHtml(character.id) + '">' +
    mark + '<span class="character-copy"><strong class="character-name">' + escapeHtml(name) + '</strong>' +
    '<span class="character-ability">' + renderSignedNumbers(character.abilityEs) + '</span></span><span class="character-row-arrow" aria-hidden="true"></span></a>';
}

function renderGroups(characters) {
  const groups = new Map();
  for (const character of characters) {
    if (!groups.has(character.category)) groups.set(character.category, []);
    groups.get(character.category).push(character);
  }
  return Array.from(groups.entries()).map(([category, group], index) =>
    '<section class="character-group" aria-labelledby="category-group-' + index + '">' +
    '<h3 id="category-group-' + index + '">' + escapeHtml(category) + '</h3>' +
    '<ul class="character-list">' + group.map((character) => '<li>' + renderCharacterCard(character) + '</li>').join('') + '</ul></section>'
  ).join('');
}

function renderPlayerCounts(playerCounts) {
  if (!playerCounts || !Array.isArray(playerCounts.players) || !Array.isArray(playerCounts.rows)) return '';
  const headers = playerCounts.players.map((count) => {
    const label = String(count).match(/^(\d+)(\+)$/);
    const renderedCount = label
      ? '<span class="count-label">' + escapeHtml(label[1]) + '<span class="number-sign">+</span></span>'
      : escapeHtml(count);
    return '<th scope="col">' + renderedCount + '</th>';
  }).join('');
  const rows = playerCounts.rows.map((row) =>
    '<tr><th scope="row">' + escapeHtml(row.label) + '</th>' +
    row.values.map((value) => '<td>' + escapeHtml(value) + '</td>').join('') + '</tr>'
  ).join('');
  return '<div class="setup-table-wrap" role="region" aria-label="Recuento de personajes por número de jugadores" tabindex="0">' +
    '<table class="player-count-table"><thead><tr><th scope="col">Jugadores</th>' + headers + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function renderSignedNumbers(value) {
  return escapeHtml(value).replace(/([+-])(\d+)/g, (match, sign, digits) =>
    '<span class="signed-number"><span class="number-sign">' + (sign === '-' ? '−' : '+') +
    '</span>' + digits + '</span>'
  );
}

function renderScriptNote(note) {
  return renderSignedNumbers(note);
}

function renderNightSteps(title, steps) {
  if (!Array.isArray(steps) || !steps.length) return '';
  const items = steps.map((step) =>
    '<li><strong class="night-step-name">' + escapeHtml(step.label) + '</strong><p>' + escapeHtml(step.text) + '</p></li>'
  ).join('');
  return '<details class="night-order"><summary>' + escapeHtml(title) + '</summary><ol class="night-sequence">' + items + '</ol></details>';
}

function renderNightSequence(sequence) {
  if (!sequence) return '';
  return renderNightSteps('Primera noche', sequence.firstNight) + renderNightSteps('Otras noches', sequence.otherNights);
}

async function writeScriptPage(script, template, demo) {
  const groups = renderGroups(script.characters);
  const fallbacks = script.characters.map((character) => {
    const sheet = renderSheet(character, demo);
    const fallbackSheet = renderSheet(character, demo, 'fallback-title-' + character.id)
      .replace('<header class="reader-heading">', '<a class="fallback-close" href="#script-top">Volver al script</a><header class="reader-heading">');
    return '<template data-character-template="' + escapeHtml(character.id) + '">' + sheet + '</template>' +
      '<section class="character-fallback" id="personaje=' + escapeHtml(character.id) + '" aria-labelledby="fallback-title-' +
      escapeHtml(character.id) + '">' + fallbackSheet + '</section>';
  }).join('');
  const notes = Array.isArray(script.notes) && script.notes.length
    ? '<ul class="script-notes" role="list">' + script.notes.map((note) => '<li><span class="script-note-copy">' + renderScriptNote(note) + '</span></li>').join('') + '</ul>'
    : '';
  const version = script.version
    ? '<p class="script-version">Versión: ' + escapeHtml(script.version) + '</p>'
    : '';
  const setupTable = renderPlayerCounts(script.playerCounts);
  const nightSequence = renderNightSequence(script.nightSequence);
  const scriptUrl = 'https://daanavcoding.github.io/Bloodpals/scripts/' + encodeURIComponent(script.slug) + '/';
  const demoBanner = demo
    ? '<div class="demo-banner">DATOS FICTICIOS DE DESARROLLO · NO PUBLICAR</div>'
    : '';
  const html = template
    .replaceAll('{{SCRIPT_TITLE}}', escapeHtml(script.title))
    .replaceAll('{{SCRIPT_URL}}', escapeHtml(scriptUrl))
    .replace('{{SCRIPT_VERSION}}', version)
    .replace('{{SCRIPT_NOTES}}', notes)
    .replace('{{CHARACTER_COUNT}}', String(script.characters.length).padStart(2, '0'))
    .replace('{{CHARACTER_GROUPS}}', groups)
    .replace('{{SETUP_TABLE}}', setupTable)
    .replace('{{NIGHT_SEQUENCE}}', nightSequence)
    .replace('{{CHARACTER_FALLBACKS}}', fallbacks)
    .replace('{{DEMO_BANNER}}', demoBanner)
    .replace('<body class="script-body">', '<body class="script-body' + (demo ? ' demo-mode' : '') + '">');
  const destination = path.join(outputRoot, 'scripts', script.slug, 'index.html');
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, html, 'utf8');
}

const scripts = await loadProjectContent(projectRoot, { demo });
const homeTemplate = await readTemplate('home.html');
const scriptTemplate = await readTemplate('script.html');
const demoBanner = demo
  ? '<div class="demo-banner">DATOS FICTICIOS DE DESARROLLO · NO PUBLICAR</div>'
  : '';
const scriptCards = scripts.map((script) =>
  '<li><a class="script-row" href="scripts/' + encodeURIComponent(script.slug) + '/index.html">' +
  '<span class="script-row-title">' + escapeHtml(script.title) + '</span>' +
  '<span class="script-row-count">' + script.characters.length + ' personajes</span>' +
  '<span class="row-arrow" aria-hidden="true"></span></a></li>'
).join('');
const emptyState = scripts.length
  ? ''
  : '<article class="empty-state"><h3>Aún no hay scripts en la biblioteca.</h3>' +
    '<p>Cuando compartas la imagen o el PDF del primero y su nombre, lo añadiremos aquí con una página propia.</p></article>';
const home = homeTemplate
  .replace('{{HOME_DEMO_BANNER}}', demoBanner)
  .replace('{{SCRIPT_COUNT}}', String(scripts.length).padStart(2, '0'))
  .replace('{{EMPTY_STATE}}', emptyState)
  .replace('{{SCRIPT_LIST}}', scripts.length ? '<ul class="script-index">' + scriptCards + '</ul>' : '');

const expectedOutput = demo
  ? path.join(projectRoot, 'work', 'demo-site')
  : path.join(projectRoot, 'site');
if (path.resolve(outputRoot) !== path.resolve(expectedOutput)) {
  throw new Error('La carpeta de salida no coincide con la salida generada esperada.');
}
await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(outputRoot, { recursive: true });
await fs.mkdir(path.join(outputRoot, 'assets'), { recursive: true });
await fs.cp(path.join(projectRoot, 'assets'), path.join(outputRoot, 'assets'), { recursive: true,
  filter: (source) => !(/(?:background|characters)[\\/].*\.png$/.test(source) || /BarlowCondensed/.test(source)) });
await fs.writeFile(path.join(outputRoot, 'index.html'), home, 'utf8');
const basePath = process.env.PAGES_BASE_PATH || '/';
if (!/^\/(?:[A-Za-z0-9._-]+\/)*$/.test(basePath)) throw new Error('PAGES_BASE_PATH debe ser una ruta absoluta terminada en /.');
const notFound = home
  .replace('<title>BLOODPALS - scripts y personajes</title>', '<title>Página no encontrada - BLOODPALS</title>')
  .replace('<head>', '<head>\n  <base href="' + basePath + '">')
  .replace('<h1>Scripts</h1>', '<h1>Página no encontrada</h1>')
  .replace('Elige un script para consultar sus personajes.', 'La dirección no existe. Elige un script de la biblioteca para continuar.');
await fs.writeFile(path.join(outputRoot, '404.html'), notFound, 'utf8');
await fs.writeFile(path.join(outputRoot, '.nojekyll'), '', 'utf8');
for (const script of scripts) await writeScriptPage(script, scriptTemplate, demo);

console.log('Generación completada: ' + scripts.length + ' script(s) en ' + path.relative(projectRoot, outputRoot) + '.');
