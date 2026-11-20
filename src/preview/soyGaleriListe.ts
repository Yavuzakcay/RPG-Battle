/** Alt soy galerisi (yalnız geliştirme/ölçüm): kombinasyon listesi; ölçüm betiği ve önizleme sayfası aynı listeyi kullanır. */
import { races } from '../data';
import { blankCharacter } from '../rules/builder';
import { lineageTint, sheetAvatar } from '../battle/avatar';
import gorunum from '../../data/alt-soy-gorunum.json';
import jetonlar from './jetonTablolari';
import type { CharacterSheet } from '../rules/stats';

export interface Combo {
  /** Sıra numarası (0'dan). */
  n: number;
  race: string; lineage: string; tone?: string; gender: 'erkek' | 'kadin'; cls: string; sub: string; subId?: string; level: number;
  /** painted: boyalı soy (tint/filtre), plain: boyasız (ırk başına bir kez). */
  group: 'boyali' | 'boyasiz'; kind: 'tint' | 'filtre' | 'yok';
  label: string; token: string; sheet: CharacterSheet;
}
const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
const D = gorunum as unknown as { altSoylar: Record<string, { filtre?: string; orijinal?: true }>; celestialUyanis: Record<string, { filtre?: string }> };
const base = blankCharacter('t').sheet;

interface Variant { race: string; lineage: string; tone?: string; awakening?: string; group: Combo['group']; kind: Combo['kind']; name: string }
function variants(): Variant[] {
  const out: Variant[] = [];
  for (const r of races) {
    if (r.id === 'celestial') { out.push({ race: 'celestial', lineage: '', awakening: 'gece-gozyasi', group: 'boyali', kind: 'filtre', name: 'gece-gozyasi' }); continue; }
    if (r.id === 'human') {
      for (const tone of ['siyahi', 'dogu-asyali']) out.push({ race: 'human', lineage: 'outwall', tone, group: 'boyali', kind: 'tint', name: `ten-${tone}` });
      continue;
    }
    for (const l of r.lineages ?? []) {
      const key = `${r.id}/${l.id}`;
      const painted = !!lineageTint(r.id, l.id) || (!!D.altSoylar[key]?.filtre && !D.altSoylar[key]?.orijinal);
      if (painted) out.push({ race: r.id, lineage: l.id, group: 'boyali', kind: lineageTint(r.id, l.id) ? 'tint' : 'filtre', name: l.id });
    }
  }
  // boyasızlar: ırk başına bir kez (aynı jeton), Halfling'de iki oran
  const plain: Array<[string, string, string?]> = [['dragonborn', '', ''], ['dwarf', 'knoll'], ['elf', 'wood-elf'], ['gnome', 'rock-gnome'], ['goliath', 'hill'], ['halfling', 'slender'], ['halfling', 'sturdy'], ['human', 'outwall', 'orijinal'], ['orc', 'wildwood'], ['tiefling', 'infernal'], ['celestial', '', 'parlayan-ruh']];
  for (const [race, lineage, x] of plain) {
    if (race === 'dragonborn') continue; // bütün renkleri boyalı
    if (race === 'celestial') out.push({ race, lineage: '', awakening: x!, group: 'boyasiz', kind: 'yok', name: x! });
    else out.push({ race, lineage, ...(x ? { tone: x } : {}), group: 'boyasiz', kind: 'yok', name: x ? `ten-${x}` : lineage });
  }
  return out;
}
export function combos(): Combo[] {
  const list: Combo[] = [];
  const vs = variants().sort((a, b) => (a.group === b.group ? 0 : a.group === 'boyali' ? -1 : 1));
  for (const v of vs) for (const gender of ['erkek', 'kadin'] as const) for (const cls of CLASSES) {
    const T = jetonlar[cls]!;
    const cols: Array<{ cell: string; id?: string; level: number; label: string }> = [{ cell: 'GR', level: 1, label: 'Gariban' }];
    const seen = new Set<string>();
    for (const [id, cell] of Object.entries(T.altSiniflar)) if (!seen.has(cell)) { seen.add(cell); cols.push({ cell, id, level: 3, label: id }); }
    // Seviyeye bağlı ikinci form (Pehlivan ID5, Birlik Manastırı ID9); aynı hücreyi paylaşan eski kimlik (baris-alani) bir kez.
    for (const [id, f] of Object.entries(T.formlar ?? {})) if (!seen.has(`${f.ikinci}@${f.esik}`)) { seen.add(`${f.ikinci}@${f.esik}`); cols.push({ cell: f.ikinci, id, level: f.esik, label: `${id} ${f.esik}+` }); }
    for (const c of cols) {
      const sheet = { ...base, raceId: v.race, classId: cls, gender, level: c.level, ...(v.lineage ? { lineageId: v.lineage } : {}), ...(v.tone ? { skinTone: v.tone } : {}), ...(v.awakening ? { celestialAwakening: v.awakening } : {}), ...(c.id ? { subclassId: c.id } : {}) } as CharacterSheet;
      const token = sheetAvatar(sheet).src.replace('characters/', '');
      if (c.cell !== 'GR' && !token.endsWith(`-${c.cell}.webp`)) continue; // cinsiyet kısıtlı ya da jeton yok: atla
      if (c.cell === 'GR' && v.race === 'celestial') continue; // Celestial Gariban bağlı değil
      list.push({ n: list.length, race: v.race, lineage: v.name, ...(v.tone ? { tone: v.tone } : {}), gender, cls, sub: c.label, ...(c.id ? { subId: c.id } : {}), level: c.level, group: v.group, kind: v.kind, label: `${v.race}·${v.name}·${gender === 'erkek' ? 'E' : 'K'}·${cls}·${c.label}`, token, sheet });
    }
  }
  return list;
}
