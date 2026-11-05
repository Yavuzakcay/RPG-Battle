/**
 * Y1 G2: eylem değerlendiricisi. Adayları (`actions.ts`) kuru çalıştırmayla (`preview.ts`) puanlar:
 * beklenen hasar (hedefin canıyla sınırlı), öldürme ve etkisiz bırakma, kontrol değeri (durum × hedefin tehdidi),
 * iyileştirme/koruma (eksik canla sınırlı, yerdeki dostu kaldırma), dost ateşi ve kendine hasar cezası, tehlikeli
 * altıgen (kendi konumu; itilen düşmanda değer), kaynak maliyeti (slot seviyesi, özellik kaynağı), düşman
 * konsantrasyonunu kırma, kendini koruma (düşük canda maruziyet). Ağırlıklar rolden (`data/yz-roller.json`).
 * Zorluk: Kolay en iyiyi ~%60 seçer (deterministik karma), Usta ilk adaylarda bir adım ileri bakar. Saf.
 */
import { distance, type Offset } from '../../rules/hex';
import data from '../../../data/yz-roller.json';
import type { BattleState, Combatant, Command } from '../types';
import { aiStats, previewCommand, type CommandPreview } from './preview';
import type { AiHelpers, Candidate } from './actions';

export type AiRole = 'hasarci' | 'kontrolcu' | 'destek' | 'tank';
export type AiDifficulty = 'kolay' | 'normal' | 'usta';
export const AI_ROLES: AiRole[] = ['hasarci', 'kontrolcu', 'destek', 'tank'];

type Weights = (typeof data.roller)['hasarci'];
const C = data.sabitler;
const COND = data.durumDegeri as unknown as Record<string, number>;
const FLAG = data.bayrakDegeri as unknown as Record<string, number>;
const RULE = data.kuralOnceligi as unknown as Record<string, number>;
const PRIO = data.hedefOnceligi as unknown as Record<string, number>;

/** Yaratığın rolü: Game Master atadıysa o, yoksa veriden türetilir. */
export function roleOf(actor: Combatant, spellKinds?: { heal: number; control: number }): AiRole {
  if (actor.aiRole) return actor.aiRole;
  const k = spellKinds ?? { heal: 0, control: 0 };
  const heals = k.heal + (actor.features ?? []).filter((f) => /heal|iyiles/i.test(f.effect.kind)).length;
  if (actor.side === 'party' && heals >= data.rolTuretme.destekEsigi) return 'destek';
  if (k.control >= data.rolTuretme.kontrolEsigi) return 'kontrolcu';
  const melee = !actor.weaponOptions.some((o) => o.ranged) && !(actor.attacks ?? []).some((a) => a.ranged);
  if (actor.ac >= data.rolTuretme.tankAc && melee) return 'tank';
  return 'hasarci';
}

/**
 * Y2 G3: zorluk etiketi (K58 arayüzü okuyacak): Usta "deneysel" ve dürüst açıklama (`data/yz-roller.json`).
 */
export function difficultyNote(d: AiDifficulty, lang: 'tr' | 'en' = 'tr'): { experimental: boolean; text: string } | null {
  if (d !== 'usta') return null;
  const u = data.zorluk.usta;
  return { experimental: !!u.deneysel, text: u.aciklama[lang] };
}

export function difficultyOf(state: BattleState, side: Combatant['side']): AiDifficulty {
  return state.yz?.zorluk?.[side] ?? 'normal';
}

const pool = (c: Combatant): number => Math.max(0, c.hp) + (c.tempHp ?? 0);
const condValue = (name: string): number => COND[name] ?? COND._varsayilan ?? 0.25;

export interface Scored extends Candidate {
  score: number;
  parts: Record<string, number>;
  preview: CommandPreview;
}

