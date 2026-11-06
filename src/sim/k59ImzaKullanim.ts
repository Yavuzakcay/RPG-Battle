/**
 * Kuyruk K59 G3: imza alt sınıf kullanımı (K58 aracının düzeltilmiş sayımı). Alt sınıf başına savaş başına:
 *   eylem: imza karakterinin `use_feature` `imza:` komutları
 *   tepki: imza tepkileri (`reaction_used`, seçenek `imza-…`; Tam Zamanında, Dostunun Yası, Ölümsüz Dize…)
 *   pasif: savaş sırasında imza karakterine bağlı iz bırakan diğer olaylar (saldırı eki "Yıpranmışlığın Gücü", aura
 *          tetiği, imza süren etkisi, `trait_turn` `imza:`…; imza eylemi komutunun kendi olayları sayılmaz)
 * Savaş başındaki pasifler (kaynak) sayılmaz. Alt sınıfın hep hazır büyülerinin yapımı (`alwaysPrepared`) ayrı sütunda ve
 * kullanıcı kararıyla (K59) imza toplamına dahil; hedef (≥ 1 / savaş) bu toplam üzerinden.
 *   npx vite-node src/sim/k59ImzaKullanim.ts -- 5 [--seviye 7] [--alt imza_hizir,imza_geride_kalan]
 */
