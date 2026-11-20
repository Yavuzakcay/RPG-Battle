/**
 * Mekanik matris: Control Water girdabı (kural sürümü 84, Game Master anahtarı `controlWaterWhirlpool`; kullanıcı kararı
 * 2026-11-19, `src/battle/girdap.ts`). Beklenen: SRD 5.2.1 Whirlpool (STR save, 2d8 Bludgeoning, başarıda yarı) + kullanıcı
 * kararı (ev kuralı): slot başına +1d8 ve +1 altıgen yarıçap (en çok 5), ilk save hedefin tur başında, başarısızlıkta
 * yakalanma (hız 0, kurtulma Athletics), bandın içindeki yaratık 10 ft çekilir. Bağlamlar: slot 4–9 × save başarılı/başarısız,
 * çekme ve kaçış. Sürüm 84 altında (`--kural-surumu`) eski yol: girdap satırı yok, tek satır.
 */
import type { Spell } from '../../data/types';
import type { Command } from '../../battle/types';
import type { SrdSpell } from './srd';
import cfg from '../../../data/girdap.json';
import { A_ROW, AX, hex } from './kurulum';
import { SAVE_FAIL, SAVE_OK, dieValue } from './zar';
import { alan, type Satir } from './ortak';
import { runCtx, type Geo } from './buyu';
import { CURRENT_RULES } from '../../battle/ruleVersion';
import { GIRDAP_VERSION } from '../../battle/girdapSurum';
import { distance } from '../../rules/hex';

const geo = (d: number): Geo => ({ kind: 'single', t: hex(A_ROW + d), u: null, ff: null, z: null, aim: null, coverT: null, bandRows: null, radius: 0 });
const MECH = 'girdap (alan, sürüm 84)';
const END_A: Command = { type: 'end_turn', actorId: 'A' } as Command;
const NOT = 'Kullanıcı kararı (ev kuralı): yarıçap/zar slotla, tur başı save, yakalanma; SRD tabanı 2d8 Bludgeoning STR, başarıda yarı.';

