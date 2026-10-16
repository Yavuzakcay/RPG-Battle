/**
 * Bütünleşik uygulamanın ekranları (Adım 13): giriş (rol seçimi), oyuncu (kayıtlı
 * karakterler), GM (savaş kurma) ve durum. Tek cihaz: rol seçimi yalnızca hangi ekranın
 * açılacağını belirler; online sürüm sonra.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { classes, monsters, races, type Monster } from '../data';
import { sheetAvatar } from '../battle';
import type { DragonWakeMode } from '../battle/types';
import { getMap, maps } from '../map/maps';
import { TIERS, crNumber, fitsMap, monsterEnv, tierOf, winterPick } from '../data/monsterEnv';
import { optionalRules } from '../battle/maprules';
import { blankCharacter, characterProblems, type SavedCharacter } from '../rules/builder';
import { deriveStats } from '../rules/stats';
import { DEMO_SHEETS } from '../demo';
import {
  createMapBattle, customMonster, customMonsterProblems, planParticipants, planProblems, type CustomMonsterInput,
  civilianHexProblem, civilianRule, dragonSetup, maxCivilians, mirrorHexes, type CivilianPlacement,
} from '../app/setup';
import { VIEW, allHexes, hexCenter, hexPoints } from '../ui/mapView';
import type { Offset } from '../rules/hex';
import { newId } from '../app/storage';
import { AvatarBadge } from '../ui/Avatar';
import { ThemeButton } from '../ui/theme';
import type { Session } from '../ui/session';
import gorev from '../../docs/harita/GOREV.md?raw';

const BASE = import.meta.env.BASE_URL;
const raceName = (id: string) => races.find((r) => r.id === id)?.name ?? id;
const className = (id: string) => classes.find((c) => c.id === id)?.name ?? id;

export function Home(props: { onPlayer: () => void; onGm: () => void; onStatus: () => void; onResume?: () => void; resumeError?: string | null }) {
  return (
    <div className="menu-screen">
      <main className="app home">
        <header>
          <h1>RPG Battle</h1>
          <ThemeButton />
        </header>
        <p className="mute">5E uyumlu altıgen haritalı savaş. Tek cihaz: rolünü seç.</p>
        <div className="roles">
          <button className="role" onClick={props.onPlayer}>
            <strong>Oyuncu</strong><span>Karakter oluştur, kayıtlı karakterlerin</span>
          </button>
          <button className="role" onClick={props.onGm}>
            <strong>GM</strong><span>Düşmanları ve haritayı seç, savaşı kur ve yönet</span>
          </button>
        </div>
        <div className="gm-row">
          {props.onResume && <button onClick={props.onResume}>Kayıtlı savaşa devam et</button>}
          <button className="ghost" onClick={props.onStatus}>Durum</button>
        </div>
        {props.resumeError && <p className="error">{props.resumeError}</p>}
      </main>
    </div>
  );
}

/** Kayıtlı karakter kartı: avatar, tür/sınıf/seviye, HP ve AC. */
function CharacterCard(props: { c: SavedCharacter; children?: React.ReactNode }) {
  const { sheet } = props.c;
  const problems = characterProblems(props.c);
  let line = '';
  try {
    const d = deriveStats(sheet);
    line = `HP ${d.maxHp} · AC ${d.ac} · hız ${d.speed} ft`;
  } catch {
    line = 'eksik';
  }
  return (
    <div className="char-card">
      <AvatarBadge avatar={sheetAvatar(sheet)} size={44} ring="var(--party)" />
      <div>
        <strong>{sheet.name || '(adsız)'}</strong>
        <small>{raceName(sheet.raceId)} {className(sheet.classId)}, {sheet.level}. seviye · {line}</small>
        {problems.length > 0 && <small className="error">{problems.length} sorun</small>}
      </div>
      <div className="card-actions">{props.children}</div>
    </div>
  );
}

