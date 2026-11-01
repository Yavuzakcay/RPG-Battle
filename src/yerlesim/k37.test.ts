/**
 * Kuyruk 37: ırk yerleşimleri (K35 `kopya`) yurt sayfalarında tek düğüm: "Yerleşime gir" hub'ı açar (ırkın
 * görünümü), çıkış; Serüven kaydı (olay replay) aynı durumu verir.
 */
import { describe, expect, it } from 'vitest';
import { executeSeruven, nodeOpen, pageById, replaySeruven, type SeruvenCommand, type SeruvenEvent, type SeruvenState } from '../journey/seruven';
import { gorunumFiltre, yerlesimById } from './yerlesim';
import { partyAt } from '../sim/balance';

const YER: Array<[string, string, string]> = [
  ['dag', 'cuce-kalesi', 'dwarf'], ['orman', 'elf-kasabasi', 'elf'], ['orman', 'yarimcik-kasabasi', 'halfling'], ['orman', 'ork-kasabasi', 'orc'],
  ['bataklik', 'gnom-kasabasi', 'gnome'], ['buzul', 'goliath-kalesi', 'goliath'], ['volkan', 'ejder-kalesi', 'dragonborn'], ['derinlikler', 'tiefling-kasabasi', 'tiefling'],
];

describe('ırk yerleşimleri kıta sayfalarında', () => {
  it('her düğüm yurt sayfasında, açık, hub açılır (ırkın görünümü) ve çıkılır; kayıt replay aynı', () => {
    for (const [page, id, irk] of YER) {
      const log: SeruvenEvent[] = [];
      const party = partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh }));
      const st = executeSeruven(null, { type: 'start', id: 's', seed: 1, party, toggles: { irkBaslangic: false } });
      if (!st.ok) throw new Error(st.error);
      log.push(...st.events);
      let s: SeruvenState = { ...st.state, page };
      log[0] = { type: 'seruven_started', state: s };
      const step = (c: SeruvenCommand) => { const r = executeSeruven(s, c); if (!r.ok) throw new Error(`${id} ${c.type}: ${r.error}`); log.push(...r.events); s = r.state; };
      const node = pageById(page)!.nodes.find((n) => n.id === id)!;
      expect(node.yerlesim, id).toBe(id);
      expect(nodeOpen(s, pageById(page)!, node), id).toBe(true);
      step({ type: 'move', to: id });
      step({ type: 'yerlesim_enter' });
      expect(s.yerlesim?.id).toBe(id);
      const y = yerlesimById(id)!;
      expect([y.irk, y.gorunum]).toEqual([irk, irk]);
      expect(gorunumFiltre(y)).not.toBe('');
      step({ type: 'yerlesim_map', map: y.baslangic, via: 'hub' });
      step({ type: 'yerlesim_map', map: null });
      step({ type: 'yerlesim_leave' });
      expect(s.yerlesim).toBeNull();
      expect(replaySeruven(log)).toEqual(s);
    }
  });
  it('düğümler sayfanın diğer düğümleriyle çakışmaz (en az 0,08 uzaklık)', () => {
    for (const [page, id] of YER) {
      const p = pageById(page)!;
      const n = p.nodes.find((x) => x.id === id)!;
      for (const o of p.nodes) if (o.id !== id) expect(Math.hypot(o.x - n.x, o.y - n.y), `${id} ~ ${o.id}`).toBeGreaterThan(0.08);
    }
  });
});
