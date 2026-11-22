/**
 * Kuyruk KQ4 CK1: karakter kâğıdı veri modeli (saf; çizimden bağımsız, testlenir). Değerler motorun türetmelerinden
 * (`deriveStats`, `combatantFromSheet`, `carryLoad`) gelir; yeni kural yok. Adlar İngilizce, açıklamalar Türkçe (SD4;
 * `featureSummary` EN arayüzde mevcut davranışı verir). Boş hikâye alanı modelde yoktur.
 */
import { classes, getRace, spells as allSpells, aciklamaOf } from '../../data';
import srdSpecies from '../../../data/srd/species.json';
import { ABILITIES, type Ability } from '../../rules/abilities';
import { deriveStats, finalScores, type CharacterSheet } from '../../rules/stats';
import { SKILLS, SKILL_IDS, type Skill } from '../../rules/skills';
import { backgroundOf } from '../../rules/backgrounds';
import { gainedFeatures } from '../../rules/classFeatures';
import { findSubclass, subclassMissing, textOf } from '../../rules/subclasses';
import { lineageName, lineageOf } from '../../rules/lineage';
import { carryLoad, type CarryRule } from '../../rules/carry';
import { combatantFromSheet } from '../../battle/create';
import { featureSummary } from '../../ui/descriptions';
import { spellComponents } from '../../rules/spellComponents';
import { alignmentOf, labelOf } from '../../rules/alignment';
import { filledStory, type StoryField } from '../../rules/story';
import type { SavedCharacter } from '../../rules/builder';
import type { Lang } from '../../i18n/strings';

export interface SheetModel {
  name: string; race: string; klass: string; subclass: string | null; level: number; background: string | null; tokenSrc: string | null;
  scores: Array<{ ability: Ability; score: number; mod: number }>;
  proficiency: number; ac: number; maxHp: number; speed: number; initiative: number; passivePerception: number;
  saves: Array<{ ability: Ability; bonus: number; proficient: boolean }>;
  skills: Array<{ skill: Skill; name: string; bonus: number; proficient: boolean; expertise: boolean }>;
  attacks: Array<{ name: string; attack: number; damage: string; type: string }>;
  features: Array<{ name: string; level: number; text: string; from: 'class' | 'subclass' | 'species' }>;
  spells: null | { dc: number | null; attack: number | null; slots: number[]; groups: Array<{ level: number; list: Array<{ name: string; comps: string }> }> };
  gear: { armor: string; shield: boolean; weapons: string[]; items: string[]; weight: number; capacity: number } ;
  alignment: string | null;
  story: Array<{ field: StoryField; text: string }>;
  missing: string[];
}

const sign = (n: number): string => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);
export { sign as signed };

