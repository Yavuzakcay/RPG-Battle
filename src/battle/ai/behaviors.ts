/**
 * Y1 G3: eksik yapay zekâ davranışları, eylem açıklayıcısı olarak (yeni mekanik yok; motor komutları aynı). Değeri
 * değerlendirici kuru çalıştırmayla verir (itme sonrası çarpma/düşme hasarı, tehlikeli altıgen, kaçış maruziyeti).
 * - Zihin Gücü kipleri (Yaşlı Bilge): Çek, Yana kaydır, Taşı (altıgen adayları: düşmanın çevresinde en riskli ve
 *   dostlardan uzak altıgenler), Nesne (taşınabilir nesneler), Fırlat (nesne ya da zemin enkazı).
 * - Hızır: Yetişen Yol: Adım (yaralı/yerdeki dostun yanına).
 * - Çarpmalı itme: bitişik düşmana İt (duvar/nesne/yaratık çarpması, yere düşürme).
 * - Işınlanma kaçışı: Cloud's Jaunt, Blink Steps (özellik) düşmandan en uzak altıgenlere.
 * - Canavar yetenekleri: hazır her yetenek ayrı aday (ışınlanma, çekme dahil; ethereal ve aç/kapa hariç).
 * - Sarf eşyası: yaralıyken iyileştirme iksiri (kendine ya da 5 ft içindeki dosta).
 * Saf.
 */
import { distance, ring, type Offset } from '../../rules/hex';
import { items } from '../../data';
import { IMZA_SPECS } from '../imza';
import { occupantAt, terrainAt } from '../movement';
import { teleportHexes } from '../teleport';
import { abilitiesOf, abilityReady } from '../monsterAbilities';
import type { BattleState, Combatant, Command } from '../types';
import { registerAction, type AiHelpers } from './actions';
import { difficultyOf } from './evaluate';
import { playerThrowObject, throwProblem } from '../objectMotion';

const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const free = (s: BattleState, h: Offset, self?: string) => !occupantAt(s, h, self) && terrainAt(s, h).movement !== 'blocked';
const featureKeys = (a: Combatant, prefix: string) => (a.features ?? []).map((f) => f.key).filter((k) => k.startsWith(prefix));

/** Düşmanın çevresinde (yarıçap r) en riskli, dostlardan uzak boş altıgenler. */
function shoveSpots(s: BattleState, foe: Combatant, r: number, h: AiHelpers, n = 3): Offset[] {
  if (!foe.pos) return [];
  const out: Array<{ to: Offset; v: number }> = [];
  for (let k = 1; k <= r; k++) {
    for (const to of ring(foe.pos, k, sizeOf(s))) {
      if (occupantAt(s, to, foe.id)) continue;
      const ally = h.allies.reduce((m, a) => Math.min(m, a.pos ? distance(a.pos, to) : 99), 99);
      out.push({ to, v: h.risk(foe, to) * 2 + Math.min(ally, 4) });
    }
  }
  return out.sort((a, b) => b.v - a.v).slice(0, n).map((x) => x.to);
}

/** Bilge Zihin Gücü kipleri (bonus eylem; Fırlat eylem). */
export function mindCands(s: BattleState, a: Combatant, h: AiHelpers, bonus: boolean): Command[] {
  const out: Command[] = [];
  for (const key of featureKeys(a, 'imza:imza_bilge/mind-')) {
    const spec = IMZA_SPECS[key];
    if (!spec || (spec.tur === 'bonus') !== bonus) continue;
    const range = Math.floor(Number(spec.menzilFt ?? 30) / 5);
    const foes = h.foes.filter((f) => f.pos && a.pos && distance(a.pos, f.pos) <= range).slice(0, 3);
    const cmd = (extra: Partial<Extract<Command, { type: 'use_feature' }>>): Command => ({ type: 'use_feature', actorId: a.id, feature: key, ...extra });
    if (spec.ozel === 'zihin') {
      for (const f of foes) {
        if (spec.kip === 'free') for (const to of shoveSpots(s, f, Math.floor((spec.mesafe ?? 20) / 5), h)) out.push(cmd({ targetId: f.id, to }));
        else out.push(cmd({ targetId: f.id }));
      }
    } else if (spec.ozel === 'zihinNesne') {
      for (const o of s.map?.objects ?? []) if (o.at && a.pos && distance(a.pos, o.at) <= range && o.hp > 0 && !o.carriedBy) out.push(cmd({ to: o.at }));
    } else if (spec.ozel === 'firlat') {
      // Nesne ya da (yoksa) zemin enkazı: hedefin yanındaki ya da büyücünün yanındaki boş altıgen.
      for (const f of foes) {
        const objs = (s.map?.objects ?? []).filter((o) => o.at && a.pos && distance(a.pos, o.at) <= range && o.hp > 0 && !o.carriedBy).map((o) => o.at as Offset);
        const debris = a.pos ? ring(a.pos, 1, sizeOf(s)).filter((x) => free(s, x, a.id)).slice(0, 1) : [];
        for (const to of [...objs.slice(0, 2), ...debris]) out.push(cmd({ targetId: f.id, to }));
      }
    }
  }
  return out;
}

