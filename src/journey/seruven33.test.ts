/**
 * Kuyruk 33 M1: Batı Kıyısı sayfası (Çöl → Batı Kıyısı → Derinlikler). Yerleşim düğümleri ("Yakında") savaş
 * başlatmaz ve yolu kapatmaz; Çöl bitmeden batıya geçilmez, Game Master "Serbest gezinti" bunu da aşar.
 */
import { describe, expect, it } from 'vitest';
import { executeSeruven, gateOpen, nodeOpen, nodeStop, pageById, pageOrder, type SeruvenCommand, type SeruvenState } from './seruven';
import { seruvenBattleSession } from '../app/seruvenBattle';
import { partyAt } from '../sim/balance';

function begin(page: string): SeruvenState {
  const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, toggles: { irkBaslangic: false }, party: partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh })) });
  if (!r.ok) throw new Error(r.error);
  return { ...r.state, page };
}
const step = (s: SeruvenState, cmd: SeruvenCommand): SeruvenState => {
  const r = executeSeruven(s, cmd);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};

describe('Kuyruk 33 Batı Kıyısı', () => {
  const bati = pageById('bati-kiyisi')!;
  it('sayfa yüklenir: giriş + 3 yerleşim + Derinlikler girişi = 5 düğüm; koordinatlar; resim oranı', () => {
    expect(bati.gorsel).toBe('kita/kita-bati.webp');
    expect(bati.boyut).toEqual([2752, 1536]);
    expect(bati.entry).toEqual({ x: 1, y: 0.46 });
    expect(bati.nodes.map((n) => [n.id, n.x, n.y])).toEqual([['kral-kalesi', 0.73, 0.2], ['beyaz-sehir', 0.42, 0.33], ['liman', 0.27, 0.72]]);
    expect(bati.exit).toMatchObject({ x: 0.62, y: 0.74 });
    expect(1 + bati.nodes.length + (bati.exit ? 1 : 0)).toBe(5);
    expect(bati.nodes.every((n) => n.yerlesim === n.id && n.ad?.tr)).toBe(true);
  });
  it('geçişler iki yönde: Çöl çıkışı → Batı Kıyısı (y 0,46 hizalı) → Derinlikler', () => {
    const col = pageById('col')!;
    expect(col.next).toBe('bati-kiyisi');
    expect(col.exit?.y).toBe(0.46);
    expect(bati.next).toBe('derinlikler');
    expect(pageOrder().map((p) => p.id)).toEqual(['buzul', 'dag', 'orman', 'bataklik', 'col', 'bati-kiyisi', 'derinlikler']);
    // Çöl bitmeden batıya geçilmez; bitince geçilir.
    let s = begin('col');
    expect(gateOpen(s, col, col.exit)).toBe(false);
    expect(executeSeruven(s, { type: 'move', to: 'cikis' }).ok).toBe(false);
    s = { ...s, done: ['col/gemi-enkazi', 'col/sutun-harabesi'] };
    s = step(s, { type: 'move', to: 'cikis' });
    expect(s.page).toBe('bati-kiyisi');
    expect(s.at).toBe('giris');
    // Yerleşimler geçilmiş sayılır: yol baştan sona açık, çıkış Derinliklere.
    for (const n of bati.nodes) expect(nodeOpen(s, bati, n)).toBe(true);
    s = step(step(step(s, { type: 'move', to: 'kral-kalesi' }), { type: 'move', to: 'beyaz-sehir' }), { type: 'move', to: 'liman' });
    s = step(s, { type: 'move', to: 'cikis' });
    expect(s.page).toBe('derinlikler');
  });
  it('Serbest gezinti sayfa sırası kuralını da aşar', () => {
    const col = pageById('col')!;
    const s = step(begin('col'), { type: 'set_toggle', key: 'serbestGezinti', on: true });
    expect(gateOpen(s, col, col.exit)).toBe(true);
    expect(step(s, { type: 'move', to: 'cikis' }).page).toBe('bati-kiyisi');
  });
  it('"Yakında" yerleşim savaş başlatmaz ve alınamaz', () => {
    let s = step(begin('bati-kiyisi'), { type: 'move', to: 'kral-kalesi' });
    expect(nodeStop(bati.nodes[0]!, 3)).toBeNull();
    expect(seruvenBattleSession(s, 'kral-kalesi', () => 0.5)).toBeNull();
    expect(executeSeruven(s, { type: 'visit', node: 'kral-kalesi' }).ok).toBe(false);
    expect(executeSeruven(s, { type: 'battle_result', node: 'kral-kalesi', outcome: 'won', statuses: {}, xp: 0 }).ok).toBe(false);
    s = step(s, { type: 'move', to: 'liman' });
    expect(s.done).toEqual([]);
  });
});