export function sheetModel(c: SavedCharacter, lang: Lang, opts: { carryRule?: CarryRule; alignmentOn?: boolean } = {}): SheetModel {
  const sheet: CharacterSheet = c.sheet;
  const missing: string[] = [];
  const d = deriveStats(sheet);
  const scores = finalScores(sheet);
  const klass = classes.find((k) => k.id === sheet.classId)?.name ?? sheet.classId;
  let race = sheet.raceId;
  try { race = getRace(sheet.raceId).name; } catch { missing.push(sheet.raceId); }
  const lin = (() => { try { return lineageOf(sheet); } catch { return undefined; } })();
  if (lin) race = `${race} (${lineageName(lin, lang === 'en' ? 'en' : 'tr')})`;
  // Alt sınıf (dış içerik yüklü değilse "içerik eksik": çökme yok).
  let subclass: string | null = null;
  if (sheet.subclassId) {
    const sub = findSubclass(sheet.classId, sheet.subclassId);
    if (sub) subclass = textOf(sub.name, lang === 'en' ? 'en' : 'tr');
    else if (subclassMissing(sheet.classId, sheet.subclassId)) { subclass = sheet.subclassId; missing.push(sheet.subclassId); }
  }
  const prof = new Set(sheet.skills ?? []);
  const exp = new Set(sheet.expertise ?? []);
  const skills = SKILL_IDS.map((s) => ({ skill: s, name: SKILLS[s].name, bonus: d.skills[s] ?? d.modifiers[SKILLS[s].ability], proficient: prof.has(s), expertise: exp.has(s) }));
  const passive = 10 + (d.skills.perception ?? d.modifiers.wis);
  // Silah satırları: savaşçının saldırı seçenekleri (aynı hesap: yeterlilik, yetenek, büyülü bonus).
  let attacks: SheetModel['attacks'] = [];
  try {
    const cb = combatantFromSheet(sheet, { id: 'sheet', ownerId: 'sheet' });
    attacks = cb.weaponOptions.filter((o) => !o.spell && o.weaponId !== 'improvised').map((o) => ({ name: o.label, attack: o.attackBonus, damage: o.damage, type: o.damageType ?? '' }));
  } catch { /* sınıf verisi yüklü değil: silah satırı yok */ }
  // Özellikler: sınıf/alt sınıf (ad İngilizce, açıklama Türkçe) + tür özellikleri.
  const features: SheetModel['features'] = [];
  try {
    for (const f of gainedFeatures(sheet.classId, sheet.level, sheet.subclassId)) {
      features.push({ name: f.name, level: f.level, from: f.from, text: featureSummary(f, sheet.classId, sheet.subclassId, lang) });
    }
  } catch { /* ilerleme verisi yok */ }
  // Tür özellikleri (SRD tür kaydı; açıklama dile göre `aciklamalar-tr.json` / `aciklamalar-en.json` `tur`).
  try {
    const sp = srdSpecies.species.find((x) => x.id === sheet.raceId);
    for (const tr of sp?.traits ?? []) features.push({ name: tr.name, level: 1, from: 'species', text: aciklamaOf('tur', `${sheet.raceId}/${tr.id}`, lang) ?? '' });
  } catch { /* tür verisi yok */ }
  // Büyüler: seviye gruplarına.
  const known = [...new Set([...(sheet.spellNames ?? [])])];
  const groups = new Map<number, Array<{ name: string; comps: string }>>();
  for (const n of known) {
    const sp = allSpells.find((x) => x.name === n);
    const lv = sp?.level ?? 0;
    const cm = sp ? spellComponents(sp) : null;
    const comps = cm ? `${cm.v ? 'V' : ''}${cm.s ? 'S' : ''}${cm.m ? 'M' : ''}` : '';
    groups.set(lv, [...(groups.get(lv) ?? []), { name: n, comps }]);
  }
  const hasSlots = d.spellSlots.some((x) => x > 0);
  const spellsBlock = known.length || hasSlots || d.spellSaveDc !== null
    ? { dc: d.spellSaveDc, attack: d.spellAttack, slots: d.spellSlots, groups: [...groups].sort((a, b) => a[0] - b[0]).map(([level, list]) => ({ level, list })) } : null;
  const load = carryLoad(sheet, opts.carryRule ?? 'srd');
  const bg = backgroundOf(sheet);
  const a = opts.alignmentOn && c.hizalanma && !c.hizalanma.gizli ? labelOf(alignmentOf(c.hizalanma), lang === 'en' ? 'en' : 'tr') : null;
  return {
    name: sheet.name, race, klass, subclass, level: sheet.level, background: bg ? (typeof bg.name === 'string' ? bg.name : bg.name[lang === 'en' ? 'en' : 'tr']) : null, tokenSrc: null,
    scores: ABILITIES.map((ab) => ({ ability: ab, score: scores[ab], mod: d.modifiers[ab] })),
    proficiency: d.proficiency, ac: d.ac, maxHp: d.maxHp, speed: d.speed, initiative: d.initiative, passivePerception: passive,
    saves: ABILITIES.map((ab) => ({ ability: ab, bonus: d.saves[ab], proficient: d.saveProficiencies.includes(ab) })),
    skills, attacks, features, spells: spellsBlock,
    gear: { armor: sheet.armorName, shield: sheet.shield, weapons: (sheet.weapons ?? []).map((w) => (w.enchant ? `${w.name} +${w.enchant}` : w.name)), items: sheet.itemNames, weight: load.weight, capacity: load.capacity },
    alignment: a, story: filledStory(c.hikaye).map(([field, text]) => ({ field, text })), missing,
  };
}