/** Hızır: Yetişen Yol: Adım (serbest): yaralı ya da yerdeki dosta. */
export function roadStepCands(s: BattleState, a: Combatant, h: AiHelpers): Command[] {
  const key = featureKeys(a, 'imza:imza_hizir/road-step')[0];
  if (!key) return [];
  return h.allies.concat(Object.values(s.combatants).filter((c) => c.side === a.side && c.hp <= 0 && c.life === 'dying'))
    .filter((c) => c.id !== a.id && c.pos && a.pos && distance(c.pos, a.pos) <= 12 && (c.hp <= 0 || c.hp <= c.maxHp * 0.5))
    .sort((x, y) => x.hp - y.hp).slice(0, 2)
    .map((c) => ({ type: 'use_feature', actorId: a.id, feature: key, targetId: c.id }) as Command);
}

/** Işınlanma kaçışı (özellikler): Cloud's Jaunt (bonus), Blink Steps (serbest). Yarı canın altında ve bitişikte düşman varken. */
export function teleportEscapeCands(s: BattleState, a: Combatant, h: AiHelpers): Command[] {
  if (!s.map || !a.pos || a.hp >= a.maxHp / 2) return [];
  if (!h.foes.some((f) => f.pos && distance(f.pos, a.pos as Offset) <= 1)) return [];
  const out: Command[] = [];
  for (const f of a.features ?? []) {
    const eff = f.effect as { kind: string; rangeFt?: number; sight?: boolean };
    if (eff.kind !== 'teleport' && eff.kind !== 'blinkStep') continue;
    if (f.type === 'bonus' && a.economy.bonus) continue;
    const far = (x: Offset) => Math.min(...h.foes.filter((y) => y.pos).map((y) => distance(x, y.pos as Offset)));
    const hexes = teleportHexes(s, a, { rangeFt: eff.rangeFt ?? 30, sight: eff.sight ?? true })
      .map((x) => ({ x, d: far(x), r: h.risk(a, x) })).filter((x) => x.d > 1 && x.r < 50)
      .sort((p, q) => q.d - p.d || p.r - q.r).slice(0, 2);
    for (const { x } of hexes) out.push({ type: 'use_feature', actorId: a.id, feature: f.key, to: x });
  }
  return out;
}

/** Çarpmalı itme ve yere düşürme: bitişik düşmana İt (eylem; Attack eyleminin bir saldırısı yerine değil, ayrı). */
export function shoveCands(s: BattleState, a: Combatant, h: AiHelpers): Command[] {
  if (!s.map || !a.pos || !h.canAct || a.civilian) return [];
  return h.foes.filter((f) => f.pos && distance(f.pos, a.pos as Offset) <= 1).slice(0, 2)
    .flatMap((f) => [{ type: 'shove', actorId: a.id, targetId: f.id, effect: 'push' }, { type: 'shove', actorId: a.id, targetId: f.id, effect: 'prone' }] as Command[]);
}

