import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadProjectContent } from '../tools/content.mjs';

const root = path.resolve(import.meta.dirname, '..');
test('all real characters have complete, traceable display content', async () => {
  const scripts = await loadProjectContent(root);
  assert.equal(scripts[0].characters.length, 25);
  for (const character of scripts[0].characters) {
    assert.ok(character.curated.displaySections);
    assert.equal(character.curated.displaySections.howToRun.map(b=>b.textEs).join('\n'),
      character.curated.reviewUnits.filter(u=>u.section==='howToRun'&&u.decision!=='omit').map(u=>u.textEs).join('\n'));
  }
});

async function fixture(t, edit) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'bloodpals-test-'));
  t.after(() => {
    if (!temp.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(temp).startsWith('bloodpals-test-')) throw new Error('Unexpected temporary directory');
    return fs.rm(temp, { recursive:true, force:true });
  });
  const script = JSON.parse(await fs.readFile(path.join(root,'content/scripts/anonymous-cult-dishonesty.json')));
  await fs.mkdir(path.join(temp,'content/scripts'),{recursive:true});
  await fs.mkdir(path.join(temp,'content/characters'),{recursive:true});
  await fs.mkdir(path.join(temp,'content/curated',script.slug),{recursive:true});
  await fs.cp(path.join(root,'assets/images/characters'),path.join(temp,'assets/images/characters'),{recursive:true});
  await fs.copyFile(path.join(root,'content/scripts',script.slug+'.json'),path.join(temp,'content/scripts',script.slug+'.json'));
  for (const entry of script.characters) {
    await fs.copyFile(path.join(root,'content/characters',entry.id+'.json'),path.join(temp,'content/characters',entry.id+'.json'));
    const c=JSON.parse(await fs.readFile(path.join(root,'content/curated',script.slug,entry.id+'.json')));
    if(entry.id==='farmer') edit(c);
    await fs.writeFile(path.join(temp,'content/curated',script.slug,entry.id+'.json'),JSON.stringify(c));
  }
  return temp;
}
test('reject a reviewed character with no sections', async t => {
  const dir=await fixture(t,c=>{c.reviewUnits=[];});
  await assert.rejects(loadProjectContent(dir), /no vacía/);
});
test('reject a changed narrator translation', async t => {
  const dir=await fixture(t,c=>{c.displaySections.howToRun[0].textEs+=' Alterado.';});
  await assert.rejects(loadProjectContent(dir), /permanecer idéntico/);
});
test('reject synthesis with lost source units', async t => {
  const dir=await fixture(t,c=>{c.displaySections.summary.pop();});
  await assert.rejects(loadProjectContent(dir), /pierde unidades/);
});
test('reject a retained dependency absent from the script', async t => {
  const dir=await fixture(t,c=>{c.reviewUnits.find(u=>u.section==='tips').requiredCharacterIds=['pit-hag'];});
  await assert.rejects(loadProjectContent(dir), /dependencias ajenas/);
});
