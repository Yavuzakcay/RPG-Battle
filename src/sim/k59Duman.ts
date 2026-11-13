/**
 * Kuyruk K59 Görev 1: tam açık duman testi. Bütün ev kuralları (imza, Moral tam, Karadul, hizalanma bayrakları,
 * çarpma…), bütün Game Master mekanik anahtarları (`data/kural-kontrol.json`: ortak sistemler, arazi × büyü, gece/fırtına
 * dahil) açık; yapay zekâ zorluğu ve rolü tohuma göre döner; çok altıgen bayrağı her 4. tohumda.
 * 12 sınıf (iki 6'lı parti: A barbar/bard/rahip/druid/savaşçı/keşiş, B paladin/korucu/haydut/sihirbaz/büyücü/warlock;
 * tek tohumda imza alt sınıf (Druid: Karadul), çift tohumda SRD) × seviye × harita türü × tohum.
 * Her savaş: her komut geçerli (yapay zekânın seçtiği komut reddedilmez), istisna yok, sonsuz döngü yok (komut sınırı),
 * NaN/Infinity yok, tutarlı durum (HP 0..maxHp, konum haritada), olaylar iki kez baştan oynatılınca aynı durum.
 *   npx vite-node src/sim/k59Duman.ts -- 20 [--seviye 3,7] [--harita col,kale-gece] [--tur 5] [--json çıktı.json]
 */
import { loadTrExtra } from '../i18n';
import { classData, getMonster, loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
// Görev AS2: alt sınıf paketi (icerik/ ya da 12 kaydın fikstürü).
await (await import('./simIcerik')).loadSimContent();
const { SCENARIOS, partyAt, enemiesAt } = await import('./balance');
const { execute } = await import('../battle/commands');
const { chooseCommand } = await import('../battle/ai');
const { replay } = await import('../battle/reduce');
const { combatantFromMonster, combatantFromSheet } = await import('../battle/create');
const { createMapBattle } = await import('../app/setup');
const { seededRng } = await import('../rules/dice');
const { currentActorId } = await import('../battle/common');
const { contextFor } = await import('../ui/session');
const houseData = (await import('../../data/ev-kurallari.json')).default;
const ruleData = (await import('../../data/kural-kontrol.json')).default;
import type { BattleEvent, BattleState, Combatant, Command } from '../battle/types';
import type { CharacterSheet } from '../rules/stats';

declare const process: { argv: string[]; exit(n: number): void };
type FsLike = { writeFileSync(path: string, data: string): void };
const NODE_FS: string = 'node:fs';
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const seeds = Number(args.find((a, i) => /^\d+$/.test(a) && !(args[i - 1] ?? '').startsWith('--')) ?? 20);
const firstSeed = Number(opt('--ilk') ?? 1);
const levels = (opt('--seviye') ?? '3,7,11,15,20').split(',').map(Number);
const maxRounds = Number(opt('--tur') ?? 5);

/** Harita türü başına bir senaryo (haritanın kendi seçenekleri: ejderha, masum, gruplar); düşmanlar seviye listesinden. */
const MAP_TYPES: Array<{ id: string; scenario?: string; map?: { mapId: string; variantId: string } }> = [
  { id: 'col', scenario: 'col' }, { id: 'kale-gece', scenario: 'kale-gece' }, { id: 'magara', scenario: 'magara' },
  { id: 'dungeon-merdiven', scenario: 'dungeon-merdiven' }, { id: 'taverna', scenario: 'taverna' },
  { id: 'orman-ork', scenario: 'orman-ork' }, { id: 'kale-baskini', scenario: 'kale-baskini' },
  { id: 'sefer-demirhane', scenario: 'sefer-demirhane' }, { id: 'derin-lav', scenario: 'derin-lav' },
  { id: 'buzul', scenario: 'k29-buzul-acik' }, { id: 'dag', scenario: 'k29-dag-kopru' }, { id: 'bataklik', scenario: 'k29-batak-kamp' },
  { id: 'col-nehir', scenario: 'k29-col-kanyon-nehri' }, { id: 'kasaba', scenario: 'k34-kasaba-han' },
  { id: 'lagim', scenario: 'k35-kasaba-lagim' }, { id: 'hapishane', scenario: 'k36-dis-halka' },
  { id: 'volkan-ejder', scenario: 'volkan-ejder' },
  { id: 'vitrin', map: { mapId: 'ortamlar-diyari', variantId: 'gunduz' } },
  { id: 'deniz-firtina', map: { mapId: 'gemi', variantId: 'firtina' } },
];
const mapFilter = opt('--harita')?.split(',');
const maps = MAP_TYPES.filter((m) => !mapFilter || mapFilter.includes(m.id));

const GROUPS = { A: ['k18-barbarian', 'k18-bard', 'k18-cleric', 'k18-druid', 'k18-fighter', 'k18-monk'], B: ['k18-paladin', 'k18-ranger', 'k18-rogue', 'k18-sorcerer', 'k18-warlock', 'k18-wizard'] };
const imzaOf = (cls: string) => classData.subclasses.find((s) => s.ev && s.class === cls)?.id;
const ALL_HOUSE = Object.fromEntries(Object.keys(houseData.rules).map((k) => [k, true]));
const ALL_TOGGLES = Object.fromEntries(Object.keys((ruleData as { rules: Record<string, unknown> }).rules).map((k) => [k, true]));
const DIFFS = ['normal', 'kolay', 'usta'] as const;
const ROLES = [undefined, 'hasarci', 'kontrolcu', 'destek', 'tank'] as const;
const ENEMY_LISTS = ['col', 'kale', 'magara', 'orman'];

function sheetsFor(group: string[], level: number, imza: boolean): CharacterSheet[] {
  return group.map((kind) => {
    const sheet = partyAt(level, kind)[0] as CharacterSheet;
    const sub = imza ? imzaOf(sheet.classId) : undefined;
    return sub ? { ...sheet, subclassId: sub } : sheet;
  });
}

function enemies(level: number, seed: number): Combatant[] {
  const sc = SCENARIOS.find((s) => s.id === ENEMY_LISTS[seed % ENEMY_LISTS.length]);
  const out: Combatant[] = [];
  for (const [id, n] of Object.entries(sc ? enemiesAt(sc, level) : { goblin: 3 })) {
    for (let i = 1; i <= n && out.length < 8; i++) out.push(combatantFromMonster(getMonster(id), { id: `${id}-${i}`, name: `${getMonster(id).name} ${i}` }));
  }
  return out;
}

/** NaN ya da sonsuz sayı yolu (ilk bulunan). */
function badNumber(v: unknown, path = '', seen = new Set<unknown>()): string | null {
  if (typeof v === 'number') return Number.isFinite(v) ? null : path || '(kök)';
  if (!v || typeof v !== 'object' || seen.has(v)) return null;
  seen.add(v);
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
    const r = badNumber(x, `${path}.${k}`, seen);
    if (r) return r;
  }
  return null;
}