/** Düşmanların bu altıgendeki yaratığa erişimdeki toplam tehdidi (yakın dövüş bitişik, menzilli hepsi yarı). */
function exposure(state: BattleState, actor: Combatant, h: Offset, helpers: AiHelpers): number {
  let t = 0;
  for (const f of helpers.foes) {
    if (!f.pos) continue;
    const d = distance(f.pos, h);
    const ranged = f.weaponOptions.some((o) => o.ranged) || (f.attacks ?? []).some((a) => a.ranged);
    if (d <= 1) t += helpers.threat(f);
    else if (ranged) t += helpers.threat(f) * 0.3;
    else if (d <= 1 + Math.ceil(f.speed / 5)) t += helpers.threat(f) * 0.4;
  }
  void state;
  return t;
}

/** Tek komutun puanı ve bileşenleri. */
export function scoreCommand(state: BattleState, actor: Combatant, cmd: Command, helpers: AiHelpers, role: AiRole, p?: CommandPreview, diff: AiDifficulty = 'normal'): { score: number; parts: Record<string, number>; preview: CommandPreview } {
  const preview = p ?? previewCommand(state, cmd, undefined, { range: false });
  const parts: Record<string, number> = {};
  const add = (k: string, v: number) => { if (v) parts[k] = (parts[k] ?? 0) + v; };
  if (!preview.ok) return { score: -Infinity, parts, preview };
  const w: Weights = data.roller[role];
  const low = actor.hp <= actor.maxHp * C.kotuCan;
  // Y2 G3: Usta'nın ek terimleri (öldürmeyi garantile, odaklı ateş, tehdit sırası, slotu güçlü hedefe sakla).
  const U = diff === 'usta' ? data.zorluk.usta : null;
  const maxThreat = U ? helpers.foes.reduce((m, f) => Math.max(m, helpers.threat(f)), 1) : 1;
  let mainThreat = 0;
  for (const t of preview.targets) {
    const c = state.combatants[t.id];
    if (!c) continue;
    const isAlly = c.side === actor.side || (actor.side === 'party' && !!c.civilian);
    const neutral = !isAlly && !!c.civilian;
    const threat = helpers.threat(c);
    const dmg = Math.min(t.damage.avg, pool(c));
    if (neutral) continue;
    if (!isAlly) {
      add('hasar', w.hasar * dmg);
      add('oldurme', w.oldurme * t.killP * (threat * 2 + C.oldurmeTaban));
      if (U && dmg > 0) {
        mainThreat = Math.max(mainThreat, threat);
        // Kalan can beklenen hasarın altındaysa (ölüm olasılığı yüksek) o hedefe odak.
        add('kesin', w.oldurme * Math.max(0, t.killP - U.kesinEsik) * (threat * 2 + C.oldurmeTaban) * U.kesin);
        // Yaralı hedefe yığılma (aynı turda dostların vurduğu): eksik can oranı × hasar.
        add('odak', w.hasar * dmg * (1 - Math.max(0, c.hp) / Math.max(1, c.maxHp)) * U.odak);
        // Tehdit sırası: en tehlikeli düşmana vurmak (en tehlikeliye göre oran, ortanın üstü artı).
        add('tehdit', w.hasar * dmg * (threat / maxThreat - 0.5) * U.tehdit);
      }
      let ctl = 0;
      for (const [k, pk] of Object.entries(t.conditions)) if (!c.conditions.includes(k)) ctl += pk * condValue(k) * threat;
      add('kontrol', w.kontrol * ctl);
      const eff = Object.values(t.effects).reduce((s, x) => s + x, 0);
      add('zayiflatma', w.kontrol * eff * C.etkiDegeri * threat);
      let dis = 0;
      for (const [k, pk] of Object.entries(t.flags)) if (k !== 'regenBlocked') dis += pk * (FLAG[k] ?? 0) * threat;
      add('etkisiz', w.kontrol * dis);
      // Yerdeki yenilenen düşmanın yenilenmesini kesmek onu öldürür (Kuyruk 41b).
      if (t.flags.regenBlocked) add('oldurme', w.oldurme * t.flags.regenBlocked * (threat * 2 + C.oldurmeTaban));
      if (c.concentration && t.damage.avg > 0) add('konsantrasyon', w.kontrol * C.konsantrasyonKirma * threat * (t.hitP ?? 1));
      // İtilen/ışınlanan düşmanın vardığı altıgenin riski (bataklık, lav kıyısı, alev): bir durum-turu ölçeğinde.
      const dest = t.movedTo ?? t.teleportedTo;
      if (dest) add('itme', w.kontrol * Math.min(3, helpers.risk(c, dest) / C.itmeRiski) * Math.max(threat, 3));
    } else {
      const self = t.self;
      const missing = Math.max(0, c.maxHp - Math.max(0, c.hp));
      const heal = Math.min(t.healing.avg, missing);
      // Canı azaldıkça her can puanı daha değerli (düşmesini önler): tam canda 1×, 0 canda 2×.
      const urgency = 1 + Math.max(0, 1 - Math.max(0, c.hp) / Math.max(1, c.maxHp));
      add('iyilestirme', w.iyilestirme * heal * urgency * (self && low ? 1.5 : 1));
      if (c.hp <= 0 && t.healing.avg > 0) add('canlandirma', w.iyilestirme * C.canlandirma * Math.max(threat, 3));
      const eff = Object.values(t.effects).reduce((s, x) => s + x, 0);
      add('guclendirme', w.guclendirme * eff * C.etkiDegeri * Math.max(threat, 2));
      // Korunan dost (Resilient Sphere: yalıtılmış, yaralı): çevresindeki düşman tehdidi kadar.
      if (t.flags.sealed && c.pos) add('koruma', w.guclendirme * t.flags.sealed * exposure(state, c, c.pos, helpers) * 0.5);
      let bad = 0;
      for (const [k, pk] of Object.entries(t.conditions)) if (!c.conditions.includes(k)) bad += pk * condValue(k) * Math.max(threat, 2);
      add('dostDurum', -w.dostAtesi * bad);
      if (self) add('kendi', -w.kendi * t.damage.avg * (low ? 2 : 1));
      else {
        add('dostAtesi', -w.dostAtesi * t.damage.avg);
        add('dostOlum', -w.dostAtesi * t.killP * (threat * 2 + C.oldurmeTaban));
      }
    }
  }
  // Kaynak maliyeti.
  const slotCost = preview.spent.slots.reduce((s, l) => s + l * C.slotSeviye, 0);
  const resCost = Object.values(preview.spent.resources).reduce((s, n) => s + n * C.kaynak, 0);
  add('kaynak', -w.kaynak * (slotCost + resCost));
  // Usta: slot/kaynak düşük tehditli hedefe harcanmaz (güçlü hedefi bekle).
  if (U && slotCost + resCost > 0 && mainThreat > 0) add('zamanlama', -w.kaynak * (slotCost + resCost) * U.zamanlama * Math.max(0, 1 - mainThreat / maxThreat));
  // Konum: kendi altıgeninin riski ve maruziyet (yalnız konum değişince).
  const to = preview.actorPos;
  if (actor.pos && to && (to.col !== actor.pos.col || to.row !== actor.pos.row)) {
    add('arazi', -w.arazi * (helpers.risk(actor, to) - helpers.risk(actor, actor.pos)) / C.riskOlcegi);
    const ex = exposure(state, actor, actor.pos, helpers) - exposure(state, actor, to, helpers);
    // Düşük canda bir turluk bitişik saldırılardan kaçmak yaklaşık o saldırıların değeri kadar. Y2: ağırlık can
    // oranına bağlı (korunmaEsik üstünde 0, 0 canda korunmaTavan): sağlıklı yakın dövüşçünün yaklaşması cezalanmaz
    // (Mağara/Kale: Trol hücumu ve yaklaşma eksi puanla seçilmiyor, savaş uzuyordu).
    const ratio = Math.max(0, actor.hp) / Math.max(1, actor.maxHp);
    add('korunma', w.kendi * ex * C.korunmaTavan * Math.max(0, (C.korunmaEsik - ratio) / C.korunmaEsik));
  }
  // Hedef öncelik sırası (yakalanan, Vex, hükümlü, koşucu, uzaklık): tek hedefli komutun hedefi önde ise küçük değer.
  const tid = (cmd as { targetId?: string }).targetId;
  const rank = tid ? helpers.foes.findIndex((f) => f.id === tid) : -1;
  if (rank >= 0) add('sira', C.sira * Math.max(0, 1 - rank / 4));
  const tgt = tid ? state.combatants[tid] : undefined;
  if (tgt && tgt.side !== actor.side) for (const k of helpers.priorityKeys(tgt)) add('oncelik', PRIO[k] ?? 0);
  const score = Object.values(parts).reduce((s, v) => s + v, 0);
  return { score, parts, preview };
}

