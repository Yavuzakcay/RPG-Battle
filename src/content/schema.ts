/**
 * Dış içerik paketi şeması ve doğrulayıcısı (Görev E1). Paket yalnızca JSON veridir; kod çalıştırılmaz, ifade
 * değerlendirilmez. Alt sınıflar `data/subclasses.json` ile aynı jenerik şemada; etki (`effect`) yalnızca mevcut
 * `FeatureMechanic` alanlarıyla (yeni etki türü yok; bilinmeyen alan reddedilir). Saf: tarayıcı ve Node'da çalışır
 * (`npm run check:icerik`).
 */
import { classData, classes, spells, SUBCLASS_STATUSES, type FeatureMechanic, type LocalText, type SubclassDef, type SubclassFeatureDef } from '../data';

export const PACK_FORMAT = 'rpg-battle-icerik';
export const PACK_VERSION = 1;
/** Sınırlar: dosya boyutu, paket sayısı, paket başına alt sınıf, alt sınıf başına özellik, metin uzunlukları. */
export const LIMITS = { fileBytes: 256 * 1024, packs: 20, subclasses: 24, features: 30, name: 60, text: 4000 } as const;
const ID = /^[a-z0-9][a-z0-9-]{1,47}$/;

export interface ContentPack {
  format: typeof PACK_FORMAT;
  version: number;
  id: string;
  name: LocalText;
  author?: string;
  subclasses: SubclassDef[];
}

/** Doğrulama hatası: kod (metni `strings.ts` `content.errors`), konum ve değişkenler. */
export interface ContentError { code: ContentErrorCode; path: string; detail?: string }
export type ContentErrorCode = 'json' | 'size' | 'format' | 'version' | 'field' | 'text' | 'idPattern' | 'packTaken' | 'idTaken'
  | 'duplicate' | 'unknownClass' | 'level' | 'status' | 'unknownEffect' | 'effectValue' | 'effectStatus' | 'subclassCount'
  | 'featureCount' | 'packLimit';

/** Paketin özeti (ayarlar ekranı ve `check:icerik`): alt sınıf başına durum sayıları. */
export interface PackSummary {
  id: string;
  subclasses: Array<{ id: string; class: string; features: number; counts: Record<SubclassFeatureDef['status'], number> }>;
  notWorking: number;
}

// ------------------------------------------------------------------ etki (FeatureMechanic) denetimi

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ENUMS: Record<string, readonly string[]> = {
  type: ['passive', 'resource', 'action', 'bonus', 'reaction', 'free'],
  status: ['ok', 'partial', 'none'],
  stat: ['attacksPerAction', 'sneakAttackDice', 'speed', 'unarmoredDefense', 'expertise', 'spellcasting', 'featSlot', 'weaponMastery',
    'saveAdvantage', 'classSkills', 'frenzy', 'martialArts', 'critOn', 'saveProficiency'],
  when: ['noHeavyArmor', 'noArmorNoShield', 'attackAction'],
};
const LISTS: Record<string, readonly string[]> = {
  abilities: ABILITIES,
  grants: ['dash', 'disengage', 'hide'],
  openHand: ['addle', 'push', 'topple'],
};
const REACTION_KINDS = ['shield', 'parry', 'halve', 'resist', 'deflect', 'reduce', 'slowFall', 'featherFall', 'counterspell', 'rebuke',
  'retaliate', 'redirectAttack', 'gaze'];
const EFFECT_KINDS = ['healPool', 'buff', 'tempHp', 'condition', 'divineSpark', 'turnUndead', 'preserveLife', 'innate'];
/** Motorun tanıdığı pasif işaretler (`trait`; Görev F). Yeni işaret uydurulamaz. */
export const KNOWN_TRAITS = ['tactical-mind', 'tactical-shift', 'indomitable', 'studied-attacks', 'remarkable-athlete', 'survivor',
  'steady-aim', 'cunning-strike', 'improved-cunning-strike', 'devious-strikes', 'evasion', 'reliable-talent', 'elusive', 'stroke-of-luck',
  'climber', 'relentless-hunter', 'precise-hunter', 'feral-senses', 'foe-slayer', 'colossus-slayer', 'horde-breaker', 'escape-the-horde',
  'multiattack-defense', 'superior-hunters-prey',
  // Görev CLERIC.
  'protector', 'thaumaturge', 'sear-undead', 'divine-strike', 'potent-spellcasting', 'improved-blessed-strikes', 'disciple-of-life', 'blessed-healer', 'supreme-healing',
  // Görev WIZARD.
  'potent-cantrip', 'sculpt-spells', 'empowered-evocation',
  // Görev SORCERER.
  'sorcery-incarnate', 'affinity-acid', 'affinity-cold', 'affinity-fire', 'affinity-lightning', 'affinity-poison'];
