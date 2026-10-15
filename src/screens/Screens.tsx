/**
 * Bütünleşik uygulamanın ekranları (Adım 13): giriş (rol seçimi), oyuncu (kayıtlı
 * karakterler), GM (savaş kurma) ve durum. Tek cihaz: rol seçimi yalnızca hangi ekranın
 * açılacağını belirler; online sürüm sonra.
 */
import { useMemo, useState } from 'react';
import { classes, monsters, races, type Monster } from '../data';
import { sheetAvatar } from '../battle';
import { maps } from '../map/maps';
import { optionalRules } from '../battle/maprules';
import { blankCharacter, characterProblems, type SavedCharacter } from '../rules/builder';
import { deriveStats } from '../rules/stats';
import { DEMO_SHEETS } from '../demo';
import {
  createMapBattle, customMonster, customMonsterProblems, planParticipants, planProblems, type CustomMonsterInput,
} from '../app/setup';
import { newId } from '../app/storage';
import { AvatarBadge } from '../ui/Avatar';
import { ThemeButton } from '../ui/theme';
import type { Session } from '../ui/session';
import gorev from '../../docs/harita/GOREV.md?raw';

const BASE = import.meta.env.BASE_URL;
const raceName = (id: string) => races.find((r) => r.id === id)?.name ?? id;
const className = (id: string) => classes.find((c) => c.id === id)?.name ?? id;

export function Home(props: { onPlayer: () => void; onGm: () => void; onStatus: () => void }) {
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
          <button className="ghost" onClick={props.onStatus}>Durum</button>
        </div>
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
}) {
  const ready = props.characters.filter((c) => characterProblems(c).length === 0);
  // Seçim yapılana kadar ilk dört hazır karakter (sonradan eklenenler de) partide.
  const [chosen, setParty] = useState<string[] | null>(null);
  const party = chosen ?? ready.slice(0, 4).map((c) => c.id);
  const [counts, setCounts] = useState<Record<string, number>>({ wolf: 2 });
  const [customs, setCustoms] = useState<Monster[]>([]);
  const [draft, setDraft] = useState<CustomMonsterInput>(BLANK_MONSTER);
  const [showCustom, setShowCustom] = useState(false);
  const [mapId, setMapId] = useState(maps[0]?.id ?? '');
  const map = maps.find((m) => m.id === mapId) ?? maps[0];
  const [variantId, setVariantId] = useState(map?.variants[0]?.id ?? '');
  const variant = map?.variants.find((v) => v.id === variantId) ?? map?.variants[0];
  const [mirrored, setMirrored] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [civilians, setCivilians] = useState(4);
  const all = useMemo(() => [...monsters, ...customs], [customs]);
  if (!map || !variant) return null;
  const optional = optionalRules(map.id, variant.id);
  const plan = {
    party: ready.filter((c) => party.includes(c.id)).map((c) => ({ id: c.id, sheet: c.sheet })),
    enemies: all.filter((m) => (counts[m.id] ?? 0) > 0).map((m) => ({ monster: m, count: counts[m.id] ?? 0 })),
    mapId: map.id, variantId: variant.id, mirrored: map.mirrorable && mirrored,
    options: options.filter((o) => optional.some((r) => r.id === o)), civilians,
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
          <div className="monster-list">
            {all.map((m) => (
              <div className="monster-row" key={m.id}>
                <span><b>{m.name}</b> <small>CR {m.cr} · HP {m.hp} · AC {m.ac}</small></span>
                <span className="stepper">
                  <button aria-label={`${m.name} azalt`} onClick={() => setCount(m.id, (counts[m.id] ?? 0) - 1)}>−</button>
                  <b>{counts[m.id] ?? 0}</b>
                  <button aria-label={`${m.name} artır`} onClick={() => setCount(m.id, (counts[m.id] ?? 0) + 1)}>+</button>
                </span>
              </div>
            ))}
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
            <select aria-label="Varyant" value={variant.id} onChange={(e: { target: { value: string } }) => { setVariantId(e.target.value); setOptions([]); }}>
              {map.variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <label className="toggle">
              <input type="checkbox" disabled={!map.mirrorable} checked={mirrored} onChange={(e: { target: { checked: boolean } }) => setMirrored(e.target.checked)} />
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
              <select aria-label="Masum sayısı" value={civilians} onChange={(e: { target: { value: string } }) => setCivilians(Number(e.target.value))}>
                {[4, 5, 6].map((n) => <option key={n} value={n}>{n} masum</option>)}
              </select>
            )}
          </div>
          <img className="map-thumb" src={`${BASE}${variant.image}`} alt={`${map.name} — ${variant.name}`} style={plan.mirrored ? { transform: 'scaleX(-1)' } : undefined} />
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
  const all = md.split('\n');
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
      </main>
    </div>
  );
}