/** Bütün adayları puanlar (yüksekten düşüğe; geçersizler düşer). */
export function evaluateCandidates(state: BattleState, actor: Combatant, cands: Candidate[], helpers: AiHelpers, role: AiRole, legacy?: Command | null, diff: AiDifficulty = 'normal'): Scored[] {
  const legacyKey = legacy ? JSON.stringify(legacy) : '';
  const out: Scored[] = [];
  aiStats.candidates += cands.length;
  for (const c of cands) {
    const r = scoreCommand(state, actor, c.cmd, helpers, role, undefined, diff);
    if (!Number.isFinite(r.score)) continue;
    let score = r.score;
    if (legacyKey && JSON.stringify(c.cmd) === legacyKey) { score += C.eskiOncelik; r.parts.eski = C.eskiOncelik; }
    if (c.desc.rule) {
      const v = RULE[c.desc.id] ?? C.kuralOncelik;
      // Kural üreticisi koşulu kendisi denetledi: kaynak maliyetinin yarısı geri (kural "değer" dedi).
      const back = -(r.parts.kaynak ?? 0) / 2;
      score += v + back; r.parts.kural = v + back;
    }
    out.push({ ...c, score, parts: r.parts, preview: r.preview });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Deterministik karma (0–1): aynı durumda aynı seçim (simülasyon ve replay tekrarlanabilir). */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Zorluğa göre seçim. Kolay: `enIyi` olasılıkla en iyi, yoksa ilk `aday` içinden biri. Usta: ilk `ileriBakis` aday
 * için `follow(cmd)` (komut uygulandıktan sonra aynı yaratığın en iyi sonraki komutunun puanı) × `ileriAgirlik`.
 */
export function pickByDifficulty(state: BattleState, actor: Combatant, scored: Scored[], difficulty: AiDifficulty, follow?: (cmd: Command) => number): Scored | null {
  if (!scored.length) return null;
  if (difficulty === 'kolay') {
    const k = `${state.round}|${state.turnIndex}|${actor.id}|${actor.hp}|${actor.movementUsed}|${actor.economy.action ? 1 : 0}|${actor.economy.attacksLeft}`;
    const r = hash01(k);
    if (r < data.zorluk.kolay.enIyi || scored.length === 1) return scored[0] as Scored;
    const pool2 = scored.slice(1, Math.max(2, data.zorluk.kolay.aday));
    return pool2[Math.floor(hash01(`${k}#`) * pool2.length)] ?? (scored[0] as Scored);
  }
  if (difficulty === 'usta' && follow) {
    const top = scored.slice(0, data.zorluk.usta.ileriBakis);
    let best: { s: Scored; v: number } | null = null;
    for (const s of top) {
      const v = s.score + data.zorluk.usta.ileriAgirlik * Math.max(0, follow(s.cmd));
      if (!best || v > best.v) best = { s, v };
    }
    return best?.s ?? (scored[0] as Scored);
  }
  return scored[0] as Scored;
}