export function girdapRows(sp: Spell, s: SrdSpell): Satir[] {
  if (CURRENT_RULES < GIRDAP_VERSION) {
    return [{ tur: 'büyü', ad: sp.name, seviye: String(sp.level), siniflar: s.raw.classes.join(', '), mekanik: 'eski yol (sürüm < 84)', baglam: 'savaşta yapım',
      kategori: 'yapım', beklenen: 'sürüm 84 altında eski yol', gercek: 'eski yol', sonuc: 'doğru', not: '' }];
  }
  const rows: Satir[] = [];
  const g0 = geo(6);
  for (const level of [4, 5, 6, 7, 8, 9]) {
    const up = level - cfg.tabanSlot;
    const radius = Math.min(cfg.azamiYaricap, cfg.tabanYaricap + up);
    const full = (2 + up) * dieValue(8);
    for (const ok of [false, true]) {
      rows.push(runCtx(sp, s, g0, {
        ad: `slot ${level}, STR save ${ok ? 'başarılı' : 'başarısız'} (hedefin tur başı)`, kategori: ok ? 'save' : 'yukarı slot', noB: true,
        cmd: { targetId: 'T', slotLevel: level }, post: [END_A], p: { saveDefault: ok ? SAVE_OK : SAVE_FAIL },
        bek: (g) => {
          const z = (g.after?.map?.zones ?? []).find((x) => x.spec?.whirl);
          const sv = g.saveler.find((x) => x.hedef === 'T');
          const held = (g.after?.combatants.T?.effects ?? []).some((e) => e.id.startsWith('girdap:') && e.speedZero && !!e.escapeCheck);
          return [
            alan('yarıçap', radius, z?.radius ?? null), alan('save', 'str', sv?.yetenek ?? null), alan('başarı', ok, sv?.basari ?? null),
            alan('hasar', ok ? Math.floor(full / 2) : full, sv?.uygulanan ?? null), alan('tür', 'bludgeoning', sv?.tur ?? null),
            alan('yakalandı', !ok, held), alan('konsantrasyon', sp.name, g.kons),
          ];
        },
        not: NOT,
      }, {}, MECH, () => ({ sonuc: 'yanlış', not: 'Girdap kullanıcı kararından farklı.' })));
    }
  }
  // Çekme: alanın dışında, bandın içindeki yaratık tur başında 10 ft (2 altıgen) merkeze; girince save (turda bir).
  const center = g0.t;
  const uPos = hex(A_ROW + 6, AX + cfg.tabanYaricap + cfg.cekme.bantAltigen);
  rows.push(runCtx(sp, s, g0, {
    ad: `çekme: merkezden ${cfg.tabanYaricap + cfg.cekme.bantAltigen} altıgendeki yaratık tur başında ${cfg.cekme.ft} ft`, kategori: 'alan', noB: true,
    cmd: { targetId: 'T', slotLevel: 4 }, post: [END_A, { type: 'end_turn', actorId: 'T' } as Command],
    p: { saveDefault: SAVE_OK },
    prep: (st) => ({ ...st, order: [...st.order, 'U'], combatants: { ...st.combatants, U: { ...st.combatants.T!, id: 'U', name: 'U', pos: uPos } } }),
    bek: (g) => {
      const u = g.after?.combatants.U;
      return [alan('çekilen altıgen', cfg.cekme.ft / 5, u?.pos ? distance(uPos, u.pos) : null), alan('merkeze uzaklık', cfg.tabanYaricap, u?.pos ? distance(u.pos, center) : null),
        alan('girişte save', true, g.saveler.some((x) => x.hedef === 'U'))];
    },
    not: NOT,
  }, {}, MECH, () => ({ sonuc: 'yanlış', not: 'Çekme kullanıcı kararından farklı.' })));
  // Kaçış: yakalanan eylemle Athletics (büyü DC'si); matris kontrol zarı 10 (+0) < DC 18: başarısız, yakalanma sürer.
  rows.push(runCtx(sp, s, g0, {
    ad: 'kaçış: Athletics (d20 10) büyü DC\'sine (18) karşı başarısız', kategori: 'durum', noB: true,
    cmd: { targetId: 'T', slotLevel: 4 }, post: [END_A, { type: 'escape', actorId: 'T' } as Command], p: { saveDefault: SAVE_FAIL },
    bek: (g) => {
      const esc = g.olaylar.find((e) => e.type === 'grapple_escape');
      return [alan('kaçış DC', 18, esc?.type === 'grapple_escape' ? esc.dc : null), alan('kaçış başarısı', false, esc?.type === 'grapple_escape' ? esc.success : null),
        alan('yakalanma sürer', true, (g.after?.combatants.T?.effects ?? []).some((e) => e.id.startsWith('girdap:')))];
    },
    not: NOT,
  }, {}, MECH, () => ({ sonuc: 'yanlış', not: 'Kaçış kullanıcı kararından farklı.' })));
  // Kaçış başarılı: STR +9, kontrol zarı 10 → 19 ≥ 18; yakalanma biter.
  rows.push(runCtx(sp, s, g0, {
    ad: 'kaçış: Athletics (d20 10 + 9) büyü DC\'sine (18) karşı başarılı', kategori: 'durum', noB: true,
    targetX: { modifiers: { str: 9, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } },
    cmd: { targetId: 'T', slotLevel: 4 }, post: [END_A, { type: 'escape', actorId: 'T' } as Command], p: { saveDefault: SAVE_FAIL },
    bek: (g) => {
      const esc = g.olaylar.find((e) => e.type === 'grapple_escape');
      return [alan('kaçış başarısı', true, esc?.type === 'grapple_escape' ? esc.success : null),
        alan('yakalanma sürer', false, (g.after?.combatants.T?.effects ?? []).some((e) => e.id.startsWith('girdap:')))];
    },
    not: NOT,
  }, {}, MECH, () => ({ sonuc: 'yanlış', not: 'Kaçış kullanıcı kararından farklı.' })));
  // Girdap dışı seçenekler (kullanıcı kararı 2026-11-19; SRD 5.2.1 Flood, Part Water, Redirect Flow: savaşta mekanik etki yok):
  // büyü yapılır (slot, konsantrasyon), alan ve hasar yok, Game Master notu (`map_note.secenekNotu`).
  for (const choice of ['flood', 'part', 'redirect']) {
    rows.push(runCtx(sp, s, g0, {
      ad: `seçenek ${choice}: savaş dışı (Game Master notu)`, kategori: 'yapım', noB: true,
      cmd: { targetHex: hex(A_ROW + 4, AX + 2), slotLevel: 4, choice }, p: {},
      bek: (g) => {
        const n = g.olaylar.find((e) => e.type === 'map_note' && !!e.secenekNotu);
        return [alan('alan', 'yok', (g.after?.map?.zones ?? []).length ? 'var' : 'yok'), alan('hasar', 0, g.hp.T ?? 0), alan('slot', [4], g.slot),
          alan('konsantrasyon', sp.name, g.kons), alan('Game Master notu', choice, n?.type === 'map_note' ? n.secenekNotu?.choice ?? null : null)];
      },
      not: 'Kullanıcı kararı: girdap dışı seçenek yalnız Game Master notu (SRD 5.2.1 metninden).',
    }, {}, 'utility (savaş dışı seçenek)', () => ({ sonuc: 'yanlış', not: 'Seçenek notu kullanıcı kararından farklı.' })));
  }
  return rows;
}