/** Canavar yetenekleri: hazır her yetenek (ışınlanma, çekme, çağırma, büyü…), hedefli olanlar ilk iki düşmana. */
export function abilityCands(s: BattleState, a: Combatant, h: AiHelpers): Command[] {
  const out: Command[] = [];
  for (const ab of abilitiesOf(s, a)) {
    if (!abilityReady(a, ab) || ab.kind === 'ethereal' || ab.toggle) continue;
    out.push({ type: 'monster_ability', actorId: a.id, abilityId: ab.id });
    if (ab.kind === 'pull' || ab.kind === 'save' || ab.kind === 'swallow') for (const f of h.foes.slice(0, 2)) out.push({ type: 'monster_ability', actorId: a.id, abilityId: ab.id, targetId: f.id });
  }
  return out;
}

/** Sarf eşyası: iyileştirme iksiri (yarı canın altında; kendine ya da 5 ft içindeki dosta). */
export function itemCands(s: BattleState, a: Combatant, h: AiHelpers): Command[] {
  if (a.economy.bonus || !a.consumables) return [];
  const out: Command[] = [];
  for (const [id, n] of Object.entries(a.consumables)) {
    if (!n) continue;
    const it = items.find((x) => x.id === id) as { use?: { kind?: string } } | undefined;
    if (it?.use?.kind !== 'heal') continue;
    for (const c of h.allies.concat(Object.values(s.combatants).filter((x) => x.side === a.side && x.life === 'dying'))) {
      if (!c.pos || !a.pos || distance(c.pos, a.pos) > 1 || c.hp > c.maxHp * 0.5) continue;
      out.push({ type: 'use_item', actorId: a.id, itemId: id, targetId: c.id });
    }
  }
  return out;
}

registerAction({ id: 'g3:zihin', kind: 'control', note: 'Zihin Gücü: Fırlat (eylem)', gen: (s, a, h) => (h.canAct && !a.economy.action ? mindCands(s, a, h, false) : []) });
registerAction({ id: 'g3:itme', kind: 'control', note: 'çarpmalı itme / yere düşürme (İt)', gen: (s, a, h) => shoveCands(s, a, h) });
registerAction({ id: 'g3:yetenek', kind: 'damage', note: 'canavar yetenekleri (ışınlanma, çekme, çağırma…) tek tek', gen: (s, a, h) => (a.monsterId || a.attacks.length ? abilityCands(s, a, h) : []) });

/** Bonus/serbest aday havuzu (imza bonus özellikleri `ai.ts` `imzaAi` ile birlikte puanlanır). */
export function bonusPoolCands(s: BattleState, a: Combatant, h: AiHelpers): Command[] {
  return [
    ...(!a.economy.bonus ? mindCands(s, a, h, true) : []),
    ...roadStepCands(s, a, h),
    ...teleportEscapeCands(s, a, h),
    ...itemCands(s, a, h),
  ];
}


/**
 * Kuyruk A2: Nesne fırlat (A1'in oyuncu komutu `object_use` `throw`; K53 nesne hareketi). Bitişikteki hafif/orta nesne,
 * fırlatma menzilindeki ilk üç düşmana; puanı değerlendiricinin kuru çalıştırması (beklenen hasar) verir, silah saldırısı
 * genelde daha yüksek puan alır (düşük öncelik). Kolay zorlukta üretilmez.
 */
function throwCands(s: BattleState, a: Combatant, h: AiHelpers): Command[] {
  if (!h.canAct || a.economy.action || !a.pos || difficultyOf(s, a.side) === 'kolay') return [];
  const out: Command[] = [];
  for (const o of s.map?.objects ?? []) {
    if (throwProblem(s, a, o)) continue;
    for (const f of h.foes.slice(0, 3)) {
      if (!f.pos) continue;
      const p = playerThrowObject(s, a, o.id, f.pos);
      if ('problem' in p || distance(o.at, f.pos) * 5 > p.range) continue;
      out.push({ type: 'object_use', actorId: a.id, objectId: o.id, action: 'throw', to: f.pos } as Command);
    }
  }
  return out;
}
registerAction({ id: 'a2:firlat', kind: 'damage', note: 'Nesne fırlat (bitişik hafif/orta nesne, menzildeki düşmana; Kolay\'da yok)', gen: (s, a, h) => throwCands(s, a, h) });
