import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const curated = id => read(`content/curated/anonymous-cult-dishonesty/${id}.json`);
const unit = (c, ref) => c.reviewUnits.find(u => u.sourceUnit === ref);
const displayed = (c, section) => c.displaySections[section].map(b => b.textEs).join('\n');

test('Harpy deaths do not become executions and Godfather accepts a daytime death', async () => {
  const harpy = await curated('harpy');
  const procedure = displayed(harpy, 'howToRun');
  assert.match(procedure, /puedes matar a uno de los dos jugadores o a ambos/);
  assert.doesNotMatch(procedure, /ejecut|fase nocturna|pasa a la/);
  assert.match(unit(harpy, 'tips-4').textEs, /quiera que muera el jugador vivo/);
  const godfather = await curated('godfather');
  assert.match(unit(godfather, 'howtorun-3').textEs, /Si un Forastero muere durante el día/);
  assert.doesNotMatch(unit(godfather, 'howtorun-3').textEs, /ejecut/);
});

test('Scarlet Woman uses the dead Demon type and Ojo chooses characters', async () => {
  const scarlet = await curated('scarlet-woman');
  assert.match(displayed(scarlet, 'howToRun'), /mismo tipo de Demonio que murió/);
  assert.doesNotMatch(displayed(scarlet, 'howToRun'), /ficha de Ojo|solo hay un tipo de Demonio/);
  assert.doesNotMatch(displayed(scarlet, 'tips'), /más probable es que seas buena/);
  assert.match(displayed(scarlet, 'summary'), /justo antes de morir/);
  const ojo = await curated('ojo');
  assert.match(unit(ojo, 'tips-5').textEs, /elige ese personaje/);
  assert.match(unit(ojo, 'tips-6').textEs, /el personaje que afirmaba ser/);
  assert.doesNotMatch(unit(ojo, 'tips-6').textEs, /cambió su personaje/);
});

test('absent causal examples and transplanted Undertaker advice stay excluded', async () => {
  for (const [id, refs] of Object.entries({
    shugenja: ['examples-1', 'examples-2'],
    'cult-leader': ['examples-1', 'examples-2', 'examples-3'],
    ogre: ['examples-1', 'examples-2'],
    barber: ['examples-1', 'examples-2', 'examples-3'],
    banshee: ['examples-1', 'examples-3'],
    lleech: ['examples-1', 'examples-2'],
  })) {
    const c = await curated(id);
    for (const ref of refs) assert.equal(unit(c, ref).decision, 'omit', id + '/' + ref);
  }
  const undertaker = await curated('undertaker');
  assert.equal(unit(undertaker, 'bluffing-7'), undefined);
  assert.equal(unit(undertaker, 'bluffing-8'), undefined);
});

test('corrections preserve subjects, alternatives and the Drunk character distinction', async () => {
  const atheist = await curated('atheist');
  assert.match(unit(atheist, 'tips-5').textEs, /Si eres el Borracho, no eres el Ateo/);
  assert.doesNotMatch(unit(atheist, 'tips-5').textEs, /Si lo estás, no eres/);
  const cult = await curated('cult-leader');
  assert.match(unit(cult, 'bluffing-10').textEs, /Enterrador: puede descubrir tu farol/);
  assert.doesNotMatch(unit(cult, 'bluffing-10').textEs, /confirmarlo/);
  const pixie = await curated('pixie');
  assert.match(displayed(pixie, 'tips'), /dos buenos/);
  assert.match(displayed(pixie, 'tips'), /Investigador/);
  assert.match(displayed(pixie, 'tips'), /Enterrador/);
  assert.match(displayed(await curated('farmer'), 'tips'), /Para sobrevivir[\s\S]*Para atraer su ataque/);
  assert.match(displayed(await curated('grandmother'), 'bluffing'), /al grupo que (?:una|la) Abuela te habló en privado/);
  assert.match(displayed(await curated('banshee'), 'bluffing'), /equipo malvado evite matarte para no confirmarte/);
  assert.match(displayed(await curated('marionette'), 'tips'), /sin (?:el riesgo de )?perder la partida/);
});

test('reviewed input remains frozen through synthesis, with protected sections exact', async () => {
  const review = await read('content/reviews/synthesis-correction-20261009.json');
  assert.equal(review.characters.length, 25);
  for (const record of review.characters) {
    const c = await curated(record.characterId);
    const base = await read(`content/characters/${record.characterId}.json`);
    const input = { abilityEs: base.abilityEs, reviewUnits: c.reviewUnits };
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex'), record.inputHash, record.characterId + ': entrada modificada sin nueva revisión');
    for (const section of ['examples', 'howToRun']) assert.deepEqual(c.displaySections[section].map(b => b.textEs), record.fixedInput.reviewUnits.filter(u => u.section === section && u.decision !== 'omit').map(u => u.textEs), record.characterId + '/' + section);
    assert.deepEqual(c.displaySections, record.finalDisplaySections);
  }
});
