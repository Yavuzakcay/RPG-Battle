/**
 * Görev SD3: "Sınıf güçlerin" paneli (Karakter adımı). Eski ansiklopedi listesinin yerine: kararı olan güçler (seçenek,
 * büyü seçimi) ve en yeni güçler ana listede (en çok 6), kalanı "Diğer güçler" altında; her güç düz Türkçe ad + tek
 * cümle; İngilizce kural adı ⓘ'de; "çalışır / kısmi" etiketi ve renk lejandı yok, yalnız oyunda henüz olmayanlarda
 * küçük "yakında". Seçim kuralları (Metamagic, Invocation, Wild Shape sayıları) aynı; tamamlanmamışsa bölüm açık gelir.
 */
import { useEffect, useState } from 'react';
import { eligibleForms, shapeLimits } from '../../battle/druid';
import { eligibleCantrips, invocationKit, invocationSlots, LESSON_FEATS, parseInvocation } from '../../rules/invocations';
import { loadMonsters, monsters, monstersLoaded, spells, weapons } from '../../data';
import { featureSummary } from '../../ui/descriptions';
import { describeTr } from '../../ui/trDesc';
import { monsterAvatar } from '../../battle/avatar';
import { AvatarBadge } from '../../ui/Avatar';
import { classKit, gainedFeatures, missingFeatures } from '../../rules/classFeatures';
import { findSubclass } from '../../rules/subclasses';
import { wishPickKey } from '../../battle/paket/bag';
import { getLang, t } from '../../i18n';
import { Fold, InfoPop, InfoTip } from './shared';