export function PlayerScreen(props: {
  characters: SavedCharacter[]; onEdit: (c: SavedCharacter) => void; onDelete: (id: string) => void;
  onAddDemo: () => void; onBack: () => void;
}) {
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <div className="menu-screen">
      <main className="app">
        <header>
          <h1>Karakterlerim</h1>
          <button className="ghost" onClick={props.onBack}>Ana ekran</button>
        </header>
        <section className="panel">
          <div className="gm-row">
            <button onClick={() => props.onEdit(blankCharacter(newId()))}>Yeni karakter</button>
            <button className="ghost" onClick={props.onAddDemo}>Örnek karakterleri ekle</button>
          </div>
          {props.characters.length === 0 && <p className="mute">Henüz karakter yok.</p>}
          {props.characters.map((c) => (
            <CharacterCard key={c.id} c={c}>
              <button onClick={() => props.onEdit(c)}>Düzenle</button>
              {confirm === c.id
                ? <button className="danger" onClick={() => { props.onDelete(c.id); setConfirm(null); }}>Silinsin mi? Evet</button>
                : <button className="ghost" onClick={() => setConfirm(c.id)}>Sil</button>}
            </CharacterCard>
          ))}
        </section>
      </main>
    </div>
  );
}

/**
 * Örnek karakterler: demo savaşındaki Mira ve Bor'un oluşturucu kurallarına uyan kopyaları
 * (standart dizi; Mira'nın listesindeki Cure Wounds wizard büyüsü olmadığı için yok).
 */
export function demoCharacters(): SavedCharacter[] {
  const { MIRA, BOR } = DEMO_SHEETS;
  return [
    {
      id: newId(), method: 'standard', classSkills: ['arcana', 'investigation'], otherSkills: ['history', 'insight', 'perception'],
      sheet: {
        ...MIRA, baseScores: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
        spellNames: (MIRA.spellNames ?? []).filter((n) => n !== 'Cure Wounds'),
        skills: ['arcana', 'investigation', 'history', 'insight', 'perception'],
      },
    },
    {
      id: newId(), method: 'standard', classSkills: ['athletics', 'perception'], otherSkills: ['intimidation', 'survival'],
      sheet: { ...BOR, baseScores: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 } },
    },
  ];
}

const BLANK_MONSTER: CustomMonsterInput = {
  name: '', ac: 12, hp: 15, speed: 30, attackName: 'Saldırı', attackBonus: 3, damage: '1d6+1', damageType: 'slashing', ranged: false,
};

/** "Hazır savaş": örnek karakterler, harita ve canavarlar (GM tek tıkla kurar). */
export const READY_BATTLE = { mapId: 'col', variantId: 'gunduz', enemies: { troll: 1, wolf: 2 } as Record<string, number> };

