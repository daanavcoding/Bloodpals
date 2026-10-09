import fs from 'node:fs/promises';
import path from 'node:path';

const SCRIPT_SECTIONS = ['summary', 'tips', 'examples', 'bluffing', 'howToRun'];
const FILTERED_SECTIONS = new Set(['tips', 'examples', 'bluffing']);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('JSON no válido en ' + filePath + ': ' + error.message);
  }
}

async function jsonFiles(directory) {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'es'));
}

function requireText(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(label + ' debe ser un texto no vacío.');
  }
}

function validStatus(value, demo, label) {
  const expected = demo ? 'demo' : 'reviewed';
  if (value !== expected) {
    throw new Error(label + ' debe tener reviewStatus "' + expected + '".');
  }
}

function checkWikiSource(url, label, demo) {
  if (demo) return;
  requireText(url, label + '.url');
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(label + '.url no es una URL válida.');
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'wiki.bloodontheclocktower.com') {
    throw new Error(label + '.url debe apuntar a la wiki oficial por HTTPS.');
  }
}

function validateReviewUnits(units, scriptIds, label, demo) {
  if (!Array.isArray(units) || !units.length) throw new Error(label + '.reviewUnits debe ser una lista no vacía.');
  const seen = new Set();
  for (const [index, unit] of units.entries()) {
    const itemLabel = label + '.reviewUnits[' + index + ']';
    if (!unit || !SCRIPT_SECTIONS.includes(unit.section)) {
      throw new Error(itemLabel + '.section no es una sección reconocida.');
    }
    if (unit.sourceUnit === undefined || unit.sourceUnit === null || unit.sourceUnit === '') {
      throw new Error(itemLabel + '.sourceUnit es obligatorio.');
    }
    const key = unit.section + ':' + unit.sourceUnit;
    if (seen.has(key)) throw new Error(itemLabel + ': unidad fuente duplicada.');
    seen.add(key);
    if (!['keep', 'partial', 'omit'].includes(unit.decision)) {
      throw new Error(itemLabel + '.decision debe ser keep, partial u omit.');
    }
    requireText(unit.reason, itemLabel + '.reason');
    if (!Array.isArray(unit.mentionedCharacterIds) || !Array.isArray(unit.requiredCharacterIds)) {
      throw new Error(itemLabel + ' debe incluir mentionedCharacterIds y requiredCharacterIds como listas.');
    }
    if (unit.decision !== 'omit') requireText(unit.textEs, itemLabel + '.textEs');
    if (FILTERED_SECTIONS.has(unit.section) && unit.decision !== 'omit' && !demo) {
      const absent = unit.requiredCharacterIds.filter((id) => !scriptIds.has(id));
      if (absent.length) {
        throw new Error(itemLabel + ' conserva dependencias ajenas al script: ' + absent.join(', '));
      }
    }
  }
  for (const section of ['summary', 'howToRun']) {
    if (!units.some((unit) => unit.section === section && unit.decision === 'keep')) {
      throw new Error(label + ': falta contenido conservado en ' + section + '.');
    }
  }
}

function validateDisplay(curated, label) {
  if (!curated.displaySections) return;
  for (const section of SCRIPT_SECTIONS) {
    const input = curated.reviewUnits.filter((unit) => unit.section === section && unit.decision !== 'omit');
    const output = curated.displaySections[section];
    if (!Array.isArray(output)) throw new Error(label + ': falta displaySections.' + section);
    const covered = new Set();
    for (const block of output) {
      requireText(block.textEs, label + ': texto final');
      if (!Array.isArray(block.sourceUnits) || !block.sourceUnits.length) throw new Error(label + ': síntesis sin fuente.');
      for (const sourceUnit of block.sourceUnits) {
        if (!input.some((unit) => unit.sourceUnit === sourceUnit)) throw new Error(label + ': fuente de síntesis inválida: ' + sourceUnit);
        covered.add(sourceUnit);
      }
    }
    if (covered.size !== input.length) throw new Error(label + ': síntesis pierde unidades de ' + section);
    if (['examples', 'howToRun'].includes(section) && JSON.stringify(output.map((block) => block.textEs)) !== JSON.stringify(input.map((unit) => unit.textEs))) {
      throw new Error(label + ': ' + section + ' debe permanecer idéntico.');
    }
    const review = curated.synthesisReview?.[section];
    if (!review || review.reviewStatus !== 'reviewed' || !['unchanged', 'condensed'].includes(review.decision)) {
      throw new Error(label + ': falta revisión de síntesis para ' + section);
    }
    if (review.decision === 'unchanged' && JSON.stringify(output.map((block) => block.textEs)) !== JSON.stringify(input.map((unit) => unit.textEs))) {
      throw new Error(label + ': sección unchanged alterada.');
    }
  }
}