export function InvocationPicker(props: { classId: string; level: number; invocations: string[]; onInvocations: (ids: string[]) => void; known: string[];
  weapons: string[]; pactWeapon?: string; onPact: (w: string) => void }) {
  const T = t().builder;
  const slots = invocationSlots(props.classId, props.level);
  if (!slots || slots.count === 0) return null;
  const chosen = props.invocations;
  const ids = chosen.map((x) => parseInvocation(x)[0]);
  const full = chosen.length >= slots.count;
  const pactBlade = invocationKit(props.classId, props.level, chosen).pactWeapon;
  const melee = props.weapons.filter((n) => !weapons.find((w) => w.name === n)?.ranged);
  return (
    <Fold title={t().builder.wiz.invocationFold(slots.count, chosen.length)} open={chosen.length < slots.count} className="invocation-fold">
    <div className="metamagic-pick invocation-pick">
      {slots.list.filter((v) => v.minLevel <= props.level).map((v) => {
        const mine = chosen.filter((x) => parseInvocation(x)[0] === v.id);
        const on = mine.length > 0;
        const blocked = !!v.requires && !ids.includes(v.requires);
        const cantrips = v.repeatable && v.repeatable !== 'feat' ? eligibleCantrips(v, props.known) : [];
        const info = `${describeTr('invocation', v.id) ?? v.note ?? ''}${v.gmNote ? ` — ${T.invocationOffCombat}: ${v.gmNote}` : ''}${v.status === 'none' ? ` (${T.invocationNone})` : ''}`;
        return (
          <span key={v.id} className="invocation">
            <button type="button" className={on ? 'on' : ''} aria-pressed={on} disabled={!on && (full || blocked || (!!v.repeatable && v.repeatable !== 'feat' && cantrips.length === 0))}
              onClick={() => props.onInvocations(on ? chosen.filter((x) => parseInvocation(x)[0] !== v.id) : [...chosen, cantrips[0] ? `${v.id}:${cantrips[0]}` : v.repeatable === 'feat' ? `${v.id}:alert` : v.id])}>
              {v.name} <small>{v.minLevel}+</small> <InfoTip text={info} /></button>
            {on && v.repeatable === 'feat' && mine.map((m, k) => (
              // Kuyruk 19: Lessons of the First Ones: köken feat'i (Magic Initiate'te büyü listesi); tekrar alınabilir.
              <select key={k} aria-label={v.name} value={parseInvocation(m)[1] ?? 'alert'}
                onChange={(e: { target: { value: string } }) => props.onInvocations(chosen.map((x, i) => (x === m && chosen.indexOf(m) === i ? `${v.id}:${e.target.value}` : x)))}>
                {LESSON_FEATS.flatMap((f) => (f === 'magic-initiate' ? ['cleric', 'druid', 'wizard'].map((l) => `${f}@${l}`) : [f]))
                  .map((f) => <option key={f} value={f}>{f.replace('@', ' / ')}</option>)}
              </select>
            ))}
            {on && !!v.effect?.rituals && [0, 1].map((k) => {
              // Kuyruk 19: Pact of the Tome: iki 1. seviye ritüel büyüsü.
              const cur = (parseInvocation(mine[0] as string)[1] ?? '').split('|');
              return (
                <select key={`r${k}`} aria-label={`${v.name} ${k + 1}`} value={cur[k] ?? ''}
                  onChange={(e: { target: { value: string } }) => { const next = [...cur]; next[k] = e.target.value; props.onInvocations(chosen.map((x) => (x === mine[0] ? `${v.id}:${next.slice(0, 2).join('|')}` : x))); }}>
                  <option value="">—</option>
                  {(v.ritualOptions ?? []).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              );
            })}
            {on && v.repeatable === 'feat' && !full && (
              <button type="button" onClick={() => props.onInvocations([...chosen, `${v.id}:skilled`])}>+</button>
            )}
            {on && cantrips.length > 1 && (
              <select aria-label={v.name} value={parseInvocation(mine[0] as string)[1] ?? ''}
                onChange={(e: { target: { value: string } }) => props.onInvocations(chosen.map((x) => (x === mine[0] ? `${v.id}:${e.target.value}` : x)))}>
                {cantrips.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </span>
        );
      })}
      {pactBlade && (
        <label>{T.pactWeapon}
          <select value={props.pactWeapon ?? ''} onChange={(e: { target: { value: string } }) => props.onPact(e.target.value)}>
            <option value="">—</option>
            {melee.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}
    </div>
    </Fold>
  );
}


/**
 * Görev DRUID, K18: bilinen Wild Shape biçimleri (CR ve uçuş sınırı veriden). Canavar verisi tembel: seçici açılınca
 * yüklenir (önceden yüklenmediği için liste boş kalıyor, yalnızca sayaç görünüyordu). Boş bırakılırsa savaşta en güçlüleri.
 */
export function FormPicker(props: { classId: string; level: number; subclassId?: string; forms: string[]; onForms: (ids: string[]) => void }) {
  const T = t().builder;
  const f = classKit(props.classId, props.level, props.subclassId).usable.find((u) => u.effect.kind === 'wildShape');
  const lim = f ? shapeLimits({ ...f }, props.level) : null;
  const [ready, setReady] = useState(monstersLoaded());
  useEffect(() => {
    if (!f || ready) return;
    let live = true;
    loadMonsters().then(() => { if (live) setReady(true); }, () => { /* liste boş kalır; not görünür */ });
    return () => { live = false; };
  }, [!!f, ready]);
  if (!f || !lim) return null;
  const list = ready ? eligibleForms(monsters, f, props.level).sort((a, b) => a.name.localeCompare(b.name)) : [];
  const full = props.forms.length >= lim.known;
  const speed = (m: (typeof list)[number]) => [`${m.speed} ft`, m.fly ? `${T.formFly} ${m.fly} ft` : ''].filter(Boolean).join(' · ');
  return (
    <Fold title={t().builder.wiz.formFold(lim.known, props.forms.length)} className="form-fold">
    <div className="metamagic-pick form-pick">
      <p className="mute">{T.formAuto}</p>
      {!ready && <p className="mute">{T.formLoading}</p>}
      {list.map((m) => {
        const on = props.forms.includes(m.id);
        return (
          <button key={m.id} type="button" className={`form-card${on ? ' on' : ''}`} aria-pressed={on} disabled={!on && full}
            onClick={() => props.onForms(on ? props.forms.filter((x) => x !== m.id) : [...props.forms, m.id])}>
            <AvatarBadge avatar={monsterAvatar(m)} size={32} />
            <span><b>{m.name}</b><small>CR {m.cr} · {speed(m)}</small></span>
          </button>
        );
      })}
    </div>
    </Fold>
  );
}


/** Kuyruk P12: özelliğin rastgele büyü listesi büyüklüğü (`buyuVer.rastgeleListe.sayi`; yoksa 0). Anahtar `<sınıf>/<alt sınıf>:<özellik>`. */
export function wishCountOf(classId: string, subclassId: string | undefined, key: string): number {
  const sub = findSubclass(classId, subclassId);
  const f = sub?.features.find((x) => `${classId}/${sub.id}:${x.id}` === key);
  const p = (f?.ilkeller ?? []).find((x) => x.tur === 'buyuVer' && x.rastgeleListe) as { rastgeleListe?: { sayi?: number } } | undefined;
  return p ? p.rastgeleListe?.sayi ?? 8 : 0;
}


/** Ana listede en çok kaç güç görünür (kalanı "Diğer güçler" altında). */
export const FEATURE_VISIBLE = 6;

type Gained = ReturnType<typeof gainedFeatures>[number];

/** Karar isteyen güç mü (seçenek, rastgele liste, büyü seçimi): her zaman ana listede. */
function needsChoice(f: Gained, classId: string, subclassId: string | undefined, level: number): boolean {
  return !!f.mechanic?.options || wishCountOf(classId, subclassId, f.key) > 0
    || !!f.mechanic?.spellPicks?.some((p) => level >= (p.minClassLevel ?? 1));
}

/** Ana listede görünecek güçler: kararlar + en yeni güçler (toplam en çok `FEATURE_VISIBLE`); kalan "diğer". Sıra seviye sırası. */
export function splitFeatures(list: Gained[], classId: string, subclassId: string | undefined, level: number): { main: Gained[]; rest: Gained[] } {
  const keep = new Set(list.filter((f) => needsChoice(f, classId, subclassId, level)).map((f) => f.key));
  for (let i = list.length - 1; i >= 0 && keep.size < FEATURE_VISIBLE; i--) keep.add((list[i] as Gained).key);
  return { main: list.filter((f) => keep.has(f.key)), rest: list.filter((f) => !keep.has(f.key)) };
}

export function FeaturesPanel(props: {
  classId: string; level: number; subclassId?: string; experimentalFrom: number;
  /** Seçenekli özellikler (Hunter's Prey, Defensive Tactics; Görev F). */
  choices: Record<string, string>; onChoose: (key: string, value: string) => void;
  /** Görev SORCERER: seçilen Metamagic seçenekleri. */
  metamagic: string[]; onMetamagic: (ids: string[]) => void;
  /** Görev WARLOCK: Eldritch Invocations (tekrarlanabilende `kimlik:Cantrip`) ve pact silahı. */
  invocations: string[]; onInvocations: (ids: string[]) => void; known: string[];
  weapons: string[]; pactWeapon?: string; onPact: (w: string) => void;
  /** Görev DRUID: bilinen Wild Shape biçimleri. */
  forms: string[]; onForms: (ids: string[]) => void;
}) {
  const T = t().builder;
  const W = T.wiz;
  const lang = getLang();
  const features = gainedFeatures(props.classId, props.level, props.subclassId);
  const mm = classKit(props.classId, props.level, props.subclassId).metamagic;
  const missing = missingFeatures(props.classId, props.level, props.subclassId);
  const { main, rest } = splitFeatures(features, props.classId, props.subclassId, props.level);

  const row = (f: Gained) => {
    const sum = featureSummary(f, props.classId, props.subclassId, lang);
    const soon = !f.mechanic || f.mechanic.status === 'missing';
    const n = wishCountOf(props.classId, props.subclassId, f.key);
    return (
      <li key={f.key} className={`feature${f.mechanic?.story ? ' story' : ''}${soon ? ' soon' : ''}`}>
        <span className="feature-head">
          <b>{f.name}</b> <small className="feature-lv">{W.featureLevel(f.level)}</small>
          {f.mechanic?.story && <span className="feature-tag">{T.storyTag}</span>}
          {soon && <span className="feature-tag soon">{W.soonTag}</span>}
        </span>
        {sum && <small className="feature-sum">{sum}</small>}
        {f.mechanic?.options && (
          <select aria-label={f.name} value={props.choices[f.key] ?? f.mechanic.default ?? f.mechanic.options[0]?.id}
            onChange={(e: { target: { value: string } }) => props.onChoose(f.key, e.target.value)}>
            {f.mechanic.options.map((o) => <option key={o.id} value={o.id}>{T.featureOption[o.id] ?? o.id}</option>)}
          </select>
        )}
        {/* Kuyruk P12: ek paket rastgele büyü listesi (`buyuVer.rastgeleListe`): bildiği/hazırladığı N büyü. */}
        {n > 0 && (() => {
          const picked = Array.from({ length: n }, (_, i) => props.choices[wishPickKey(f.key, i + 1)] ?? '').filter(Boolean).length;
          return <div className="wish-pick"><small>{T.wishPick(n, picked)}</small>
            {Array.from({ length: n }, (_, i) => {
              const key = wishPickKey(f.key, i + 1);
              return <select key={key} aria-label={`${f.name} ${T.wishSlot(i + 1)}`} value={props.choices[key] ?? ''} onChange={(e: { target: { value: string } }) => props.onChoose(key, e.target.value)}>
                <option value="">{T.wishSlot(i + 1)}: {T.wishEmpty}</option>
                {props.known.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>;
            })}</div>;
        })()}
        {/* Kuyruk 19: Spell Mastery / Signature Spells (bilinen Wizard büyüleri), Mystic Arcanum (bütün Warlock listesi, seviye eşiğiyle). */}
        {f.mechanic?.spellPicks?.filter((p) => props.level >= (p.minClassLevel ?? 1)).map((p) => {
          const list = (p.all ? spells.map((x) => x.name) : props.known).filter((nm) => { const sp = spells.find((x) => x.name === nm); return sp?.level === p.level && sp.classes.includes(p.cls ?? 'Wiz'); });
          const key = `${f.key}/${p.slot}`;
          return <select key={key} aria-label={`${f.name} ${p.slot}`} value={props.choices[key] ?? ''}
            onChange={(e: { target: { value: string } }) => props.onChoose(key, e.target.value)}>
            <option value="">{T.spellPickAuto(p.level)}</option>
            {list.map((nm) => <option key={nm} value={nm}>{nm}</option>)}
          </select>;
        })}
      </li>
    );
  };

  return (
    <section className="panel feature-panel">
      <h2>{W.powers}</h2>
      {props.level >= props.experimentalFrom && <p className="warn">{T.experimental(props.experimentalFrom)}</p>}
      <ul className="feature-list">{main.map(row)}</ul>
      {rest.length > 0 && (
        <Fold title={W.moreFeatures(rest.length)} className="feature-more">
          <ul className="feature-list">{rest.map(row)}</ul>
        </Fold>
      )}
      {mm && mm.count > 0 && (
        <Fold title={W.metamagicFold(mm.count, props.metamagic.length)} open={props.metamagic.length !== mm.count} className="metamagic-fold">
          <div className="metamagic-pick">
            {Object.entries(mm.costs).map(([id, cost]) => {
              const on = props.metamagic.includes(id);
              return <button key={id} type="button" className={on ? 'on' : ''} aria-pressed={on}
                disabled={!on && props.metamagic.length >= mm.count}
                title={!on && props.metamagic.length >= mm.count ? W.limitFull(mm.count) : undefined}
                onClick={() => props.onMetamagic(on ? props.metamagic.filter((x) => x !== id) : [...props.metamagic, id])}>
                {T.metamagicName[id] ?? id} <small>{T.metamagicCost(cost)}</small> <InfoTip text={`${lang === 'tr' ? `${T.metamagicName[id] ?? id}: ` : ''}${T.metamagicInfo[id] ?? ''}`} /></button>;
            })}
            {props.metamagic.length >= mm.count && <p className="mute limit-note">{W.limitFull(mm.count)}</p>}
          </div>
        </Fold>
      )}
      <InvocationPicker {...props} />
      <FormPicker classId={props.classId} level={props.level} subclassId={props.subclassId} forms={props.forms} onForms={props.onForms} />
      {missing.length > 0 && <p className="mute">{W.comingFeatures(missing.map((f) => f.name).join(', '))}</p>}
    </section>
  );
}
