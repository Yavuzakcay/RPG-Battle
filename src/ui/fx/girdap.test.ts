/**
 * Control Water efekt sayfası (yalnız görsel): `assets-ham/efekt/control-water.jpg` → halka girdap (büyük alan) ve içe sarmal
 * (küçük alan, `efekt-baglama.json` `zeminKucuk`); dönen 6 karelik şerit, normal karışım, sabit kare; dokunun üstünde altıgen
 * çizgileri (`zeminIzgara`). Gerçek motor: Whirlpool alanı (`girdap.ts`) yama çizer, taşkın/yarılma çizmez.
 */
import { describe, expect, it } from 'vitest';
import kesim from '../../../data/efekt-kesim.json';
import e2 from '../../../data/efekt-e2.json';
import { applyEvents, execute } from '../../battle';
import { P1 } from '../../battle/fixtures';
import { seededRng } from '../../rules/dice';
import { spells } from '../../data';
import { neighbors, type Offset } from '../../rules/hex';
import type { BattleState } from '../../battle/types';
import { field } from './e2Verify';
import { B, FX, groundFx } from './fxPlan';

const recs = (e2 as unknown as { efektler: Record<string, { kare: number; karisim: string; dongu: boolean; sabit?: number; kaynak: string; kullanilmiyor?: boolean }> }).efektler;
const disc = (c: Offset, r: number): Offset[] => {
  const seen = new Map<string, Offset>([[`${c.col},${c.row}`, c]]);
  let ring = [c];
  for (let i = 0; i < r; i++) {
    ring = ring.flatMap((h) => neighbors(h)).filter((h) => !seen.has(`${h.col},${h.row}`) && (seen.set(`${h.col},${h.row}`, h), true));
  }
  return [...seen.values()];
};
const withZone = (hexes: Offset[], spellId = 'control-water'): BattleState => {
  const base = field(spells.find((s) => s.id === 'control-water')!);
  return { ...base, map: { ...base.map!, zones: [{ id: 'z1', spellId, name: 'Control Water', casterId: 'A', side: 'party', dc: 13, slotLevel: 4, hexes }] } as never };
};

describe('Control Water efekt sayfası', () => {
  it('kesim tablosu iki efekt (halka, sarmal), dönen canlandırma; kayıtlar normal karışım, 6 kare döngü, sabit kare 0', () => {
    const sh = (kesim as unknown as { sayfalar: Record<string, { adlar: string[]; hucre?: string; renkKoru?: string[]; canlandirma: Record<string, { tur: string; aci?: number; kenar?: unknown }> }> }).sayfalar['control-water']!;
    expect(sh.hucre).toBe('efekt');
    // Normal karışımda koyu gölgeler okunsun: renk ham (`renkKoru`); dış kenardaki koyu şeritler `kenar` ile temizlenir.
    expect(sh.renkKoru).toEqual(sh.adlar);
    expect(sh.adlar).toEqual(['zemin-girdap-halka', 'zemin-girdap-sarmal']);
    for (const n of sh.adlar) {
      expect(sh.canlandirma[n]?.tur).toBe('donme');
      expect(sh.canlandirma[n]?.aci).toBeTruthy();
      expect(sh.canlandirma[n]?.kenar).toBeTruthy();
      const r = recs[`efekt-${n}`]!;
      expect(r).toMatchObject({ kare: 6, karisim: 'normal', dongu: true, sabit: 0, kaynak: 'control-water' });
      expect(r).not.toHaveProperty('kullanilmiyor');
      expect(FX[n]?.blend).toBe('normal');
    }
    // Eski kutu girdabı artık bağlı değil (kayıtta işaretli).
    expect(recs['efekt-zemin-girdap']?.kullanilmiyor).toBe(true);
    expect(JSON.stringify(B.zemin)).not.toContain('"zemin-girdap"');
  });
  it('alan yarıçapı ≤ 2 altıgen sarmal, büyük alan halka; taşkın/yarılma alanı yama çizmez; ızgara dokunun üstünde', () => {
    const at = { col: 7, row: 5 };
    const patch = (r: number, id?: string) => groundFx(withZone(disc(at, r), id)).patches[0];
    expect(patch(1)?.sprite.id).toBe('zemin-girdap-sarmal');
    expect(patch(2)?.sprite.id).toBe('zemin-girdap-sarmal');
    expect(patch(3)?.sprite.id).toBe('zemin-girdap-halka');
    expect(patch(5)?.sprite.id).toBe('zemin-girdap-halka');
    expect(patch(5)?.grid).toBe(true);
    expect(patch(3, 'control-water:terrain')).toBeUndefined();
  });
  it('gerçek motor: Whirlpool 4. seviye slotta (19 altıgen) sarmal, 7. seviyede (91 altıgen, 50 ft) halka çizer', () => {
    const sp = spells.find((x) => x.id === 'control-water')!;
    const s = field(sp);
    for (const [slot, n, want] of [[4, 19, 'zemin-girdap-sarmal'], [7, 91, 'zemin-girdap-halka']] as const) {
      const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: sp.name, slotLevel: slot, targetId: 'B', choice: 'whirlpool' }, P1, seededRng(3));
      if (!r.ok) throw new Error(r.error);
      const after = applyEvents(s, r.events);
      const z = after.map?.zones?.find((x) => x.spellId === 'control-water');
      expect(z?.hexes.length).toBe(n);
      expect(groundFx(after).patches.map((p) => p.sprite.id)).toEqual([want]);
    }
  });
});