function inconsistency(s: BattleState): string | null {
  const rows = s.map?.tiles?.length ?? 0;
  const cols = s.map?.tiles?.[0]?.length ?? 0;
  for (const c of Object.values(s.combatants)) {
    if (c.hp < 0) return `${c.id} hp ${c.hp} < 0`;
    if (c.hp > c.maxHp) return `${c.id} hp ${c.hp} > maxHp ${c.maxHp}`;
    if (c.pos && rows && (c.pos.col < 0 || c.pos.row < 0 || c.pos.col >= cols || c.pos.row >= rows)) return `${c.id} harita dışı ${c.pos.col},${c.pos.row}`;
    if (c.life === 'dead' && c.hp > 0 && !c.summon) return `${c.id} ölü ama hp ${c.hp}`;
  }
  if (s.status === 'active' && s.order.length && !s.combatants[s.order[s.turnIndex] ?? '']) return `sıra geçersiz ${s.turnIndex}`;
  return null;
}

interface Fail { kind: string; level: number; map: string; seed: number; group: string; detail: string }
const fails: Fail[] = [];
let battles = 0, commands = 0, setupSkips = 0;
const t0 = Date.now();

for (const level of levels) for (const mt of maps) for (let seed = firstSeed; seed < firstSeed + seeds; seed++) for (const [gname, group] of Object.entries(GROUPS)) {
  const where = { level, map: mt.id, seed, group: gname };
  const fail = (kind: string, detail: string) => { fails.push({ kind, ...where, detail }); };
  const rng = seededRng(level * 100_003 + seed * 101 + gname.charCodeAt(0));
  let state: BattleState;
  const sc = mt.scenario ? SCENARIOS.find((s) => s.id === mt.scenario) : undefined;
  const choice = sc?.map ?? mt.map;
  if (!choice) { fail('kurulum', `senaryo yok: ${mt.scenario}`); continue; }
  try {
    const party = sheetsFor(group, level, seed % 2 === 1).map((sheet, i) => ({ ...combatantFromSheet(sheet, { id: `pc${i + 1}`, ownerId: `p${i + 1}` }), side: 'party' as const }));
    const role = ROLES[seed % ROLES.length];
    const pcs = role ? party.map((c, i) => (i % 2 === 0 ? { ...c, aiRole: role } : c)) : party;
    const diff = DIFFS[seed % 3] ?? 'normal';
    const diffE = DIFFS[(seed + 1) % 3] ?? 'normal';
    const session = createMapBattle([...pcs, ...enemies(level, seed)], {
      ...choice, mirrored: false, houseRules: ALL_HOUSE, ruleToggles: ALL_TOGGLES,
      ...(seed % 4 === 0 ? { multiHex: true } : {}), yz: { zorluk: { party: diff, enemies: diffE } },
    }, rng);
    const placed = Object.values(session.state.combatants).filter((c) => c.pos).length;
    if (placed < Object.keys(session.state.combatants).length) setupSkips++;
    const r = execute(session.state, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
    if (!r.ok) { fail('kurulum', r.error); continue; }
    state = r.state;
    battles++;
    const events: BattleEvent[] = [{ type: 'battle_started', state: session.state } as BattleEvent, ...r.events];
    let guard = 0, lastRound = state.round, sinceRound = 0, broken = false;
    while (state.status === 'active' && state.round <= maxRounds && !broken) {
      const actorId = currentActorId(state);
      let steps = 0;
      for (; steps < 40; steps++) {
        const cmd: Command = chooseCommand(state);
        const x = execute(state, cmd, contextFor(state, (cmd as { actorId?: string }).actorId ?? actorId), rng);
        commands++;
        if (!x.ok) {
          if (cmd.type !== 'end_turn') fail('gecersiz-komut', `${cmd.type} ${(cmd as { actorId?: string }).actorId}: ${x.error}${args.includes('--ayrinti') ? ` | DBG_KOMUT ${JSON.stringify(cmd)}` : ''}`);
          else { fail('gecersiz-komut', `end_turn: ${x.error}`); broken = true; }
          break;
        }
        state = x.state; events.push(...x.events);
        if (cmd.type === 'end_turn' || state.status !== 'active' || currentActorId(state) !== actorId) break;
      }
      if (steps >= 40) fail('dongu', `${actorId} bir turda 40+ komut`);
      if (!broken && state.status === 'active' && currentActorId(state) === actorId) {
        const x = execute(state, { type: 'end_turn', actorId }, contextFor(state, actorId), rng);
        if (!x.ok) { fail('gecersiz-komut', `zorunlu end_turn ${actorId}: ${x.error}`); break; }
        state = x.state; events.push(...x.events);
      }
      if (state.round !== lastRound) { lastRound = state.round; sinceRound = 0; } else if (++sinceRound > 300) { fail('dongu', `tur ${state.round} ilerlemiyor`); break; }
      if (++guard > 3000) { fail('dongu', 'komut sınırı'); break; }
      const bad = badNumber(state);
      if (bad) { fail('nan', bad); break; }
      const inc = inconsistency(state);
      if (inc && args.includes('--ayrinti')) {
        const { applyEvents } = await import('../battle/reduce');
        const who = inc.split(' ')[0] as string;
        let st = (events[0] as { state: BattleState }).state;
        for (let i = 1; i < events.length; i++) {
          const prev = st.combatants[who];
          st = applyEvents(st, [events[i] as BattleEvent]);
          const c = st.combatants[who];
          if (prev && c && (prev.life !== c.life || (prev.life === 'dead' && prev.hp !== c.hp))) console.log('DEĞİŞİM', i, prev.life, prev.hp, '→', c.life, c.hp, JSON.stringify(events[i]).slice(0, 300));
        }
      }
      if (inc) { fail('tutarsiz', `${inc} | son olaylar: ${events.slice(-6).map((e) => JSON.stringify(e).slice(0, 220)).join(' || ')}`); break; }
    }
    const a = JSON.stringify(replay(events));
    const b = JSON.stringify(replay(events));
    const live = JSON.stringify(state);
    if (a !== live) fail('replay', 'baştan oynatma canlı durumdan farklı');
    else if (a !== b) fail('replay', 'iki baştan oynatma farklı');
  } catch (e) {
    fail('istisna', String((e as Error)?.stack ?? e).split('\n').slice(0, 4).join(' | '));
  }
}

const byKind: Record<string, number> = {};
for (const f of fails) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
console.log(JSON.stringify({ seviye: levels, harita: maps.length, tohum: seeds, savas: battles, komut: commands, yerlesmeyen: setupSkips, sure_sn: Math.round((Date.now() - t0) / 1000), hata: byKind }));
for (const f of fails.slice(0, 60)) console.log(`- [${f.kind}] sv${f.level} ${f.map} t${f.seed} ${f.group}: ${f.detail}`);
const out = opt('--json');
if (out) { const fs = (await import(/* @vite-ignore */ NODE_FS)) as FsLike; fs.writeFileSync(out, JSON.stringify({ levels, maps: maps.map((m) => m.id), seeds, battles, commands, fails }, null, 1)); }
