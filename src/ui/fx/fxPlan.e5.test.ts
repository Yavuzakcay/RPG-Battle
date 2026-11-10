/**
 * Kuyruk E5: rozet-efekt-13 sayfası (13 tek kareli efekt → 4–6 karelik prosedürel şerit): kesim kayıtları, karışım kararları,
 * hareket azaltta sabit kare, 13 büyü bağlaması (gerçek motor → beklenen sprite, yer/çapa), Irresistible Dance'in süren etkiye
 * bağlı döngüsü, sayı oku rozetinin yerinde kalması ve yalnız görsel olma (replay aynı).
 */
import { describe, expect, it } from 'vitest';
import e2 from '../../../data/efekt-e2.json';
import kesim from '../../../data/efekt-kesim.json';
import { applyEvents, execute, replay } from '../../battle';
import type { BattleEvent, Command } from '../../battle/types';
import { P1 } from '../../battle/fixtures';
import { spells } from '../../data';
import { seededRng } from '../../rules/dice';
import { B, FX, SPELL_FX, allocate, fxShots, groundFx, stillFrame } from './fxPlan';
import { field, verifyBadge, verifySpell } from './e2Verify';

type Rec = { kare: number; sure: number; tur: string; karisim: string; dongu: boolean; sabit?: number; en: number; boy: number };
const recs = (e2 as unknown as { efektler: Record<string, Rec> }).efektler;
const spell = (id: string) => spells.find((s) => s.id === id)!;

/** Büyü → [sprite, yol, kare sayısı, karışım]. */
const TABLO: Record<string, [string, string, number, 'screen' | 'normal']> = {
  resistance: ['rozet-resistance', 'hedef', 5, 'normal'],
  bane: ['rozet-bane', 'hedef', 5, 'normal'],
  command: ['rozet-command', 'hedef', 5, 'screen'],
  'expeditious-retreat': ['rozet-hizli-gerilis', 'kendi', 5, 'normal'],
  longstrider: ['rozet-uzun-adim', 'hedef', 5, 'normal'],
  jump: ['rozet-ziplama', 'hedef', 5, 'normal'],
  sanctuary: ['rozet-siginak', 'hedef', 5, 'screen'],
  'ray-of-enfeeblement': ['rozet-zayiflatma', 'hedef', 5, 'normal'],
  'spider-climb': ['rozet-orumcek', 'hedef', 5, 'screen'],
  'water-walk': ['rozet-su-uzeri', 'hedef', 5, 'screen'],
  'death-ward': ['rozet-olum-korumasi', 'hedef', 5, 'screen'],
  glibness: ['rozet-akici-dil', 'kendi', 5, 'normal'],
};

describe('Kuyruk E5: içe aktarma ve prosedürel canlandırma', () => {
  it('kesim tablosunda 13 ad, dört satır × dört sütun, hücre başına bir efekt', () => {
    const sh = (kesim as unknown as { sayfalar: Record<string, Record<string, unknown>> }).sayfalar['rozet-efekt-13']!;
    expect(sh).toMatchObject({ hucre: 'efekt', satir: 4, sutun: 4, kesim: 'esit' });
    expect((sh.adlar as string[]).length).toBe(13);
    expect(Object.keys(sh.canlandirma as object).sort()).toEqual([...(sh.adlar as string[])].sort());
  });
  it('13 şerit kayıtlı: 256×256 kare, 4–6 kare, tek seferlik; yalnız dans döngü', () => {
    const names = [...Object.values(TABLO).map((t) => t[0]), 'rozet-dans'];
    expect(names).toHaveLength(13);
    for (const n of names) {
      const r = recs[`efekt-${n}`]!;
      expect(r, n).toBeTruthy();
      expect(r).toMatchObject({ en: 256, boy: 256 });
      expect(r.kare, n).toBeGreaterThanOrEqual(4); expect(r.kare, n).toBeLessThanOrEqual(6);
      expect(r.dongu, n).toBe(n === 'rozet-dans');
      expect(r as { kullanilmiyor?: boolean }, n).not.toHaveProperty('kullanilmiyor');
    }
    expect(recs['efekt-rozet-dans']).toMatchObject({ kare: 6, sure: 780 });
  });
  it('karışım kararı: koyu/gri dolgulu olanlar normal, parlak çizgiler toplamalı', () => {
    for (const [id, [sprite, , , blend]] of Object.entries(TABLO)) expect(recs[`efekt-${sprite}`]!.karisim, id).toBe(blend);
    expect(recs['efekt-rozet-dans']!.karisim).toBe('normal');
  });
  it('hareket azaltta tek sabit kare (ortadaki canlı kare; dansta ilk kare)', () => {
    for (const [, [sprite]] of Object.entries(TABLO)) {
      const f = FX[sprite]!;
      expect(stillFrame(f), sprite).toBeGreaterThanOrEqual(0);
      expect(stillFrame(f), sprite).toBeLessThan(f.frames);
    }
    expect(stillFrame(FX['rozet-dans']!)).toBe(0);
  });
});

