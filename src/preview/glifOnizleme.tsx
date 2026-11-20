/**
 * Ortak simge setleri (glif) kontrol sayfası (yalnız geliştirme; `npm run dev` → /onizleme-glif.html; build girdisi değil).
 * Gerçek bileşenlerle: `?v=dex&id=fireball` Dungeondex büyü ayrıntısı (kapaksız), `?v=onizleme` hamle önizleme kartı
 * (Evocation büyücüsü, Fireball; dost ateşi dahil). Simgeler `public/glif/` (`npm run glif`); kesilmemişse hiçbiri çizilmez.
 */
import { createRoot } from 'react-dom/client';
import '../styles.css';
import { ensureLang } from '../i18n';
import { loadClassData, loadMonsters } from '../data';
import { removeStaticSplash } from '../ui/splashBoot';
import { Dungeondex } from '../screens/Dungeondex';
import PreviewCard from '../ui/preview/PreviewCard';
import { kitArena, o } from '../battle/k54bKit';
import { P1 } from '../battle/fixtures';
import { DEFAULT_SETTINGS, emptyStore } from '../app/discovery';
import type { BattleState, Combatant, Command } from '../battle/types';

const q = new URLSearchParams(location.search);

function PreviewDemo() {
  const r = kitArena({ cls: 'wizard', sub: 'evoker', level: 5, place: { A: o(1, 3), B: o(5, 3), C: o(5, 2) }, enemy: { hp: 200, maxHp: 200 } });
  const s: BattleState = { ...r.state, combatants: { ...r.state.combatants, A: { ...(r.state.combatants.A as Combatant), spellNames: ['Fireball'], spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0], spellSaveDc: 15 } } };
  const cmd = { type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: o(5, 3) } as Command;
  return (
    <div style={{ padding: 12, background: '#3d5a32', minHeight: '100vh', boxSizing: 'border-box' }}>
      {/* Savaştaki kap: hedef balonu (`.bubble`, 250 px) > seçenek (`.choice`) > önizleme kartı. */}
      <div className="bubble" style={{ position: 'static', width: 250 }}>
        <strong>Bandit · AC 12</strong>
        <div className="choice">
          <div><span>Fireball</span><small>3. seviye · DEX DC 15</small></div>
          <button type="button">Yap</button>
          <PreviewCard state={s} cmd={cmd} ctx={P1} disc={emptyStore()} settings={{ ...DEFAULT_SETTINGS, detail: 'tam' }} />
        </div>
      </div>
    </div>
  );
}

removeStaticSplash();
void (async () => {
  await ensureLang();
  await Promise.all([loadMonsters(), loadClassData()]);
  const root = createRoot(document.getElementById('root')!);
  root.render(q.get('v') === 'onizleme' ? <PreviewDemo />
    : <Dungeondex onBack={() => {}} cover={false} initial={{ cat: (q.get('k') ?? 'buyu') as 'buyu', id: q.get('id') ?? 'fireball' }} />);
})();
