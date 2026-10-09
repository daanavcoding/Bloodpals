import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectContent } from './content.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scripts = await loadProjectContent(projectRoot);
console.log('Contenido válido: ' + scripts.length + ' script(s) revisado(s).');
