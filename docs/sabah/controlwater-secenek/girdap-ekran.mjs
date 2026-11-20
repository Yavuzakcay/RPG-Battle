// Girdap ekran görüntüsü: Vite geliştirme sunucusu, tarayıcıda savaş kurulur (Control Water girdabı + STR save nedeni),
// kayıtlı savaş olarak açılır, günlük açılır, ekran görüntüsü alınır.
import { chromium } from 'playwright';
import { createServer } from 'vite';

const OUT = process.argv[2];
const server = await createServer({ root: process.cwd(), server: { port: 0, host: '127.0.0.1' }, logLevel: 'error',
  optimizeDeps: { entries: ['index.html', 'src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/test-setup.ts'] } });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
page.setDefaultTimeout(90000);
page.on('pageerror', (e) => console.log('pageerror', String(e)));
await page.addInitScript(() => { try { localStorage.setItem('rpg-battle-effects', 'off'); localStorage.setItem('rpg-battle-dice-anim', 'off'); localStorage.setItem('rpg-battle-acilis', 'off'); } catch { /* yok */ } });
await page.goto(url);
const info = await page.evaluate(async () => {
  const data = await import('/src/data/index.ts');
  await Promise.all([data.loadMonsters(), data.loadClassData()]);
  const fx = await import('/src/screens/fixtures.ts');
  localStorage.setItem('rpg-battle-characters', JSON.stringify(fx.demoCharacters()));
  const create = await import('/src/battle/create.ts');
  const setup = await import('/src/app/setup.ts');
  const { execute } = await import('/src/battle/commands.ts');
  const { applyEvents } = await import('/src/battle/reduce.ts');
  const chars = fx.demoCharacters();
  const pc = create.combatantFromSheet(chars[0].sheet, { id: 'pc1', ownerId: chars[0].id });
  const wiz = { ...pc, spellNames: [...pc.spellNames, 'Control Water'], spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0], spellSaveDc: 15 };
  const ogre = data.getMonster('ogre') ?? data.getMonster('orc');
  const foes = [create.combatantFromMonster(ogre, { id: 'foe1', name: ogre.name + ' 1' }), create.combatantFromMonster(ogre, { id: 'foe2', name: ogre.name + ' 2' })];
  const session = setup.createMapBattle([wiz, ...foes], { mapId: 'kale-onu', variantId: 'gunduz' }, () => 0.5);
  let state = session.state; const events = [...session.events];
  const gm = { playerId: 'gm', isGm: true };
  const rng = () => 0.3;
  const ctxOf = (id) => { const c = state.combatants[id]; return c && c.side === 'party' ? { playerId: c.ownerId, isGm: false } : gm; };
  const run = (cmd, ctx = cmd.actorId ? ctxOf(cmd.actorId) : gm) => { const r = execute(state, cmd, ctx, rng); if (!r.ok) throw new Error(cmd.type + ': ' + r.error); state = r.state; events.push(...r.events); return r; };
  // Düşmanları yan yana, büyücüden uzağa yerleştir.
  const pcPos = state.combatants.pc1.pos;
  run({ type: 'place', actorId: 'foe1', at: { col: pcPos.col + 6, row: pcPos.row } }, gm);
  run({ type: 'place', actorId: 'foe2', at: { col: pcPos.col + 6, row: pcPos.row + 1 } }, gm);
  run({ type: 'start_battle' });
  // STR save dezavantajı kaynağı (Enlarge/Reduce: Reduce) ilk düşmana.
  const fxEv = { type: 'effect_added', targetId: 'foe1', effect: { id: 'demo:reduce', name: 'Enlarge/Reduce', sourceId: 'pc1', until: 99, saveDis: ['str'] } };
  state = applyEvents(state, [fxEv]); events.push(fxEv);
  let guard = 0;
  while (state.order[state.turnIndex] !== 'pc1' && guard++ < 10) run({ type: 'end_turn', actorId: state.order[state.turnIndex] });
  run({ type: 'cast_spell', actorId: 'pc1', spellName: 'Control Water', targetId: 'foe1', slotLevel: 5, choice: 'whirlpool' }, { playerId: chars[0].id, isGm: false });
  guard = 0;
  while (state.order[state.turnIndex] !== 'foe1' && guard++ < 10) run({ type: 'end_turn', actorId: state.order[state.turnIndex] });
  const sv = events.filter((e) => e.type === 'save_resolved').map((e) => ({ t: e.targetId, d20: e.d20, why: e.modeWhy, ok: e.success }));
  localStorage.setItem('rpg-battle-save', JSON.stringify({ version: 23, savedAt: new Date().toISOString(), events }));
  return { sv, order: state.order, ver: state.kuralSurumu };
});
console.log(JSON.stringify(info));
await page.reload();
await page.click('[data-testid="home-resume"]');
await page.waitForSelector('.hud-btn', { timeout: 90000 });
await page.waitForTimeout(2500);
await page.getByRole('button', { name: 'Günlük' }).click();
await page.waitForTimeout(500);
// Save satırını aç (ayrıntıda neden).
const row = page.locator('.log-box li.expandable', { hasText: 'Control Water' }).first();
if (await row.count()) await row.click();
await page.waitForTimeout(500);
await page.screenshot({ path: OUT });
await browser.close();
await server.close();
