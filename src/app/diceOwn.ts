/**
 * SD8 eki: karakter başına zar sahipliği ve seçimi (yalnız görünüm). Sahip olunanlar: Klasik (hep), sınıf zarı, ırk zarı,
 * açılmış Alignment zarları (karakter kaydında kalıcı; ev kuralı kapansa da kalır) ve oyuncu profilinde açılmış ödül zarları.
 * Açılmamışlar listelenmez. Seçim karakter kaydında (`zar`); yoksa oyuncu profili seçimi (eski karakter yedeği), o da yoksa sınıf.
 * Seçili zar hiçbir koşulda yazılarak değiştirilmez: kullanılamıyorsa yalnız çizimde sınıf zarına düşülür.
 */
import { ALL_CHARACTERS, categoryOf, choiceOf, classTheme, isUnlocked, raceTheme, type DiceStore } from './diceUnlock';
import { ownedAlignDice, isAlignDice } from '../rules/alignDice';
import gorseller from '../../data/zar-gorselleri.json';
import type { SavedCharacter } from '../rules/builder';

const THEMES = gorseller.themes as unknown as Array<{ id: string; kategori?: string }>;
export type DiceKind = 'klasik' | 'sinif' | 'irk' | 'hizalanma' | 'odul';
export interface OwnedDie { value: string; themeId: string; kind: DiceKind }

/** Karakterin seçebileceği zarlar (değer = kayda yazılan: 'klasik' | 'sinif' | 'irk' | tema kimliği). */
export function ownedDice(c: Pick<SavedCharacter, 'id' | 'sheet' | 'hizalanma' | 'hizalanmaZarlar'>, store: DiceStore): OwnedDie[] {
  const out: OwnedDie[] = [{ value: 'klasik', themeId: 'klasik', kind: 'klasik' }];
  const cls = classTheme(c.sheet.classId); if (cls) out.push({ value: 'sinif', themeId: cls, kind: 'sinif' });
  const race = raceTheme(c.sheet.raceId); if (race) out.push({ value: 'irk', themeId: race, kind: 'irk' });
  for (const id of ownedAlignDice(c)) out.push({ value: id, themeId: id, kind: 'hizalanma' });
  for (const th of THEMES) {
    if (th.id === 'klasik' || out.some((o) => o.value === th.id)) continue;
    const cat = categoryOf(th.id);
    if (cat === 'sinif' || cat === 'irk' || cat === 'hizalanma') continue;
    if (isUnlocked(store, th.id)) out.push({ value: th.id, themeId: th.id, kind: 'odul' });
  }
  return out;
}

/** Karakterin seçimi (kayıtlı değer; yoksa profil yedeği, o da yoksa 'sinif'). Kayıt değişmez. */
export const savedChoice = (c: Pick<SavedCharacter, 'id' | 'zar'>, store: DiceStore): string => c.zar ?? choiceOf(store, c.id) ?? 'sinif';

/** Çizim için çözülmüş seçim: 'sinif' | 'irk' | tema kimliği. Sahip olunmayan değer çizimde sınıfa düşer (kayıt yazılmaz). */
export function resolveDice(c: Pick<SavedCharacter, 'id' | 'sheet' | 'zar' | 'hizalanma' | 'hizalanmaZarlar'>, store: DiceStore): string {
  const v = savedChoice(c, store);
  if (v === 'sinif' || v === 'irk') return v;
  if (v === 'klasik') return 'klasik';
  return ownedDice(c, store).some((o) => o.value === v) ? v : 'sinif';
}
export { ALL_CHARACTERS, isAlignDice };
