/**
 * Kuyruk K59 Görev 1: ek paket ilkellerinin savaşta duman kapsamı. `icerik/` bulut ortamında yok; kurgusal fikstürler
 * (`tests/fixtures/paket-*.json`) sırayla yüklenir, her alt sınıf 20. seviyede (bütün özellikleri açık) k18 partisinin
 * üç üyesiyle yapay zekâyla oynanır (Ortamlar Diyarı, bütün ev kuralları açık). İlkel başına iz:
 *   tetiklendi: savaş sırasında bir olayda ilkelin izi (`pk:<özellik>#<i>`, düğme `pk:<özellik>:<tetik>`, kaynak `pk-…`)
 *   başta: yalnız savaş başı durumunda (pasif etki, kaynak, yetkinlik)
 *   iz yok: alt sınıf savaştı (çökme yok) ama ilkel iz bırakmadı
 *   npx vite-node src/sim/k59PaketKapsam.ts -- 3 [--seviye 20] [--tur 8] [--md çıktı.md]
 */
import { loadTrExtra } from '../i18n';
import { classData, getMonster, loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
const { SCENARIOS, partyAt, enemiesAt, playBattle } = await import('./balance');
const { execute } = await import('../battle/commands');
const { combatantFromMonster, combatantFromSheet } = await import('../battle/create');
const { createMapBattle } = await import('../app/setup');
const { seededRng } = await import('../rules/dice');
const { validatePack } = await import('../content/schema');
const { applyPackSubclasses } = await import('../content/paket');
const { ILKEL_ADLARI } = await import('../content/ilkelSema');
const houseData = (await import('../../data/ev-kurallari.json')).default;
import type { BattleEvent, Combatant, Command } from '../battle/types';

declare const process: { argv: string[] };
const NODE_FS: string = 'node:fs';
const fs = (await import(/* @vite-ignore */ NODE_FS)) as { writeFileSync(path: string, data: string): void };
const FIXTURES = import.meta.glob('../../tests/fixtures/paket-*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const seeds = Number(args.find((a, i) => /^\d+$/.test(a) && !(args[i - 1] ?? '').startsWith('--')) ?? 3);
const level = Number(opt('--seviye') ?? 20);
const rounds = Number(opt('--tur') ?? 8);
/** `--zorla`: kahramanın paket düğmeleri her turunda bir kez komutla denenir (yapay zekâ seçmese de). */
const forced = args.includes('--zorla');
const forcedOk = new Set<string>();
const forcedErr = new Map<string, string>();
const { paketFeatures } = await import('../battle/paket/core');
const { distance } = await import('../rules/hex');
const ALL_HOUSE = Object.fromEntries(Object.keys(houseData.rules).map((k) => [k, true]));
const MATES = ['k18-fighter', 'k18-cleric', 'k18-wizard', 'k18-rogue'];

type Mark = 'tetiklendi' | 'basta' | 'iz yok';
const rank: Record<Mark, number> = { tetiklendi: 2, basta: 1, 'iz yok': 0 };
const byPrim = new Map<string, { mark: Mark; where: string }>();
let crashes = 0, battles = 0;
const crashList: string[] = [];

for (const [path, pack] of Object.entries(FIXTURES).sort(([a], [b]) => a.localeCompare(b))) {
  const file = path.split('/').pop() as string;
  const v = validatePack(pack, { taken: classData.subclasses.map((s) => s.id), packs: [] });
  if (!v.ok) { console.log(`${file}: doğrulanamadı`); continue; }
  applyPackSubclasses(v.pack.subclasses);
  for (const sub of v.pack.subclasses as Array<{ id: string; class: string; features: Array<{ id: string; ilkeller?: Array<{ tur: string }> }> }>) {
    const prims = sub.features.flatMap((f) => (f.ilkeller ?? []).map((p, i) => ({ key: `${sub.id}/${f.id}`, i, tur: p.tur })));
    const best = new Map<string, Mark>();
    for (let seed = 1; seed <= seeds; seed++) {
      try {
        const rng = seededRng(seed * 7919 + sub.id.length);
        const hero = { ...(partyAt(level, `k18-${sub.class}`)[0] as NonNullable<ReturnType<typeof partyAt>[0]>), subclassId: sub.id };
        const mates = MATES.filter((k) => k !== `k18-${sub.class}`).slice(0, 3).map((k) => partyAt(level, k)[0] as typeof hero);
        const pcs = [hero, ...mates].map((sh, i) => ({ ...combatantFromSheet(sh, { id: `pc${i + 1}`, ownerId: `p${i + 1}` }), side: 'party' as const }));
        const sc = SCENARIOS.find((s) => s.id === ['col', 'kale', 'magara', 'orman'][seed % 4]);
        const foes: Combatant[] = [];
        for (const [id, n] of Object.entries(sc ? enemiesAt(sc, Math.min(20, level)) : {})) for (let i = 1; i <= n && foes.length < 6; i++) foes.push(combatantFromMonster(getMonster(id), { id: `${id}-${i}`, name: id }));
        const session = createMapBattle([...pcs, ...foes], { mapId: 'ortamlar-diyari', variantId: 'gunduz', mirrored: false, houseRules: ALL_HOUSE }, rng);
        const r = execute(session.state, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
        if (!r.ok) throw new Error(r.error);
        const startJson = JSON.stringify(r.state);
        // playBattle olayları vermez: bitiş durumundaki izler + başlangıç farkı. Olay izi için kendi döngümüz.
        const events: BattleEvent[] = [];
        const { chooseCommand } = await import('../battle/ai');
        const { currentActorId } = await import('../battle/common');
        const { contextFor } = await import('../ui/session');
        let state = r.state;
        void playBattle;
        for (let g = 0; g < 2000 && state.status === 'active' && state.round <= rounds; g++) {
          const actor = currentActorId(state);
          // Zorlanan düğmeler: kahramanın turunda her paket düğmesi bir kez denenir (hedef: en yakın düşman / dost; altıgen: yakın boş).
          if (actor === 'pc1' && forced) {
            const me = state.combatants.pc1 as Combatant;
            const all = paketFeatures(me);
            for (const f of [...all.slice(state.round % Math.max(1, all.length)), ...all.slice(0, state.round % Math.max(1, all.length))]) {
              const eff = f.effect as { target?: string; hex?: string };
              const foesNow = Object.values(state.combatants).filter((c) => c.side !== me.side && c.hp > 0 && c.pos && me.pos).sort((a, b) => distance(a.pos!, me.pos!) - distance(b.pos!, me.pos!));
              const ally = Object.values(state.combatants).find((c) => c.side === me.side && c.id !== me.id && c.hp > 0);
              const targetId = eff.target === 'enemy' || eff.target === 'any' ? foesNow[0]?.id : eff.target === 'ally' ? ally?.id : undefined;
              const rows = state.map?.tiles.length ?? 0, cols = state.map?.tiles[0]?.length ?? 0;
              const hexes = eff.hex && me.pos ? Array.from({ length: rows * cols }, (_, k) => ({ col: k % cols, row: Math.floor(k / cols) }))
                .filter((h) => distance(h, me.pos!) >= 1).sort((a, b) => distance(a, me.pos!) - distance(b, me.pos!)).slice(0, 10) : [undefined];
              for (const to of hexes) {
                const cmd = { type: 'use_feature', actorId: 'pc1', feature: f.key, ...(targetId ? { targetId } : {}), ...(to ? { to } : {}) } as Command;
                const x = execute(state, cmd, contextFor(state, 'pc1'), rng);
                if (!x.ok && !forcedErr.has(f.key)) forcedErr.set(f.key, x.error);
                if (x.ok) { state = x.state; events.push(...x.events, { type: '__cmd', cmd } as unknown as BattleEvent); forcedOk.add(f.key); break; }
              }
              if (state.status !== 'active' || currentActorId(state) !== 'pc1') break;
            }
          }
          if (state.status !== 'active' || currentActorId(state) !== actor) continue;
          for (let step = 0; step < 15; step++) {
            const cmd = chooseCommand(state);
            const x = execute(state, cmd, contextFor(state, (cmd as { actorId?: string }).actorId ?? actor), rng);
            if (!x.ok) break;
            state = x.state; events.push(...x.events, { type: '__cmd', cmd } as unknown as BattleEvent);
            if (cmd.type === 'end_turn' || state.status !== 'active' || currentActorId(state) !== actor) break;
          }
          if (state.status === 'active' && currentActorId(state) === actor) {
            const x = execute(state, { type: 'end_turn', actorId: actor }, contextFor(state, actor), rng);
            if (!x.ok) break;
            state = x.state; events.push(...x.events);
          }
        }
        battles++;
        const evJson = JSON.stringify(events);
        const resId = (k: string) => `pk-${k.split('/')[0]}-`;
        for (const p of prims) {
          const tag = `${p.key}#${p.i}`;
          const hit = evJson.includes(`pk:${tag}`) || evJson.includes(`pk:${p.key}:`) || evJson.includes(`"${p.key}"`)
            || (p.tur === 'kaynak' && evJson.includes(resId(p.key)));
          const mark: Mark = hit ? 'tetiklendi' : startJson.includes(`pk:${tag}`) || (p.tur === 'kaynak' && startJson.includes(resId(p.key))) || p.tur === 'yetkinlik' ? 'basta' : 'iz yok';
          const k = `${p.key}#${p.i}`;
          if (!best.has(k) || rank[mark] > rank[best.get(k) as Mark]) best.set(k, mark);
        }
      } catch (e) {
        crashes++; crashList.push(`${file} ${sub.id} t${seed}: ${String((e as Error).message).slice(0, 160)}`);
      }
    }
    for (const p of prims) {
      const m = best.get(`${p.key}#${p.i}`) ?? 'iz yok';
      const cur = byPrim.get(p.tur);
      if (!cur || rank[m] > rank[cur.mark]) byPrim.set(p.tur, { mark: m, where: `${file.replace('.json', '')} ${p.key}` });
    }
  }
  applyPackSubclasses([]);
}

const lines = ['| İlkel | Durum | Örnek özellik |', '|---|---|---|'];
for (const t of ILKEL_ADLARI) { const x = byPrim.get(t); lines.push(`| ${t} | ${x ? x.mark : 'fikstürde yok'} | ${x?.where ?? ''} |`); }
const summary = { zorla: forced, zorlananDugme: forcedOk.size, savas: battles, cokme: crashes, ilkel: ILKEL_ADLARI.length,
  tetiklendi: [...byPrim.values()].filter((x) => x.mark === 'tetiklendi').length, basta: [...byPrim.values()].filter((x) => x.mark === 'basta').length,
  izYok: ILKEL_ADLARI.filter((t) => byPrim.get(t)?.mark === 'iz yok'), fiksturdeYok: ILKEL_ADLARI.filter((t) => !byPrim.has(t)) };
console.log(JSON.stringify(summary)); if (forced) for (const [k, e] of forcedErr) if (!forcedOk.has(k)) console.log(`DÜĞME ${k}: ${e}`);
console.log(lines.join('\n'));
for (const c of crashList.slice(0, 30)) console.log(`ÇÖKME ${c}`);
const md = opt('--md');
if (md) fs.writeFileSync(md, `${JSON.stringify(summary)}\n\n${lines.join('\n')}\n${crashList.map((c) => `- ÇÖKME ${c}`).join('\n')}\n`);