export function GmScreen(props: {
  characters: SavedCharacter[]; onStart: (s: Session) => void; onBack: () => void; onAddCharacters: (list: SavedCharacter[]) => void;
  /** Açılışta seçili harita, varyant ve ejderha uyandırma kipi (testler ve kısayollar için). */
  initial?: { mapId?: string; variantId?: string; dragonWake?: DragonWakeMode; allMonsters?: boolean };
}) {
  const ready = props.characters.filter((c) => characterProblems(c).length === 0);
  // Seçim yapılana kadar ilk dört hazır karakter (sonradan eklenenler de) partide.
  const [chosen, setParty] = useState<string[] | null>(null);
  const party = chosen ?? ready.slice(0, 4).map((c) => c.id);
  const [counts, setCounts] = useState<Record<string, number>>({ wolf: 2 });
  const [customs, setCustoms] = useState<Monster[]>([]);
  const [draft, setDraft] = useState<CustomMonsterInput>(BLANK_MONSTER);
  const [showCustom, setShowCustom] = useState(false);
  const [mapId, setMapId] = useState(props.initial?.mapId ?? maps[0]?.id ?? '');
  const map = maps.find((m) => m.id === mapId) ?? maps[0];
  const [variantId, setVariantId] = useState(props.initial?.variantId ?? map?.variants[0]?.id ?? '');
  const variant = map?.variants.find((v) => v.id === variantId) ?? map?.variants[0];
  // Aynalanabilirlik varyantın düzenine bağlı olabilir (Dağ yaz/kış).
  const mirrorable = map && variant ? getMap(map.id, { variantId: variant.id }).mirrorable : false;
  const [mirrored, setMirrored] = useState(false);
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
  const pool = useMemo(() => (allMonsters ? all : all.filter((m) => fitsMap(m.id, mapId))), [all, allMonsters, mapId]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cr = /^cr\s*(\S+)$/.exec(q)?.[1];
    const hit = (m: Monster) => (q ? (cr ? m.cr === cr : m.name.toLowerCase().includes(q)) : pool.includes(m));
    // Kış varyantında (Dağ kış) soğuk iklim canavarları her kademenin başında.
    const cold = (m: Monster) => (winterPick(m.id, variant?.id ?? '') ? 0 : 1);
    return all.filter((m) => (counts[m.id] ?? 0) > 0 || (pool.includes(m) && hit(m)))
      .sort((a, b) => cold(a) - cold(b) || crNumber(a.cr) - crNumber(b.cr) || a.name.localeCompare(b.name));
  }, [all, pool, query, counts, variant]);
  const tiers = TIERS.map((t) => ({ tier: t, list: shown.filter((m) => tierOf(m.cr) === t) })).filter((g) => g.list.length > 0);
  if (!map || !variant) return null;
  const optional = optionalRules(map.id, variant.id);
  const plan = {
    party: ready.filter((c) => party.includes(c.id)).map((c) => ({ id: c.id, sheet: c.sheet })),
    enemies: all.filter((m) => (counts[m.id] ?? 0) > 0).map((m) => ({ monster: m, count: counts[m.id] ?? 0 })),
    mapId: map.id, variantId: variant.id, mirrored: mirrorable && mirrored,
    options: options.filter((o) => optional.some((r) => r.id === o)),
    civilians: Math.min(civilians, maxCivilians(map.id, variant.id, mirrorable && mirrored)),
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
  // Hazır savaş: örnek karakterler (yoksa eklenir), Çöl gündüz, bir Troll ve iki Wolf.
  const readyBattle = () => {
    const names = demoCharacters().map((c) => c.sheet.name);
    let picked = ready.filter((c) => names.includes(c.sheet.name));
    if (picked.length < names.length) {
      const added = demoCharacters().filter((c) => !picked.some((p) => p.sheet.name === c.sheet.name));
      props.onAddCharacters(added);
      picked = [...picked, ...added];
    }
    setParty(picked.map((c) => c.id));
    setCounts({ ...READY_BATTLE.enemies });
    setMapId(READY_BATTLE.mapId);
    setVariantId(READY_BATTLE.variantId);
    setMirrored(false);
    setOptions([]);
  };
  const setCount = (id: string, n: number) => setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(12, n)) }));
  const num = (v: string) => Number(v);

  return (
    <div className="menu-screen">
      <main className="app wide">
        <header>
          <h1>GM: savaşı kur</h1>
          <button onClick={readyBattle}>Hazır savaş</button>
          <button className="ghost" onClick={props.onBack}>Ana ekran</button>
        </header>

        <section className="panel">
          <h2>Parti ({plan.party.length})</h2>
          {ready.length === 0 && (
            <p className="mute">Hazır karakter yok. Oyuncu ekranından oluşturun ya da "Hazır savaş"ı seçin.</p>
          )}
          <div className="chips">
            {ready.map((c) => (
              <label key={c.id} className={`chip${party.includes(c.id) ? ' on' : ''}`}>
                <input type="checkbox" checked={party.includes(c.id)}
                  onChange={(e: { target: { checked: boolean } }) => setParty(e.target.checked ? [...party, c.id] : party.filter((x) => x !== c.id))} />
                {c.sheet.name} ({className(c.sheet.classId)} {c.sheet.level})
              </label>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Düşmanlar ({plan.enemies.reduce((n, e) => n + e.count, 0)})</h2>
          <div className="monster-filter">
            <input className="monster-search" type="search" placeholder={`Ara: ad ya da "CR 5" (${pool.length} canavar)`} aria-label="Canavar ara"
              value={query} onChange={(e: { target: { value: string } }) => setQuery(e.target.value)} />
            <label className="toggle">
              <input type="checkbox" aria-label="Tüm canavarlar" checked={allMonsters}
                onChange={(e: { target: { checked: boolean } }) => setAllMonsters(e.target.checked)} /> Tüm canavarlar
            </label>
          </div>
          <p className="mute monster-scope">{allMonsters ? `Tüm canavarlar (${all.length})` : `${map.name} haritasına uyanlar (${pool.length}); seçilenler hep listede.`}</p>
          <div className="monster-list">
            {tiers.map(({ tier, list }) => [
              <h3 key={`k-${tier.id}`} className="monster-tier">{tier.name} <small>({tier.label}) · {list.length}</small></h3>,
              ...list.map((m) => (
              <div className="monster-row" key={m.id}>
                <span><b>{m.name}</b>{winterPick(m.id, variant.id) && <span className="winter" title="Kış canavarı"> ❄</span>} <small>CR {m.cr} · HP {m.hp} · AC {m.ac}{monsterEnv(m.id) ? ` · ${monsterEnv(m.id)?.tema}` : ''}</small></span>
                <span className="stepper">
                  <button aria-label={`${m.name} azalt`} onClick={() => setCount(m.id, (counts[m.id] ?? 0) - 1)}>−</button>
                  <b>{counts[m.id] ?? 0}</b>
                  <button aria-label={`${m.name} artır`} onClick={() => setCount(m.id, (counts[m.id] ?? 0) + 1)}>+</button>
                </span>
              </div>
              )),
            ])}
          </div>
          <button className="ghost" onClick={() => setShowCustom((x) => !x)}>{showCustom ? 'Özel canavarı kapat' : 'Özel canavar ekle'}</button>
          {showCustom && (
            <div className="custom-monster">
              <div className="form-row">
                <label>Ad <input value={draft.name} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, name: e.target.value })} /></label>
                <label>AC <input type="number" value={draft.ac} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, ac: num(e.target.value) })} /></label>
                <label>HP <input type="number" value={draft.hp} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, hp: num(e.target.value) })} /></label>
                <label>Hız <input type="number" step={5} value={draft.speed} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, speed: num(e.target.value) })} /></label>
              </div>
              <div className="form-row">
                <label>Saldırı <input value={draft.attackName} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, attackName: e.target.value })} /></label>
                <label>Bonus <input type="number" value={draft.attackBonus} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, attackBonus: num(e.target.value) })} /></label>
                <label>Hasar <input value={draft.damage} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, damage: e.target.value })} /></label>
                <label>Tür
                  <select value={draft.damageType} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, damageType: e.target.value })}>
                    {['slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'poison', 'acid', 'lightning', 'necrotic', 'radiant', 'psychic', 'thunder', 'force'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="toggle"><input type="checkbox" checked={draft.ranged} onChange={(e: { target: { checked: boolean } }) => setDraft({ ...draft, ranged: e.target.checked })} /> Menzilli (80/320 ft)</label>
              </div>
              {draftProblems.length > 0 && <p className="error">{draftProblems.join(' ')}</p>}
              <button disabled={draftProblems.length > 0} onClick={() => {
                const m = customMonster(draft, `ozel-${newId()}`);
                setCustoms((c) => [...c, m]);
                setCount(m.id, 1);
                setDraft(BLANK_MONSTER);
                setShowCustom(false);
              }}>Listeye ekle</button>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Harita</h2>
          <div className="gm-row">
            <select aria-label="Harita" value={map.id} onChange={(e: { target: { value: string } }) => {
              const next = maps.find((m) => m.id === e.target.value);
              setMapId(e.target.value); setVariantId(next?.variants[0]?.id ?? ''); setMirrored(false); setOptions([]);
            }}>
              {maps.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {/* Varyantlar hep görünür düğmeler (açılır listede "Uyuyan ejderha" gibi varyantlar gözden kaçıyordu). */}
            <div className="chips variant-chips" role="radiogroup" aria-label="Varyant">
              {map.variants.map((v) => (
                <label key={v.id} className={`chip${v.id === variant.id ? ' on' : ''}`}>
                  <input type="radio" name="variant" value={v.id} checked={v.id === variant.id}
                    onChange={() => { setVariantId(v.id); setOptions([]); }} />
                  {v.name}{dragonSetup(map.id, v.id) ? ' 🐉' : ''}
                </label>
              ))}
            </div>
            <label className="toggle">
              <input type="checkbox" disabled={!mirrorable} checked={mirrored} onChange={(e: { target: { checked: boolean } }) => {
                setMirrored(e.target.checked);
                // Elle konan masumlar zeminle birlikte aynalanır.
                setCivilianHexes((hs) => mirrorHexes(hs));
              }} />
              Aynala
            </label>
            {optional.map((r) => (
              <label className="toggle" key={r.id}>
                <input type="checkbox" checked={options.includes(r.id)}
                  onChange={(e: { target: { checked: boolean } }) => setOptions((o) => (e.target.checked ? [...o, r.id] : o.filter((x) => x !== r.id)))} />
                {r.id === 'darkness' ? 'Karanlık' : r.id === 'objective' ? 'Masumları koru' : r.id}
              </label>
            ))}
            {options.includes('objective') && (
              <span className="stepper" aria-label="Masum sayısı">
                <button aria-label="Masum azalt" disabled={plan.civilians <= 0}
                  onClick={() => { setCivilians(Math.max(0, plan.civilians - 1)); setCivilianHexes((hs) => hs.slice(0, Math.max(0, plan.civilians - 1))); }}>−</button>
                <b>{plan.civilians} masum</b>
                <button aria-label="Masum artır" disabled={plan.civilians >= civilianMax}
                  onClick={() => setCivilians(Math.min(civilianMax, plan.civilians + 1))}>+</button>
              </span>
            )}
            {options.includes('objective') && (
              <select aria-label="Masumların yeri" value={civilianPlacement}
                onChange={(e: { target: { value: string } }) => setCivilianPlacement(e.target.value as CivilianPlacement)}>
                <option value="far">Otomatik, düşmandan en uzak</option>
                <option value="middle">Ortada</option>
                <option value="random">Rastgele</option>
                <option value="manual">Elle (haritaya dokun)</option>
              </select>
            )}
            {options.includes('objective') && civilianPlacement === 'random' && (
              <button onClick={() => setCivilianSeed(1 + Math.floor(Math.random() * 1e9))}>Yeniden at</button>
            )}
            {options.includes('objective') && (
              <label className="toggle" title="Kapalıyken masum ölümü bilgi amaçlıdır; GM hikâyede işler.">
                <input type="checkbox" checked={strictObjective}
                  onChange={(e: { target: { checked: boolean } }) => setStrictObjective(e.target.checked)} />
                Masumların yarısı ölürse kaybedilir (sıkı kural)
              </label>
            )}
            {dragonConf && (
              <select aria-label="Ejderha" value={plan.dragon} onChange={(e: { target: { value: string } }) => setDragon(e.target.value)}>
                {dragonConf.dragons.map((id) => <option key={id} value={id}>Uyuyan: {monsters.find((m) => m.id === id)?.name ?? id}</option>)}
              </select>
            )}
            {dragonConf && (
              <select aria-label="Ejderhayı uyandırma (yapay zekâ düşmanları)" value={plan.dragonWake}
                title="Yalnızca yapay zekânın yönettiği düşmanlar için. GM elle yönetirken ve oyuncular için kısıt yok."
                onChange={(e: { target: { value: string } }) => setDragonWake(e.target.value as DragonWakeMode)}>
                <option value="never">Düşmanlar ejderhayı asla uyandırmaz</option>
                <option value="chance">Düşmanlar şansa bağlı uyandırır</option>
                <option value="gm">Yalnızca GM uyandırır (düğme)</option>
              </select>
            )}
            {dragonConf && plan.dragonWake === 'chance' && (
              <label className="toggle">
                Her düşman turunda %
                <input type="number" min={0} max={100} aria-label="Uyandırma yüzdesi" value={plan.dragonWakeChance} style={{ width: '4em' }}
                  onChange={(e: { target: { value: string } }) => setDragonChance(Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))))} />
              </label>
            )}
          </div>
          <div className="map-thumb-wrap">
            <img className="map-thumb" src={`${BASE}${variant.image}`} alt={`${map.name} — ${variant.name}`} style={plan.mirrored ? { transform: 'scaleX(-1)' } : undefined} />
            {manual && (
              <svg className="thumb-hexes" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label="Masum yerleşimi">
                {allHexes().map((h) => {
                  const bad = civilianHexProblem(map.id, variant.id, plan.mirrored, h);
                  const idx = civilianHexes.findIndex((x) => x.col === h.col && x.row === h.row);
                  const c = hexCenter(h);
                  return (
                    <g key={`${h.col},${h.row}`} onClick={() => toggleCivilian(h)} className={idx >= 0 ? 'civ on' : bad ? 'civ bad' : 'civ ok'}>
                      <polygon points={hexPoints(h)}><title>{bad ?? (idx >= 0 ? 'Masumu kaldır' : 'Masum koy')}</title></polygon>
                      {idx >= 0 && <text x={c.x} y={c.y + 12}>M{idx + 1}</text>}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          {manual && <p className="mute">Elle yerleşim: {civilianHexes.length}/{plan.civilians} masum. Boş altıgene dokun, masuma dokununca kalkar. Engel, lav, alev, batak, tuzak ve düşman başlangıç bölgesi geçersiz.</p>}
        </section>

        <section className="panel">
          {problems.length > 0 && <ul className="problems">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
          <button className="cta" disabled={problems.length > 0}
            onClick={() => props.onStart(createMapBattle(planParticipants(plan), plan, Math.random))}>Savaşı kur</button>
        </section>
      </main>
    </div>
  );
}

/** GOREV.md'deki adımlar ve durumları: satırda "(tamam)" yazanlar tamam. */
export function parseStatus(md: string): Array<{ id: string; title: string; done: boolean }> {
  const out: Array<{ id: string; title: string; done: boolean }> = [];
  // Yalnızca "## Adımlar" bölümü (bir sonraki "## " başlığına kadar); başlık yoksa bütün metin.
  const all = md.split(/\r?\n/);
  const from = all.findIndex((l) => l.startsWith('## Adımlar'));
  const rest = from === -1 ? all : all.slice(from + 1);
  const to = rest.findIndex((l) => l.startsWith('## '));
  for (const line of to === -1 ? rest : rest.slice(0, to)) {
    const m = /^(\d+[a-z]?)\.\s+(.*)$/.exec(line) ?? /^- \*\*([A-Z])\)\s*(.*)$/.exec(line);
    if (!m) continue;
    const text = (m[2] ?? '').replace(/\*\*/g, '');
    const title = (text.split(/[:.(]/)[0] ?? text).trim();
    out.push({ id: m[1] ?? '', title, done: /\(tamam\)/i.test(line) });
  }
  return out;
}

export function StatusScreen(props: { onBack: () => void }) {
  const steps = parseStatus(gorev);
  const done = steps.filter((s) => s.done).length;
  return (
    <div className="menu-screen">
      <main className="app">
        <header>
          <h1>Durum</h1>
          <button className="ghost" onClick={props.onBack}>Ana ekran</button>
        </header>
        <section className="panel">
          <p>{done} / {steps.length} adım tamam (kaynak: docs/harita/GOREV.md).</p>
          <ul className="status-list">
            {steps.map((s) => (
              <li key={s.id} className={s.done ? 'done' : 'todo'}>
                <span>{s.done ? '✓' : '○'}</span> <b>{s.id}</b> {s.title}
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h2>Haritalar ({maps.length})</h2>
          <ul className="status-list">
            {maps.map((m) => <li key={m.id}><b>{m.name}</b> {m.variants.map((v) => v.name).join(', ')}</li>)}
          </ul>
        </section>
      </main>
    </div>
  );
}
