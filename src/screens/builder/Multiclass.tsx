/**
 * Görev MC5: oluşturucunun çoklu sınıf paneli (SRD 5.2.1 s. 24–26; kararlar K1–K4 `harita/belgeler/MULTICLASS-PLAN.md`).
 * Yeni karakter tek sınıfla başlar (akış aynı); "Sınıf ekle" yeni sınıfı 1. seviyede ekler. Sınıf başına seviye ve alt
 * sınıf, ek sınıfın ilk seviye beceri/çalgı seçimi, sınıf çıkarma. En çok `MAX_CLASSES` sınıf (K4): sınıra gelince seçici
 * kapalı ve neden yazılı; ön koşulu tutmayan, zaten olan ya da toplam seviyeyi aşan sınıf seçilemez (soluk + neden).
 * Eski kayıtta sınırı aşan karakter açılır; sorun Özet'te (`characterIssues`) yazar.
 */
import { classes, getClass } from '../../data';
import { LEVEL_CAP, MAX_CLASSES } from '../../app/limits';
import { addClassProblems, classesOf, multiclassInfo, syncClassFields, type MulticlassProblem } from '../../rules/multiclass';
import { finalScores, type CharacterSheet, type ClassEntry } from '../../rules/stats';
import { subclassLevel, subclassesOf } from '../../rules/classFeatures';
import { genderVisible, subclassPlainName } from '../../rules/subclasses';
import { SKILLS, SKILL_IDS, type Skill } from '../../rules/skills';
import { getLang, t } from '../../i18n';
import { InfoPop } from './shared';

const className = (id: string): string => classes.find((k) => k.id === id)?.name ?? id;

/** Sınıf listesini sayfaya yazar (değişmezler `syncClassFields`: tek öğe eski üç alana katlanır). */
export function withClasses(sheet: CharacterSheet, list: ClassEntry[]): CharacterSheet {
  return syncClassFields({ ...sheet, classes: list });
}

/** Eklenemeyen sınıfın kısa nedeni (TR/EN). */
function reason(p: MulticlassProblem): string {
  const M = t().builder.mc;
  switch (p.kind) {
    case 'tekrar': return M.dup;
    case 'cok': return M.max(p.max);
    case 'toplam': return M.cap(p.max);
    case 'onKosul': return M.prereq(p.abilities.map((a) => a.toUpperCase()).join(p.any ? '/' : '+'));
    default: return '';
  }
}

export function MulticlassPanel({ sheet: s, setSheet }: { sheet: CharacterSheet; setSheet: (f: (s: CharacterSheet) => CharacterSheet) => void }) {
  const M = t().builder.mc;
  const T = t().builder;
  const list = classesOf(s);
  const multi = list.length > 1;
  const total = list.reduce((n, e) => n + e.level, 0);
  const scores = finalScores(s);
  // Tek sınıfa dönünce `classes` alanı silinir (tek sınıflı kayıt eskisiyle aynı); sayfa bütünüyle yazılır.
  const put = (next: ClassEntry[]) => setSheet((x) => withClasses(x, next));
  const patch = (i: number, p: Partial<ClassEntry>) => put(list.map((e, j) => (j === i ? { ...e, ...p } : e)));
  const full = list.length >= MAX_CLASSES;
  const add = (id: string) => { if (id && addClassProblems(s, id, scores).length === 0) put([...list, { classId: id, level: 1 }]); };
  return (
    <div className="mc-panel">
      <h4>{M.title} <InfoPop text={M.help} /></h4>
      {multi && (
        <ul className="mc-list">
          {list.map((e, i) => {
            const subLv = subclassLevel(e.classId);
            const subs = subclassesOf(e.classId).filter((x) => genderVisible(x, s));
            const ek = i > 0 ? multiclassInfo(e.classId)?.ek : undefined;
            const skillFrom: readonly Skill[] = ek?.beceri?.liste === 'sinif' ? (getClass(e.classId).skillChoices.from === 'any' ? SKILL_IDS : getClass(e.classId).skillChoices.from as readonly Skill[]) : SKILL_IDS;
            const maxLv = LEVEL_CAP - (total - e.level);
            return (
              <li key={e.classId} className="mc-row">
                <b>{className(e.classId)}</b>
                <label>{M.level}
                  <select value={e.level} onChange={(ev: { target: { value: string } }) => patch(i, { level: Number(ev.target.value) })}>
                    {Array.from({ length: Math.max(maxLv, e.level) }, (_, k) => <option key={k + 1} value={k + 1}>{k + 1}</option>)}
                  </select>
                </label>
                {subLv !== null && subs.length > 0 && e.level >= subLv && (
                  <label>{T.subclass}
                    <select value={e.subclassId ?? ''} onChange={(ev: { target: { value: string } }) => patch(i, { subclassId: ev.target.value || undefined })}>
                      <option value="">{T.subclassNone}</option>
                      {subs.map((x) => <option key={x.id} value={x.id}>{subclassPlainName(x.name, getLang(), x.class)}</option>)}
                    </select>
                  </label>
                )}
                {ek?.beceri && (
                  <label>{M.extraSkill(className(e.classId))}
                    <select value={e.ekBeceri ?? ''} onChange={(ev: { target: { value: string } }) => patch(i, { ekBeceri: (ev.target.value || undefined) as Skill | undefined })}>
                      <option value="">{M.none}</option>
                      {skillFrom.map((k) => <option key={k} value={k}>{SKILLS[k]?.name ?? k}</option>)}
                    </select>
                  </label>
                )}
                {ek?.calgi && (
                  <label>{M.extraTool(className(e.classId))}
                    <input value={e.ekCalgi ?? ''} maxLength={40} onChange={(ev: { target: { value: string } }) => patch(i, { ekCalgi: ev.target.value || undefined })} />
                  </label>
                )}
                <button type="button" className="ghost" onClick={() => put(list.filter((_, j) => j !== i))}>{M.remove}</button>
              </li>
            );
          })}
        </ul>
      )}
      {multi && <p className="mute">{M.total(total)}</p>}
      <label className="mc-add">{M.add}
        <select value="" disabled={full} aria-describedby={full ? 'mc-full' : undefined} onChange={(ev: { target: { value: string } }) => add(ev.target.value)}>
          <option value="">{M.addPick}</option>
          {classes.filter((k) => multiclassInfo(k.id)).map((k) => {
            const why = addClassProblems(s, k.id, scores).map(reason).filter(Boolean);
            return <option key={k.id} value={k.id} disabled={why.length > 0}>{why.length ? `${k.name} (${why.join('; ')})` : k.name}</option>;
          })}
        </select>
      </label>
      {full && <p id="mc-full" className="soft-warn" role="status">{M.max(MAX_CLASSES)}</p>}
    </div>
  );
}
