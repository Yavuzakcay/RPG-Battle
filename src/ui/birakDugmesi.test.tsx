/**
 * Yalnız arayüz: "bırak" düğmesi yalnız gerçekten elde tutulan, bırakılabilir eşyada. Wild Shape biçimindeki druidin doğal
 * silahları (`beast:<canavar>`: ısırık, pençe, vuruş) için düğme yok; gerçek silah taşıyan normal karakterde var.
 * Gerçek kurulum (`createMapBattle`) ve gerçek `wild_shape` komutu; savaş ekranı sunucu çizimiyle (`Battle`).
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, describe, expect, it } from 'vitest';
import { Battle } from '../MapBattle';
import { createMapBattle, planParticipants } from '../app/setup';
import { demoCharacters } from '../screens/fixtures';
import { getMonster } from '../data';
import { dispatch, type Session } from './session';

const g = globalThis as unknown as { window?: unknown };
const had = 'window' in g;
const old = g.window;
afterAll(() => { if (had) g.window = old; else delete g.window; });

function render(w: number, h: number, session: Session): string {
  g.window = { innerWidth: w, innerHeight: h, addEventListener() {}, removeEventListener() {}, setTimeout, clearTimeout, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) };
  return renderToStaticMarkup(<Battle initial={session} onExit={() => undefined} />);
}

/** Tek kişilik parti (sırada ilk: DEX 20) + bir düşman; savaş başladı. */
function battle(sheetPatch: Record<string, unknown>): Session {
  const bor = demoCharacters()[1]!;
  const sheet = { ...bor.sheet, baseScores: { str: 14, dex: 20, con: 14, int: 10, wis: 15, cha: 8 }, ...sheetPatch };
  const plan = { party: [{ id: bor.id, sheet }], enemies: [{ monster: getMonster('goblin-warrior'), count: 1 }], mapId: 'col' } as never;
  const s = dispatch(createMapBattle(planParticipants(plan), plan, () => 0.5), { type: 'start_battle' }, () => 0.5);
  if (s.error) throw new Error(s.error);
  return s;
}
const actorOf = (s: Session) => s.state.combatants[s.state.order[s.state.turnIndex]!]!;
const dropButtons = (html: string) => [...html.matchAll(/class="hud-btn small"[^>]*>([^<]*) bırak<\/button>/g)].map((m) => m[1]);

describe('bırak düğmesi yalnız bırakılabilir eşyada', () => {
  it('gerçek silah taşıyan normal karakterde düğme var (okunur adla)', () => {
    const s = battle({});
    expect(actorOf(s).side).toBe('party');
    const drops = dropButtons(render(1280, 800, s));
    expect(drops.length).toBe(1);
    expect(drops[0]).not.toMatch(/:/);
  });
  it('Wild Shape biçimindeki druidde (Giant Frog) bırak düğmesi yok', () => {
    let s = battle({ classId: 'druid', level: 2, subclassId: undefined, wildShapeForms: ['giant-frog'], spellNames: [] });
    const druid = actorOf(s);
    s = dispatch(s, { type: 'wild_shape', actorId: druid.id, form: 'giant-frog' }, () => 0.5);
    if (s.error) throw new Error(s.error);
    expect(s.state.combatants[druid.id]?.shape).toBeTruthy();
    for (const [w, h] of [[1280, 800], [390, 844]] as const) {
      const html = render(w, h, s);
      expect(dropButtons(html), `${w}×${h}`).toEqual([]);
      expect(html).not.toMatch(/beast:[a-z-]+ bırak/);
    }
  });
});
