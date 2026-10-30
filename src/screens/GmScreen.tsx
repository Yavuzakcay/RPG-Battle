/**
 * Game Master ekranı: harita, düşmanlar, masumlar ve parti seçilip savaş kurulur. Ayrı parça (tembel yüklenir;
 * savaş kurma kodu ve harita verisi giriş ekranını yavaşlatmasın).
 */
import { storedCarryRule } from '../ui/carrySetting';
import { useEffect, useMemo, useRef, useState } from 'react';
import { classes, monsters, type Monster } from '../data';
import type { DragonWakeMode } from '../battle/types';
import { isWideMap, maps, variantLabel } from '../map/maps';
import { TIERS, crNumber, fitsMap, monsterEnv, tierOf, winterPick } from '../data/monsterEnv';
import { optionalRules } from '../battle/maprules';
import { characterProblems, type SavedCharacter } from '../rules/builder';
import { currentStatus, fullStatus, isRested, longRestStatus } from '../rules/characterRest';
import { statusBlock } from '../app/partyStatus';
import { createMapBattle, customMonster, customMonsterCr, customMonsterProblems, planParticipants, planProblems, type CustomMonsterInput, civilianHexProblem, civilianRule, dragonSetup, maxCivilians, type CivilianPlacement } from '../app/setup';
import { allHexes, hexCenter, hexPoints, worldOf } from '../ui/mapView';
import type { Offset } from '../rules/hex';
import { newId } from '../app/storage';
import { CUSTOM_ATTACK_MAX, CUSTOM_NAME_MAX, MAX_PARTY } from '../app/limits';
import { CR_STEPS } from '../rules/crEstimate';
import { getLang, t } from '../i18n';
import type { Session } from '../ui/session';
import type { Combatant } from '../battle';
import { DICE_MODES, type DiceMode } from '../rules/manualDice';
import { useDiceFlow } from '../ui/diceFlow';
import { DicePrompt } from '../ui/DicePrompt';

const BASE = import.meta.env.BASE_URL;
const className = (id: string) => classes.find((c) => c.id === id)?.name ?? id;

const BLANK_MONSTER: CustomMonsterInput = {
  name: '', ac: 12, hp: 15, speed: 30, attackName: 'Saldırı', attackBonus: 3, damage: '1d6+1', damageType: 'slashing', ranged: false,
};

/** Kayıtlı durumdaki HP: "HP 12/38". */
function hpText(c: SavedCharacter): string {
  try { return t().gm.partyHp(currentStatus(c.sheet, c.status).hp, fullStatus(c.sheet).hp); } catch { return ''; }
}

