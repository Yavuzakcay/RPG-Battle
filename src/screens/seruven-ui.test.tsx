/** Kuyruk 31: Serüven ekranı (statik çizim): her sayfa, düğüm durumları, kart, ana menü kartı. */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PageView, SeruvenScreen } from './SeruvenScreen';
import { Home } from './Screens';
import { SERUVEN, executeSeruven, type SeruvenState } from '../journey/seruven';
import { partyAt } from '../sim/balance';

function begin(): SeruvenState {
  const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, toggles: { irkBaslangic: false }, party: partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh })) });
  if (!r.ok) throw new Error(r.error);
  return r.state;
}
const view = (s: SeruvenState) => renderToStaticMarkup(<PageView state={s} run={() => true} error={null} onBack={() => {}} onReset={() => {}} onBattle={() => {}} />);

describe('Serüven ekranı', () => {
  // Kuyruk 32: bayraklı alt düğüm (Heykel Mağarası) bayrak bulunana dek çizilmez; o düğüm bu sınamada atlanır.
  it('her sayfa çizilir: bütün (görünür) düğümler, giriş, resim yolu public/kita/', () => {
    for (const p of SERUVEN.pages) {
      const html = view({ ...begin(), page: p.id });
      expect(html, p.id).toContain(`data-page="${p.id}"`);
      expect(html).toContain(`kita/${p.gorsel.split('/').pop()}`);
      for (const n of p.nodes) if (!n.bayrak) expect(html, `${p.id}/${n.id}`).toContain(`data-node="${n.id}"`);
    }
  });
  it('Buzul başlangıcı: ilk düğüm açık, diğerleri kilitli; adlar haritanın görünen adı', () => {
    const html = view(begin());
    expect(html.match(/seruven-node open/g)?.length).toBe(1);
    expect(html.match(/seruven-node locked/g)?.length).toBe(3);
    expect(html).toContain('Açık Buzul');
    expect(html).toContain('Sayfa 1/7');
  });
  it('başlangıç formu karakterleri listeler; ana menüde Serüven kartı', () => {
    expect(renderToStaticMarkup(<SeruvenScreen characters={[]} onBack={() => {}} onBattle={() => {}} />)).toContain('karakter oluşturun');
    expect(renderToStaticMarkup(<Home onPlayer={() => {}} onGm={() => {}} onStatus={() => {}} onSeruven={() => {}} />)).toContain('Serüven');
  });
});