import { loadTrExtra } from '../i18n';
import { classData, loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
const { SCENARIOS, setupBattle, seeded, setPartyKind, setPartySubclass, setSimHouseRules, roundLimit } = await import('./balance');
const { execute } = await import('../battle/commands');
const { chooseCommand } = await import('../battle/ai');
const { contextFor } = await import('../ui/session');
const { currentActorId } = await import('../battle/common');
const imzaData = (await import('../../data/imza.json')).default as unknown as {
  altSiniflar: Array<{ id: string; features: Array<{ name: { tr: string; en: string } }> }>;
  eylemler: Record<string, { sinif: string; ad?: string }>;
  pasifler: Array<{ sinif: string; etki?: { name?: string; auras?: Array<{ name?: string }> } }>;
};
import type { BattleEvent, Command } from '../battle/types';

declare const process: { argv: string[] };
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const runs = Number(args.find((a, i) => /^\d+$/.test(a) && !(args[i - 1] ?? '').startsWith('--')) ?? 5);
const level = Number(opt('--seviye') ?? 7);
const DEBUG = args.includes('--ayrinti');
const only = opt('--alt')?.split(',');
const scen = (opt('--senaryo') ?? 'col,kale,magara,orman').split(',').map((id) => SCENARIOS.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s);

/** Alt sınıfın iz adları (özellik adları, eylem adları, pasif/aura adları). */
function namesOf(sub: string): string[] {
  const a = imzaData.altSiniflar.find((x) => x.id === sub);
  const n = new Set<string>();
  for (const f of a?.features ?? []) { n.add(f.name.tr); n.add(f.name.en); }
  for (const e of Object.values(imzaData.eylemler)) if (e.sinif === sub && e.ad) n.add(e.ad);
  for (const p of imzaData.pasifler) if (p.sinif === sub) { if (p.etki?.name) n.add(p.etki.name); for (const au of p.etki?.auras ?? []) if (au.name) n.add(au.name); }
  return [...n].filter((x) => x.length > 3);
}

interface Usage { action: number; reaction: number; passive: number; battles: number; cast: number; attack: number; subSpell: number }
function measureUsage(subId: string, cls: string, evKurali: string | null | undefined, lv: number, seeds: number): Usage {
  setPartyKind(`k18-${cls}`);
  setSimHouseRules(evKurali ? { [evKurali]: true } : {});
  setPartySubclass({ classId: cls, subclassId: subId });
  const names = namesOf(subId);
  const u: Usage = { action: 0, reaction: 0, passive: 0, battles: 0, cast: 0, attack: 0, subSpell: 0 };
  // Alt sınıfın hep hazır büyüleri (özellik `alwaysPrepared`, seviyeye kadar).
  const prepared = new Set<string>();
  for (const f of (imzaData.altSiniflar.find((x) => x.id === subId)?.features ?? []) as Array<{ effect?: { alwaysPrepared?: Record<string, string[]> } }>)
    for (const [l, list] of Object.entries(f.effect?.alwaysPrepared ?? {})) if (Number(l) <= lv) for (const n of list) prepared.add(n);
  for (const sc of scen) for (let seed = 1; seed <= seeds; seed++) {
    const rng = seeded(seed);
    let state = setupBattle(sc, rng, lv);
    const who = new Set(Object.values(state.combatants).filter((c) => c.imza === subId).map((c) => c.id));
    u.battles++;
    const max = roundLimit(lv);
    // Komut başına tekil iz: aynı tetiğin olayları (etki ekle/bitir, ışınlanma) bir sayılır; tepkinin kendi izleri sayılmaz.
    const traced = (evs: BattleEvent[]) => {
      const seen = new Set<string>();
      const reacted = new Set<string>();
      for (const e of evs) {
        const j = JSON.stringify(e);
        if (e.type === 'reaction_used' && who.has(e.actorId) && j.includes('"imza-')) { u.reaction++; for (const n of names) if (j.includes(n)) reacted.add(n); continue; }
        if (![...who].some((id) => j.includes(`"${id}"`))) continue;
        const tag = names.find((n) => j.includes(n)) ?? j.match(/imza[:-][^"]*/)?.[0];
        if (tag && !reacted.has(tag)) seen.add(tag);
      }
      u.passive += seen.size;
      if (DEBUG) for (const t of seen) console.log('PASIF', t);
    };
    for (let g = 0; g < 2000 && state.status === 'active' && state.round <= max; g++) {
      const actorId = currentActorId(state);
      for (let step = 0; step < 12; step++) {
        const cmd: Command = chooseCommand(state);
        if (cmd.type === 'end_turn') break;
        const r = execute(state, cmd, contextFor(state, actorId), rng);
        if (!r.ok) break;
        const mine = who.has(actorId);
        const imzaCmd = mine && cmd.type === 'use_feature' && String((cmd as { feature?: string }).feature ?? '').startsWith('imza:');
        if (imzaCmd) u.action++; else traced(r.events);
        if (mine && cmd.type === 'cast_spell') { u.cast++; if (prepared.has(cmd.spellName)) u.subSpell++; }
        if (mine && cmd.type === 'attack') u.attack++;
        state = r.state;
        if (state.status !== 'active' || currentActorId(state) !== actorId) break;
      }
      if (state.status === 'active' && currentActorId(state) === actorId) {
        const r = execute(state, { type: 'end_turn', actorId }, contextFor(state, actorId), rng);
        if (r.ok) { traced(r.events); state = r.state; } else break;
      }
    }
  }
  return u;
}

{
  console.log(`| Alt sınıf | İmza eylemi | İmza tepkisi | Pasif tetik | Alt sınıf büyüsü | Büyü | Saldırı | Eylem / savaş | Eylem+tepki+pasif / savaş | İmza toplamı (+ hazır büyü) / savaş |`);
  console.log(`|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|`);
  for (const sub of classData.subclasses.filter((s) => s.ev && s.id.startsWith('imza_') && (!only || only.includes(s.id)))) {
    const u = measureUsage(sub.id, sub.class, sub.evKurali, level, runs);
    const tot = u.action + u.reaction + u.passive;
    console.log(`| ${sub.name.tr} | ${u.action} | ${u.reaction} | ${u.passive} | ${u.subSpell} | ${u.cast} | ${u.attack} | ${(u.action / u.battles).toFixed(2)} | ${(tot / u.battles).toFixed(2)} | ${((tot + u.subSpell) / u.battles).toFixed(2)} |`);
  }
}
