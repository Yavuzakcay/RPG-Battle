/**
 * SD8 eki: karakter oluşturucunun son ekranında zar seçimi (yalnız görünüm). Karakterin sahip olduğu zarlar listelenir:
 * Klasik (hep), sınıf, ırk, açılmış Alignment zarları (karakterde kalıcı) ve profilde açılmış ödül zarları. Açılmamışlar çıkmaz.
 * Seçim karakter kaydında (`zar`) ve hiçbir koşulda otomatik değiştirilmez.
 */
import { getLang, t } from '../i18n';
import { ownedDice, savedChoice } from '../app/diceOwn';
import { loadDiceStore, themeLabel } from '../app/diceUnlock';
import { diceThemeOf } from './diceTheme';
import type { SavedCharacter } from '../rules/builder';

const BASE = import.meta.env.BASE_URL;

export function DiceStep(props: { c: SavedCharacter; setC: (f: (x: SavedCharacter) => SavedCharacter) => void; /** Oluşturucuda önizlenen Alignment (henüz kayıtlı değilse). */ alignment?: SavedCharacter['hizalanma'] }) {
  const T = t().diceStep;
  const lang = getLang();
  const store = loadDiceStore();
  const view = { ...props.c, hizalanma: props.alignment ?? props.c.hizalanma };
  const list = ownedDice(view, store);
  const current = savedChoice(props.c, store);
  const label = (o: { kind: string; themeId: string }) => (o.kind === 'sinif' ? T.classDie(themeLabel(o.themeId, lang)) : o.kind === 'irk' ? T.raceDie(themeLabel(o.themeId, lang)) : themeLabel(o.themeId, lang));
  const groups: Array<[string, string[]]> = [[T.mine, ['klasik', 'sinif', 'irk']], [T.alignment, ['hizalanma']], [T.rewards, ['odul']]];
  return (
    <div className="dice-step">
      <h3>{T.title}</h3>
      <p className="mute">{T.intro}</p>
      {groups.map(([title, kinds]) => {
        const items = list.filter((o) => kinds.includes(o.kind));
        if (items.length === 0) return null;
        return (
          <fieldset key={title} className="dice-pick-group"><legend>{title}</legend>
            <div role="radiogroup" aria-label={title} className="dice-step-list">
              {items.map((o) => {
                const art = diceThemeOf(o.themeId).dice['20'];
                return (
                  <button key={o.value} type="button" role="radio" aria-checked={current === o.value} data-zar-tema={o.value}
                    className={current === o.value ? 'on' : 'ghost'} onClick={() => props.setC((x) => ({ ...x, zar: o.value }))}>
                    {art && <img src={`${BASE}${art.image}`} alt="" width={28} height={28} draggable={false} />}
                    <span>{label(o)}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