/** Nesne ya da dizi değerli alanlar (iç yapıları motorun okuduğu biçimde; türleri denetlenir). */
const OBJECTS = ['rage', 'martialArts', 'metabolism', 'deflect', 'stunningStrike', 'reaction', 'effect', 'alwaysPrepared', 'metamagic'];
const ARRAYS = ['skills', 'alternatives', 'focusActions', 'options', 'actions'];
const NUMBERS = ['value', 'fallReduction', 'hpPerLevel'];
const STRINGS = ['column', 'category', 'command', 'resource', 'note', 'trait', 'default'];
const BOOLS = ['shield', 'melee'];
const KNOWN = new Set(['type', 'status', 'stat', 'when', ...Object.keys(LISTS), ...OBJECTS, ...ARRAYS, ...NUMBERS, ...STRINGS, ...BOOLS, 'swap']);

/** Motorda var olan komutlar ve feat kategorileri (veriden; yeni komut uydurulamaz). */
function knownValues(): { commands: Set<string>; categories: Set<string> } {
  const all = [...Object.values(classData.mechanics.features), ...classData.subclasses.flatMap((s) => s.features.map((f) => f.effect))];
  return {
    commands: new Set(all.map((m) => m?.command).filter((x): x is string => !!x)),
    categories: new Set([...all.map((m) => m?.category), ...classData.feats.map((f) => f.category)].filter((x): x is string => !!x)),
  };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Etkinin hataları (alan adları ve değerleri; motorun bilmediği alan `unknownEffect`). */
export function effectErrors(effect: unknown, path: string): ContentError[] {
  const out: ContentError[] = [];
  if (!isObj(effect)) return [{ code: 'effectValue', path, detail: 'effect' }];
  const known = knownValues();
  for (const [k, v] of Object.entries(effect)) {
    const at = `${path}.${k}`;
    if (!KNOWN.has(k)) { out.push({ code: 'unknownEffect', path: at, detail: k }); continue; }
    const bad = (detail = k) => out.push({ code: 'effectValue', path: at, detail });
    if (ENUMS[k]) { if (typeof v !== 'string' || !ENUMS[k]?.includes(v)) bad(`${k}=${String(v)}`); continue; }
    if (LISTS[k]) { if (!Array.isArray(v) || v.some((x) => !LISTS[k]?.includes(x as string))) bad(); continue; }
    if (NUMBERS.includes(k)) { if (typeof v !== 'number' || !Number.isFinite(v)) bad(); continue; }
    if (BOOLS.includes(k)) { if (typeof v !== 'boolean') bad(); continue; }
    if (STRINGS.includes(k)) {
      if (typeof v !== 'string' || v.length > LIMITS.text) { bad(); continue; }
      if (k === 'resource' && classData.mechanics.resources[v] === undefined) bad(`resource=${v}`);
      if (k === 'command' && !known.commands.has(v)) bad(`command=${v}`);
      if (k === 'category' && !known.categories.has(v)) bad(`category=${v}`);
      if (k === 'trait' && !KNOWN_TRAITS.includes(v)) bad(`trait=${v}`);
      continue;
    }
    if (k === 'swap') { if (v !== 'all' && typeof v !== 'number') bad(); continue; }
    if (k === 'options') {
      if (!Array.isArray(v) || v.some((o) => !isObj(o) || typeof o.id !== 'string' || !KNOWN_TRAITS.includes(o.trait as string))) bad('options');
      continue;
    }
    if (ARRAYS.includes(k)) { if (!Array.isArray(v)) bad(); continue; }
    if (!isObj(v)) { bad(); continue; }
    if (k === 'reaction' && !REACTION_KINDS.includes(v.kind as string)) bad(`reaction.kind=${String(v.kind)}`);
    if (k === 'effect' && !EFFECT_KINDS.includes(v.kind as string)) bad(`effect.kind=${String(v.kind)}`);
    if (k === 'alwaysPrepared') {
      for (const [lvl, names] of Object.entries(v)) {
        if (!/^\d+$/.test(lvl) || !Array.isArray(names) || names.some((n) => !spells.some((s) => s.name === n))) bad(`alwaysPrepared.${lvl}`);
      }
    }
  }
  if (effect.type === undefined) out.push({ code: 'effectValue', path: `${path}.type`, detail: 'type' });
  if (effect.status === undefined) out.push({ code: 'effectValue', path: `${path}.status`, detail: 'status' });
  return out;
}

// ------------------------------------------------------------------ paket denetimi

function textErrors(x: unknown, path: string, max: number): ContentError[] {
  if (!isObj(x) || typeof x.tr !== 'string' || typeof x.en !== 'string' || (x.tr.trim() === '' && x.en.trim() === '')) {
    return [{ code: 'field', path, detail: 'tr/en' }];
  }
  return x.tr.length > max || x.en.length > max ? [{ code: 'text', path, detail: String(max) }] : [];
}

/**
 * Paketi doğrular. `taken`: kullanımdaki alt sınıf kimlikleri (SRD + diğer paketler), `packs`: yüklü paket kimlikleri
 * (aynı kimlikli paket yeniden yüklenirken `replacing` verilir ve çakışma sayılmaz).
 */
export function validatePack(raw: unknown, ctx: { taken: string[]; packs: string[]; replacing?: string }): { ok: true; pack: ContentPack } | { ok: false; errors: ContentError[] } {
  const errors: ContentError[] = [];
  if (!isObj(raw)) return { ok: false, errors: [{ code: 'format', path: '$' }] };
  if (raw.format !== PACK_FORMAT) errors.push({ code: 'format', path: '$.format', detail: PACK_FORMAT });
  if (raw.version !== PACK_VERSION) errors.push({ code: 'version', path: '$.version', detail: String(PACK_VERSION) });
  if (typeof raw.id !== 'string' || !ID.test(raw.id)) errors.push({ code: 'idPattern', path: '$.id', detail: String(raw.id) });
  else if (ctx.packs.includes(raw.id) && ctx.replacing !== raw.id) errors.push({ code: 'packTaken', path: '$.id', detail: raw.id });
  errors.push(...textErrors(raw.name, '$.name', LIMITS.name));
  if (raw.author !== undefined && (typeof raw.author !== 'string' || raw.author.length > LIMITS.name)) errors.push({ code: 'text', path: '$.author', detail: String(LIMITS.name) });
  if (!Array.isArray(raw.subclasses) || raw.subclasses.length === 0) errors.push({ code: 'field', path: '$.subclasses', detail: 'subclasses' });
  else if (raw.subclasses.length > LIMITS.subclasses) errors.push({ code: 'subclassCount', path: '$.subclasses', detail: String(LIMITS.subclasses) });
  const seen = new Set<string>();
  const taken = new Set(ctx.taken);
  (Array.isArray(raw.subclasses) ? raw.subclasses.slice(0, LIMITS.subclasses) : []).forEach((s: unknown, i: number) => {
    const p = `$.subclasses[${i}]`;
    if (!isObj(s)) { errors.push({ code: 'field', path: p, detail: 'subclass' }); return; }
    if (typeof s.id !== 'string' || !ID.test(s.id)) errors.push({ code: 'idPattern', path: `${p}.id`, detail: String(s.id) });
    else if (seen.has(s.id)) errors.push({ code: 'duplicate', path: `${p}.id`, detail: s.id });
    else if (taken.has(s.id)) errors.push({ code: 'idTaken', path: `${p}.id`, detail: s.id });
    if (typeof s.id === 'string') seen.add(s.id);
    if (typeof s.class !== 'string' || !classes.some((c) => c.id === s.class)) errors.push({ code: 'unknownClass', path: `${p}.class`, detail: String(s.class) });
    if (s.srd !== undefined) errors.push({ code: 'field', path: `${p}.srd`, detail: 'srd' });
    errors.push(...textErrors(s.name, `${p}.name`, LIMITS.name), ...textErrors(s.role, `${p}.role`, LIMITS.name));
    if (!Array.isArray(s.features) || s.features.length === 0) { errors.push({ code: 'field', path: `${p}.features`, detail: 'features' }); return; }
    if (s.features.length > LIMITS.features) errors.push({ code: 'featureCount', path: `${p}.features`, detail: String(LIMITS.features) });
    const fids = new Set<string>();
    s.features.slice(0, LIMITS.features).forEach((f: unknown, j: number) => {
      const fp = `${p}.features[${j}]`;
      if (!isObj(f)) { errors.push({ code: 'field', path: fp, detail: 'feature' }); return; }
      if (typeof f.id !== 'string' || !ID.test(f.id)) errors.push({ code: 'idPattern', path: `${fp}.id`, detail: String(f.id) });
      else if (fids.has(f.id)) errors.push({ code: 'duplicate', path: `${fp}.id`, detail: f.id });
      if (typeof f.id === 'string') fids.add(f.id);
      if (!Number.isInteger(f.level) || (f.level as number) < 1 || (f.level as number) > 20) errors.push({ code: 'level', path: `${fp}.level`, detail: String(f.level) });
      errors.push(...textErrors(f.name, `${fp}.name`, LIMITS.name), ...textErrors(f.description, `${fp}.description`, LIMITS.text));
      if (!SUBCLASS_STATUSES.includes(f.status as SubclassFeatureDef['status'])) errors.push({ code: 'status', path: `${fp}.status`, detail: String(f.status) });
      if (f.effect !== undefined) errors.push(...effectErrors(f.effect, `${fp}.effect`));
      // "Çalışır" yalnızca motorun uyguladığı etkiyle (ok/partial); etkisiz ya da `none` etki çalışmaz.
      const works = isObj(f.effect) && (f.effect.status === 'ok' || f.effect.status === 'partial');
      if ((f.status === 'calisir') !== works) errors.push({ code: 'effectStatus', path: `${fp}.status`, detail: String(f.status) });
    });
  });
  if (errors.length > 0) return { ok: false, errors };
  const r = raw as unknown as ContentPack;
  return { ok: true, pack: { ...r, subclasses: r.subclasses.map((s) => ({ ...s, pack: r.id })) } };
}

/** JSON metni → doğrulanmış paket (boyut sınırı, bozuk JSON uygulamayı bozmaz). */
export function parsePack(text: string, bytes: number, ctx: { taken: string[]; packs: string[]; replacing?: string }): ReturnType<typeof validatePack> {
  if (bytes > LIMITS.fileBytes) return { ok: false, errors: [{ code: 'size', path: '$', detail: String(LIMITS.fileBytes / 1024) }] };
  let raw: unknown;
  try { raw = JSON.parse(text); } catch (e) { return { ok: false, errors: [{ code: 'json', path: '$', detail: e instanceof Error ? e.message : String(e) }] }; }
  return validatePack(raw, ctx);
}

/** Paket özeti: alt sınıf başına durum sayıları ve "çalışmıyor" toplamı. */
export function summarize(pack: Pick<ContentPack, 'id' | 'subclasses'>): PackSummary {
  const subclasses = pack.subclasses.map((s) => {
    const counts = { calisir: 0, planli: 0, hikaye: 0, calismiyor: 0 };
    for (const f of s.features) counts[f.status] += 1;
    return { id: s.id, class: s.class, features: s.features.length, counts };
  });
  return { id: pack.id, subclasses, notWorking: subclasses.reduce((n, s) => n + s.counts.calismiyor, 0) };
}

/** Mekanik tipi dışa (testler). */
export type { FeatureMechanic };