export function GmScreen(props: {
  characters: SavedCharacter[]; onStart: (s: Session) => void; onBack: () => void;
  /** Dinlenme (herkes uzun dinlensin): karakter listesini günceller. */
  onUpdateCharacters?: (list: SavedCharacter[]) => void;
  /** Açılışta seçili harita, varyant ve ejderha uyandırma kipi (testler ve kısayollar için). */
  initial?: { mapId?: string; variantId?: string; dragonWake?: DragonWakeMode; allMonsters?: boolean };
}) {
  const valid = props.characters.filter((c) => characterProblems(c).length === 0);
  // Ölü ya da 0 HP'deki karakter savaşa giremez (önce dinlenmeli); listede nedeniyle görünür.
  const ready = valid.filter((c) => statusBlock(c) === null);
  const blocked = valid.filter((c) => statusBlock(c) !== null);
  const tired = valid.filter((c) => !isRested(c.sheet, c.status) && !c.status?.dead);
  // Seçim yapılana kadar ilk dört hazır karakter (sonradan eklenenler de) partide.
  const [chosen, setParty] = useState<string[] | null>(null);
  const party = chosen ?? ready.slice(0, Math.min(4, MAX_PARTY)).map((c) => c.id);
  const partyFull = party.length >= MAX_PARTY;
  const [counts, setCounts] = useState<Record<string, number>>({ wolf: 2 });
  const [customs, setCustoms] = useState<Monster[]>([]);
  const blankMonster = (): CustomMonsterInput => ({ ...BLANK_MONSTER, attackName: t().gm.custom.defaultAttack });
  const [draft, setDraft] = useState<CustomMonsterInput>(blankMonster);
  const [showCustom, setShowCustom] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  // Güç kademesi filtresi (çoklu seçim); boşsa bütün kademeler.
  const [tierFilter, setTierFilter] = useState<string[]>([]);
  const [mapId, setMapId] = useState(props.initial?.mapId ?? maps[0]?.id ?? '');
  const map = maps.find((m) => m.id === mapId) ?? maps[0];
  const [variantId, setVariantId] = useState(props.initial?.variantId ?? map?.variants[0]?.id ?? '');
  const variant = map?.variants.find((v) => v.id === variantId) ?? map?.variants[0];
  const [options, setOptions] = useState<string[]>([]);
  const [civilians, setCivilians] = useState(4);
  const [civilianPlacement, setCivilianPlacement] = useState<CivilianPlacement>('far');
  const [civilianSeed, setCivilianSeed] = useState(1);
  const [civilianHexes, setCivilianHexes] = useState<Offset[]>([]);
  // Harita/varyant değişince masum sayısı haritanın varsayılanına (Taverna 4, Şehir Meydanı 6) döner.
  useEffect(() => {
    const m = maps.find((x) => x.id === mapId) ?? maps[0];
    const rule = m ? civilianRule(m.id, variantId || (m.variants[0]?.id ?? '')) : null;
    setCivilians(rule?.default ?? 4);
    setCivilianHexes([]);
  }, [mapId, variantId]);
  const [strictObjective, setStrictObjective] = useState(false);
  // Uyuyan ejderha varyantı: ejderha, uyandırma kipi (yalnızca yapay zekâ düşmanları) ve yüzdesi.
  const dragonConf = map && variant ? dragonSetup(map.id, variant.id) : null;
  const [dragon, setDragon] = useState<string | null>(null);
  const [dragonWake, setDragonWake] = useState<DragonWakeMode | null>(props.initial?.dragonWake ?? null);
  const [dragonChance, setDragonChance] = useState<number | null>(null);
  // Harita/varyant değişince ejderha ayarları varyantın varsayılanına döner (ilk açılışta değil).
  const dragonKey = useRef(`${mapId}/${variantId}`);
  useEffect(() => {
    if (dragonKey.current === `${mapId}/${variantId}`) return;
    dragonKey.current = `${mapId}/${variantId}`;
    setDragon(null); setDragonWake(null); setDragonChance(null);
  }, [mapId, variantId]);
  const all = useMemo(() => [...monsters, ...customs], [customs]);
  // 330 canavar: varsayılan olarak seçili haritaya uyanlar (ortam listesi), "Tüm canavarlar" ile hepsi;
  // ada ya da "CR 5" yazarak süz; seçilenler hep görünür. Liste güç kademelerine ayrılır, CR'a göre sıralı.
  const [query, setQuery] = useState('');
  const [allMonsters, setAllMonsters] = useState(props.initial?.allMonsters ?? false);
  // Zar modu: fiziksel zarda inisiyatif zarları da burada, savaş kurulurken istenir.
  const [diceMode, setDiceMode] = useState<DiceMode>('auto');
  // Kurulan savaşın katılımcıları (zarı atan oyuncu mu); tıklamada hemen gerektiği için ref.
  const starting = useRef<Combatant[]>([]);
  const isPlayer = (id: string) => starting.current.some((c) => c.id === id && c.side === 'party' && !c.civilian);
  const dice = useDiceFlow<Session>(diceMode, isPlayer, props.onStart);
  const pool = useMemo(() => (allMonsters ? all : all.filter((m) => fitsMap(m.id, mapId))), [all, allMonsters, mapId]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cr = /^cr\s*(\S+)$/.exec(q)?.[1];
    const hit = (m: Monster) => (q ? (cr ? m.cr === cr : m.name.toLowerCase().includes(q)) : pool.includes(m));
    // Kış varyantında (Dağ kış) soğuk iklim canavarları her kademenin başında.
    const cold = (m: Monster) => (winterPick(m.id, variant?.id ?? '') ? 0 : 1);
    const tierOk = (m: Monster) => tierFilter.length === 0 || tierFilter.includes(tierOf(m.cr).id);
    return all.filter((m) => (counts[m.id] ?? 0) > 0 || (pool.includes(m) && hit(m) && tierOk(m)))
      .sort((a, b) => cold(a) - cold(b) || crNumber(a.cr) - crNumber(b.cr) || a.name.localeCompare(b.name));
  }, [all, pool, query, counts, variant, tierFilter]);
  const tiers = TIERS.map((t) => ({ tier: t, list: shown.filter((m) => tierOf(m.cr) === t) })).filter((g) => g.list.length > 0);
  if (!map || !variant) return null;
  const optional = optionalRules(map.id, variant.id);
  const plan = {
    party: ready.filter((c) => party.includes(c.id)).map((c) => ({ id: c.id, sheet: c.sheet, ...(c.status ? { status: c.status } : {}) })),
    carryRule: storedCarryRule(),
    enemies: all.filter((m) => (counts[m.id] ?? 0) > 0).map((m) => ({ monster: m, count: counts[m.id] ?? 0 })),
    // Aynalama (haritayı yatay çevirme) arayüzden kaldırıldı (Görev G); motor eski aynalı kayıtları açar.
    mapId: map.id, variantId: variant.id, mirrored: false,
    options: options.filter((o) => optional.some((r) => r.id === o)),
    civilians: Math.min(civilians, maxCivilians(map.id, variant.id, false)),
    civilianPlacement, civilianSeed, civilianHexes, strictObjective,
    ...(dragonConf ? {
      dragon: dragon ?? dragonConf.dragon, dragonWake: dragonWake ?? dragonConf.mode, dragonWakeChance: dragonChance ?? dragonConf.chancePct,
    } : {}),
  };
  const civilianMax = maxCivilians(map.id, variant.id, plan.mirrored);
  const manual = options.includes('objective') && civilianPlacement === 'manual';
  /** Elle yerleşim: boş geçerli altıgene dokununca masum konur, masum olan altıgende kaldırılır. */
  const toggleCivilian = (h: Offset) => {
    const at = civilianHexes.findIndex((x) => x.col === h.col && x.row === h.row);
    if (at >= 0) setCivilianHexes(civilianHexes.filter((_, i) => i !== at));
    else if (civilianHexes.length < plan.civilians && !civilianHexProblem(map.id, variant.id, plan.mirrored, h)) setCivilianHexes([...civilianHexes, h]);
  };
  const problems = planProblems(plan);
  const draftProblems = customMonsterProblems(draft);
  const draftCr = customMonsterCr(draft);
  const setCount = (id: string, n: number) => setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(12, n)) }));
  const num = (v: string) => Number(v);
  const L = t();
  const G = L.gm;
  const D = L.dice;
  const tierName = (id: string) => G.tierNames[id] ?? id;

  return (
    <div className="menu-screen">
      <main className="app wide">
        <header>
          <h1>{G.title}</h1>
          <button className="ghost" onClick={props.onBack}>{L.common.home}</button>
        </header>

        <section className="panel">
          <h2>{G.party(plan.party.length, MAX_PARTY)}</h2>
          {ready.length === 0 && (
            <p className="empty-state">{G.partyEmpty}</p>
          )}
          <p className={`mute party-limit${partyFull ? ' full' : ''}`}>{G.partyLimit(MAX_PARTY, partyFull)}</p>
          <div className="chips">
            {ready.map((c) => (
              <label key={c.id} className={`chip${party.includes(c.id) ? ' on' : ''}${partyFull && !party.includes(c.id) ? ' off' : ''}`}>
                <input type="checkbox" checked={party.includes(c.id)} disabled={partyFull && !party.includes(c.id)}
                  onChange={(e: { target: { checked: boolean } }) => setParty(e.target.checked ? (partyFull ? party : [...party, c.id]) : party.filter((x) => x !== c.id))} />
                {c.sheet.name} ({className(c.sheet.classId)} {c.sheet.level}){c.status ? ` · ${hpText(c)}` : ''}
              </label>
            ))}
            {blocked.map((c) => (
              <span key={c.id} className="chip off">{c.sheet.name} · {G.blocked[statusBlock(c) ?? ''] ?? ''}</span>
            ))}
          </div>
          {tired.length > 0 && props.onUpdateCharacters && (
            <div className="gm-row">
              <small className="mute">{G.restNote}</small>
              <button className="ghost" onClick={() => props.onUpdateCharacters?.(props.characters.map((c) =>
                (tired.includes(c) ? { ...c, status: longRestStatus(c.sheet, c.status) } : c)))}>{G.restAll}</button>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>{G.map}</h2>
          <div className="gm-row">
            <select aria-label={G.map} value={map.id} onChange={(e: { target: { value: string } }) => {
              const next = maps.find((m) => m.id === e.target.value);
              setMapId(e.target.value); setVariantId(next?.variants[0]?.id ?? ''); setOptions([]);
            }}>
              {/* Görev H2: Klasik (15×7) ve Geniş haritalar ayrı grupta; geniş haritanın adı çeviri tablosundan. */}
              <optgroup label={G.mapGroups.classic}>
                {maps.filter((m) => !isWideMap(m)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </optgroup>
              <optgroup label={G.mapGroups.wide}>
                {maps.filter(isWideMap).map((m) => <option key={m.id} value={m.id}>{G.mapInfo[m.id]?.name ?? m.name}</option>)}
              </optgroup>
            </select>
            {/* Varyantlar hep görünür düğmeler (açılır listede "Uyuyan ejderha" gibi varyantlar gözden kaçıyordu). */}
            <div className="chips variant-chips" role="radiogroup" aria-label={G.variant}>
              {map.variants.map((v) => (
                <label key={v.id} className={`chip${v.id === variant.id ? ' on' : ''}`}>
                  <input type="radio" name="variant" value={v.id} checked={v.id === variant.id}
                    onChange={() => { setVariantId(v.id); setOptions([]); }} />
                  {variantLabel(v, getLang())}{dragonSetup(map.id, v.id) ? ' 🐉' : ''}
                </label>
              ))}
            </div>
            {isWideMap(map) && <p className="mute map-desc">{G.mapInfo[map.id]?.desc ?? ''} {G.mapSize(map.size.cols, map.size.rows)}</p>}
            {optional.map((r) => (
              <label className="toggle" key={r.id}>
                <input type="checkbox" checked={options.includes(r.id)}
                  onChange={(e: { target: { checked: boolean } }) => setOptions((o) => (e.target.checked ? [...o, r.id] : o.filter((x) => x !== r.id)))} />
                {r.id === 'darkness' ? G.darkness : r.id === 'objective' ? G.objective : r.id}
              </label>
            ))}
            {options.includes('objective') && (
              <span className="stepper" aria-label={G.civiliansLabel}>
                <button aria-label={G.civDec} disabled={plan.civilians <= 0}
                  onClick={() => { setCivilians(Math.max(0, plan.civilians - 1)); setCivilianHexes((hs) => hs.slice(0, Math.max(0, plan.civilians - 1))); }}>−</button>
                <b>{G.civilianCount(plan.civilians)}</b>
                <button aria-label={G.civInc} disabled={plan.civilians >= civilianMax}
                  onClick={() => setCivilians(Math.min(civilianMax, plan.civilians + 1))}>+</button>
              </span>
            )}
            {options.includes('objective') && (
              <select aria-label={G.civPlacement} value={civilianPlacement}
                onChange={(e: { target: { value: string } }) => setCivilianPlacement(e.target.value as CivilianPlacement)}>
                <option value="far">{G.placement.far}</option>
                <option value="middle">{G.placement.middle}</option>
                <option value="random">{G.placement.random}</option>
                <option value="manual">{G.placement.manual}</option>
              </select>
            )}
            {options.includes('objective') && civilianPlacement === 'random' && (
              <button onClick={() => setCivilianSeed(1 + Math.floor(Math.random() * 1e9))}>{G.reroll}</button>
            )}
            {options.includes('objective') && (
              <label className="toggle" title={G.strictHint}>
                <input type="checkbox" checked={strictObjective}
                  onChange={(e: { target: { checked: boolean } }) => setStrictObjective(e.target.checked)} />
                {G.strict}
              </label>
            )}
            {dragonConf && (
              <select aria-label={G.dragon} value={plan.dragon} onChange={(e: { target: { value: string } }) => setDragon(e.target.value)}>
                {dragonConf.dragons.map((id) => <option key={id} value={id}>{G.sleeping(monsters.find((m) => m.id === id)?.name ?? id)}</option>)}
              </select>
            )}
            {dragonConf && (
              <select aria-label={G.wake} value={plan.dragonWake}
                title={G.wakeHint}
                onChange={(e: { target: { value: string } }) => setDragonWake(e.target.value as DragonWakeMode)}>
                <option value="never">{G.wakeMode.never}</option>
                <option value="chance">{G.wakeMode.chance}</option>
                <option value="gm">{G.wakeMode.gm}</option>
              </select>
            )}
            {dragonConf && plan.dragonWake === 'chance' && (
              <label className="toggle">
                {G.wakeChance}
                <input type="number" min={0} max={100} aria-label={G.wakeChanceLabel} value={plan.dragonWakeChance} style={{ width: '4em' }}
                  onChange={(e: { target: { value: string } }) => setDragonChance(Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))))} />
              </label>
            )}
          </div>
          <div className="map-thumb-wrap">
            <img className="map-thumb" src={`${BASE}${variant.image}`} alt={`${map.name} — ${variantLabel(variant, getLang())}`} />
            {manual && (
              <svg className="thumb-hexes" viewBox={`0 0 ${worldOf(map.size).w} ${worldOf(map.size).h}`} role="img" aria-label={G.civPlacementLabel}>
                {allHexes(map.size).map((h) => {
                  const bad = civilianHexProblem(map.id, variant.id, plan.mirrored, h);
                  const idx = civilianHexes.findIndex((x) => x.col === h.col && x.row === h.row);
                  const c = hexCenter(h);
                  return (
                    <g key={`${h.col},${h.row}`} onClick={() => toggleCivilian(h)} className={idx >= 0 ? 'civ on' : bad ? 'civ bad' : 'civ ok'}>
                      <polygon points={hexPoints(h)}><title>{bad ?? (idx >= 0 ? G.civRemove : G.civPlace)}</title></polygon>
                      {idx >= 0 && <text x={c.x} y={c.y + 12}>M{idx + 1}</text>}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          {manual && <p className="mute">{G.manualNote(civilianHexes.length, plan.civilians)}</p>}
        </section>

        <section className="panel">
          <h2>{G.enemies(plan.enemies.reduce((n, e) => n + e.count, 0))}</h2>
          <div className="monster-filter">
            <input className="monster-search" type="search" placeholder={G.search(pool.length)} aria-label={G.searchLabel}
              value={query} onChange={(e: { target: { value: string } }) => setQuery(e.target.value)} />
            <details className="tier-filter">
              <summary aria-label={G.tier}>{G.tierSummary(tierFilter.length === 0 ? L.common.all : TIERS.filter((x) => tierFilter.includes(x.id)).map((x) => tierName(x.id)).join(', '))}</summary>
              <div className="tier-options" role="group" aria-label={G.tierOptions}>
                {TIERS.map((t) => (
                  <label key={t.id} className="toggle">
                    <input type="checkbox" checked={tierFilter.includes(t.id)}
                      onChange={(e: { target: { checked: boolean } }) => setTierFilter((f) => (e.target.checked ? [...f, t.id] : f.filter((x) => x !== t.id)))} />
                    {tierName(t.id)} <small>({t.label})</small>
                  </label>
                ))}
                {tierFilter.length > 0 && <button className="ghost" onClick={() => setTierFilter([])}>{L.common.all}</button>}
              </div>
            </details>
            <label className="toggle">
              <input type="checkbox" aria-label={G.allMonsters} checked={allMonsters}
                onChange={(e: { target: { checked: boolean } }) => setAllMonsters(e.target.checked)} /> {G.allMonsters}
            </label>
          </div>
          <p className="mute monster-scope">{allMonsters ? G.scopeAll(all.length) : G.scopeMap(map.name, pool.length)}</p>
          <div className="monster-list">
            {tiers.map(({ tier, list }) => [
              <h3 key={`k-${tier.id}`} className="monster-tier">{tierName(tier.id)} <small>({tier.label}) · {list.length}</small></h3>,
              ...list.map((m) => (
              <div className="monster-row" key={m.id}>
                <span><b>{m.name}</b>{winterPick(m.id, variant.id) && <span className="winter" title={G.winter}> ❄</span>} <small>CR {m.cr} · HP {m.hp} · AC {m.ac}{monsterEnv(m.id) ? ` · ${monsterEnv(m.id)?.tema}` : ''}</small></span>
                {customs.includes(m) && (confirmDelete === m.id
                  ? <span className="confirm">
                      <button className="danger" onClick={() => {
                        setCustoms((c) => c.filter((x) => x.id !== m.id));
                        setCounts((c) => { const n = { ...c }; delete n[m.id]; return n; });
                        setConfirmDelete(null);
                      }}>{L.common.confirmDelete}</button>
                      <button className="ghost" onClick={() => setConfirmDelete(null)}>{L.common.cancel}</button>
                    </span>
                  : <button className="ghost" aria-label={G.del(m.name)} onClick={() => setConfirmDelete(m.id)}>{L.common.delete}</button>)}
                <span className="stepper">
                  <button aria-label={G.dec(m.name)} onClick={() => setCount(m.id, (counts[m.id] ?? 0) - 1)}>−</button>
                  <b>{counts[m.id] ?? 0}</b>
                  <button aria-label={G.inc(m.name)} onClick={() => setCount(m.id, (counts[m.id] ?? 0) + 1)}>+</button>
                </span>
              </div>
              )),
            ])}
          </div>
          <button className="ghost" onClick={() => setShowCustom((x) => !x)}>{G.customToggle(showCustom)}</button>
          {showCustom && (
            <div className="custom-monster">
              <div className="form-row">
                <label>{G.custom.name} <input value={draft.name} maxLength={CUSTOM_NAME_MAX}
                  onChange={(e: { target: { value: string } }) => setDraft({ ...draft, name: e.target.value.slice(0, CUSTOM_NAME_MAX) })} />
                  <small className="counter" aria-live="polite" aria-label={G.custom.nameCount(draft.name.length, CUSTOM_NAME_MAX)}>{draft.name.length}/{CUSTOM_NAME_MAX}</small></label>
                <label>{G.custom.ac} <input type="number" value={draft.ac} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, ac: num(e.target.value) })} /></label>
                <label>{G.custom.hp} <input type="number" value={draft.hp} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, hp: num(e.target.value) })} /></label>
                <label>{G.custom.speed} <input type="number" step={5} value={draft.speed} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, speed: num(e.target.value) })} /></label>
              </div>
              <div className="form-row">
                <label>{G.custom.attack} <input value={draft.attackName} maxLength={CUSTOM_ATTACK_MAX}
                  onChange={(e: { target: { value: string } }) => setDraft({ ...draft, attackName: e.target.value.slice(0, CUSTOM_ATTACK_MAX) })} />
                  <small className="counter" aria-live="polite">{draft.attackName.length}/{CUSTOM_ATTACK_MAX}</small></label>
                <label>{G.custom.bonus} <input type="number" value={draft.attackBonus} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, attackBonus: num(e.target.value) })} /></label>
                <label>{G.custom.damage} <input value={draft.damage} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, damage: e.target.value })} /></label>
                <label>{G.custom.type}
                  <select value={draft.damageType} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, damageType: e.target.value })}>
                    {['slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'poison', 'acid', 'lightning', 'necrotic', 'radiant', 'psychic', 'thunder', 'force'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="toggle"><input type="checkbox" checked={draft.ranged} onChange={(e: { target: { checked: boolean } }) => setDraft({ ...draft, ranged: e.target.checked })} /> {G.custom.ranged}</label>
              </div>
              <div className="form-row">
                <label>{G.custom.cr}
                  <select aria-label={G.custom.cr} value={draft.cr ?? ''} onChange={(e: { target: { value: string } }) => {
                    const { cr: _old, ...rest } = draft;
                    setDraft(e.target.value === '' ? rest : { ...rest, cr: e.target.value });
                  }}>
                    <option value="">{G.custom.auto(draftCr?.cr ?? '?')}</option>
                    {CR_STEPS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <small className="mute">{draftCr ? G.custom.estimate(draftCr.defensive, draftCr.offensive, draftCr.cr) : G.custom.noEstimate}</small>
              </div>
              {draftProblems.length > 0 && <p className="error">{draftProblems.join(' ')}</p>}
              <button disabled={draftProblems.length > 0} onClick={() => {
                const m = customMonster(draft, `ozel-${newId()}`);
                setCustoms((c) => [...c, m]);
                setCount(m.id, 1);
                setDraft(blankMonster());
                setShowCustom(false);
              }}>{G.custom.add}</button>
            </div>
          )}
        </section>

        <section className="panel">
          {problems.length > 0 && <ul className="problems">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
          <label className="dice-mode">{D.mode.label}{' '}
            <select aria-label={D.mode.label} value={diceMode} onChange={(e: { target: { value: string } }) => setDiceMode(e.target.value as DiceMode)}>
              {DICE_MODES.map((m) => <option key={m} value={m}>{D.mode[m]}</option>)}
            </select>
          </label>
          {diceMode !== 'auto' && <p className="mute">{D.mode.note}</p>}
          <button className="cta" disabled={problems.length > 0}
            onClick={() => {
              // Masum görünümü tohumu bir kez seçilir: elle zar girilince kurulum aynı tohumla yeniden çalışır.
              const seed = Math.floor(Math.random() * 1e9);
              const participants = planParticipants(plan);
              starting.current = participants;
              dice.play((rng) => createMapBattle(participants, { ...plan, civilianArtSeed: seed, diceMode }, rng));
            }}>{G.setup}</button>
          {dice.pending && (
            <DicePrompt key={dice.pending.step} request={dice.pending.request}
              whoName={starting.current.find((c) => c.id === dice.pending?.request.by)?.name ?? null}
              onEnter={dice.enter} onAuto={dice.autoRoll} onCancel={dice.cancel} />
          )}
        </section>
      </main>
    </div>
  );
}