export async function loadProjectContent(projectRoot, { demo = false } = {}) {
  const contentRoot = demo
    ? path.join(projectRoot, 'fixtures', 'development', 'content')
    : path.join(projectRoot, 'content');
  const scriptsDirectory = path.join(contentRoot, 'scripts');
  const characterDirectory = path.join(contentRoot, 'characters');
  const curatedDirectory = path.join(contentRoot, 'curated');
  const scripts = [];

  for (const filename of await jsonFiles(scriptsDirectory)) {
    const scriptPath = path.join(scriptsDirectory, filename);
    const script = await readJson(scriptPath);
    const label = 'script ' + filename;
    validStatus(script.reviewStatus, demo, label);
    if (!ID_PATTERN.test(script.slug || '')) throw new Error(label + '.slug no es un ID seguro.');
    if (path.basename(filename, '.json') !== script.slug) {
      throw new Error(label + ' debe llamarse ' + script.slug + '.json.');
    }
    requireText(script.title, label + '.title');
    if (!Array.isArray(script.characters) || script.characters.length === 0) {
      throw new Error(label + '.characters debe contener al menos un personaje.');
    }

    const scriptIds = new Set();
    for (const [index, scriptEntry] of script.characters.entries()) {
      const entryLabel = label + '.characters[' + index + ']';
      if (!scriptEntry || !ID_PATTERN.test(scriptEntry.id || '')) {
        throw new Error(entryLabel + '.id no es un ID seguro.');
      }
      if (scriptIds.has(scriptEntry.id)) throw new Error(label + ' repite el personaje ' + scriptEntry.id + '.');
      scriptIds.add(scriptEntry.id);
    }

    const characters = [];
    for (const [index, scriptEntry] of script.characters.entries()) {
      const entryLabel = label + '.characters[' + index + ']';
      if (!scriptEntry || !ID_PATTERN.test(scriptEntry.id || '')) {
        throw new Error(entryLabel + '.id no es un ID seguro.');
      }
      requireText(scriptEntry.category, entryLabel + '.category');

      const characterPath = path.join(characterDirectory, scriptEntry.id + '.json');
      const character = await readJson(characterPath);
      validStatus(character.reviewStatus, demo, 'personaje ' + character.id);
      if (character.id !== scriptEntry.id) throw new Error(entryLabel + ' no coincide con el ID de su ficha base.');
      requireText(character.nameOriginal, 'personaje ' + character.id + '.nameOriginal');
      requireText(character.nameEs || character.nameOriginal, 'personaje ' + character.id + '.nameEs');
      requireText(character.abilityEs, 'personaje ' + character.id + '.abilityEs');
      if (!demo) {
        checkWikiSource(character.source?.url, 'personaje ' + character.id + '.source', false);
        if (!/^assets\/images\/characters\/[a-z0-9-]+\.(png|webp)$/.test(character.icon || '')) {
          throw new Error('personaje ' + character.id + ': falta un icono local válido.');
        }
        await fs.access(path.join(projectRoot, character.icon)).catch(() => {
          throw new Error('personaje ' + character.id + ': no existe su icono.');
        });
      }

      const curatedPath = path.join(curatedDirectory, script.slug, character.id + '.json');
      const curated = await readJson(curatedPath);
      validStatus(curated.reviewStatus, demo, 'curado ' + script.slug + '/' + character.id);
      if (curated.characterId !== character.id) throw new Error(curatedPath + ' tiene un characterId distinto.');
      if (!demo) {
        if (!curated.source || !Array.isArray(curated.source.sectionsPresent)) {
          throw new Error(curatedPath + ' debe registrar fuente y secciones revisadas.');
        }
        checkWikiSource(curated.source.url, curatedPath + '.source', demo);
        requireText(curated.source.checkedAt, curatedPath + '.source.checkedAt');
      }
      validateReviewUnits(curated.reviewUnits, scriptIds, curatedPath, demo);
      if (!demo) {
        for (const section of curated.source.sectionsPresent) {
          if (!SCRIPT_SECTIONS.includes(section) || !curated.reviewUnits.some((unit) => unit.section === section)) {
            throw new Error(curatedPath + ': sección de fuente sin cobertura: ' + section);
          }
        }
      }
      validateDisplay(curated, curatedPath);

      characters.push({
        ...character,
        category: scriptEntry.category,
        curated
      });
    }

    scripts.push({ ...script, characters });
  }

  return scripts;
}

export { SCRIPT_SECTIONS };