describe('Kuyruk E5: büyü bağlama (gerçek motor → beklenen sprite çizimde)', () => {
  for (const [id, [sprite]] of Object.entries(TABLO)) {
    it(`${id} → ${sprite}`, () => {
      const v = verifySpell(spell(id));
      expect(v.ok, JSON.stringify(v)).toBe(true);
      expect(v.expected, JSON.stringify(v)).toContain(sprite);
    });
  }
  it('Irresistible Dance: süren etki varken hedef jetonda döngü (aura halkası), etki bitince yok', () => {
    const v = verifySpell(spell('irresistible-dance'));
    expect(v.ok, JSON.stringify(v)).toBe(true);
    const sp = spell('irresistible-dance');
    const s = field(sp);
    // Yüksek save DC'si: tarlanın düşmanı (B) büyülenmeyebilir; etki kalana dek sırayla dener.
    let found: string | null = null;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: sp.name, slotLevel: 6, targetId: 'B' } as Command, P1, seededRng(seed));
      if (!r.ok) continue;
      const after = applyEvents(s, r.events);
      const a = groundFx(after).auras.find((x) => x.sprite.id === 'rozet-dans');
      if (a) { found = a.ownerId; expect(a.sprite.loop).toBe(true); expect(a.ring).toBeGreaterThan(1); break; }
    }
    expect(found).toBe('B');
    expect(groundFx(s).auras.some((x) => x.sprite.id === 'rozet-dans')).toBe(false);
  });
  it('yer ve çapa: yapanın ya da hedefin tabanı (ayak), dairesel olanlar tabanda ortalı; örümcek temas noktası jetonda', () => {
    const at = (id: string) => (SPELL_FX[id] as { ankraj?: number; yol: string; olcek?: number });
    expect(at('expeditious-retreat')).toMatchObject({ yol: 'kendi' });
    expect(at('glibness')).toMatchObject({ yol: 'kendi' });
    for (const id of ['expeditious-retreat', 'longstrider', 'jump', 'sanctuary', 'water-walk', 'death-ward']) expect(at(id).ankraj, id).toBeGreaterThanOrEqual(0.5);
    for (const id of ['sanctuary', 'water-walk', 'death-ward']) expect(at(id).ankraj, id).toBe(0.5);
    // Örümcek: kare kesimde temas noktası tuval merkezine alınır (merkez [0, 0.5]); bağlamada çapa yok (jeton merkezi).
    expect(at('spider-climb').ankraj).toBeUndefined();
    const c = ((kesim as unknown as { sayfalar: Record<string, { canlandirma: Record<string, { merkez?: number[] }> }> }).sayfalar['rozet-efekt-13']!.canlandirma);
    expect(c['rozet-orumcek']!.merkez).toEqual([0, 0.5]);
  });
  it('hedef başına bir efekt: Bane üç hedefte üç kez, tekrarlanan olaylar yinelemez', () => {
    const sp = spell('bane');
    const s = field(sp);
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: sp.name, slotLevel: 1, targetIds: ['B', 'D', 'N'] } as Command, P1, seededRng(4));
    if (!r.ok) throw new Error(r.error);
    const shots = fxShots(r.events, s).filter((x) => x.sprite.id === 'rozet-bane');
    const t = shots.map((x) => x.targetId);
    expect(new Set(t).size).toBe(t.length);
    expect(t.length).toBeGreaterThanOrEqual(1);
    expect(t.length).toBeLessThanOrEqual(3);
  });
  it('sayı oku rozeti yerinde (rozetBuyu değişmedi) ve çalışır; efekt kapalı ya da hareket azaltta animasyon bütçesi 0', () => {
    for (const id of ['resistance', 'bane', 'command', 'expeditious-retreat', 'jump', 'longstrider', 'sanctuary', 'ray-of-enfeeblement', 'spider-climb', 'water-walk', 'death-ward', 'irresistible-dance', 'glibness']) {
      expect((B as unknown as { rozetBuyu: Record<string, string> }).rozetBuyu[id], id).toBeTruthy();
      expect(verifyBadge(spell(id)).ok, id).toBe(true);
    }
    const items = Array.from({ length: 20 }, (_, i) => ({ key: `k${i}`, tokenId: `t${i % 3}` }));
    expect(allocate(items, { enabled: false, reduceMotion: false, used: 0 }).size).toBe(0);
    expect(allocate(items, { enabled: true, reduceMotion: true, used: 0 }).size).toBe(0);
    expect(allocate(items, { enabled: true, reduceMotion: false, used: 0 }).size).toBeLessThanOrEqual(12);
  });
});

describe('Kuyruk E5: yalnız görsel (kural, durum, replay aynı)', () => {
  it('13 büyü: efekt hesabı durumu değiştirmez; replay aynı sonucu verir', () => {
    for (const id of [...Object.keys(TABLO), 'irresistible-dance']) {
      const sp = spell(id);
      const s = field(sp);
      const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: sp.name, slotLevel: Math.max(1, sp.level), targetId: sp.mechanics.effect?.side === 'enemy' || id === 'bane' || id === 'command' || id === 'ray-of-enfeeblement' ? 'B' : 'C' } as Command, P1, seededRng(5));
      if (!r.ok) continue;
      const before = JSON.stringify(s);
      const after = applyEvents(s, r.events);
      const frozen = JSON.stringify(after);
      fxShots(r.events, s);
      groundFx(after);
      expect(JSON.stringify(s), id).toBe(before);
      expect(JSON.stringify(after), id).toBe(frozen);
      const base: BattleEvent[] = [{ type: 'battle_started', state: s } as BattleEvent, ...r.events];
      expect(JSON.stringify(replay(base).combatants), id).toBe(JSON.stringify(r.state.combatants));
    }
  });
});
