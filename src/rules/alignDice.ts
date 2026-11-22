/**
 * SD8 eki: Alignment zarları. Karakter başlangıçta bulunduğu karenin zarını kazanır; oyun sırasında Alignment başka kareye
 * geçerse yeni karenin zarı da açılır, eskisi silinmez (karakter kaydında `hizalanmaZarlar`, tekrarsız). Ev kuralı kapatılsa da
 * açılmış zarlar kalır. Yalnız görünüm; savaşa ve kural sürümüne girmez. Ana parçada kullanıldığı için bağımlılıksız.
 */
import type { SavedCharacter } from './builder';

type B = 'pos' | 'neu' | 'neg';
/** Eşik (`data/hizalanma.json` `esik`; JSON ana parçaya girmesin diye sabit, test eşitliği denetler). */
export const ALIGN_ESIK = 17;
const esik = ALIGN_ESIK;
const LAW = ['lawful', 'neutral', 'chaotic'], GOOD = ['good', 'neutral', 'evil'];
const ix = (b: B | undefined, v: number): number => (b ? (b === 'pos' ? 0 : b === 'neu' ? 1 : 2) : v >= esik ? 0 : v <= -esik ? 2 : 1);
const idAt = (d: number, g: number): string => (d === 1 && g === 1 ? 'hizalanma-true-neutral' : `hizalanma-${LAW[d]}-${GOOD[g]}`);

/** Alignment kaydının (kayıtlı kova, yoksa değerden) bulunduğu karenin zar kimliği. */
export function alignDiceOf(a: { duzen: number; iyilik: number; kova?: { duzen: B; iyilik: B } } | undefined): string | null {
  return a ? idAt(ix(a.kova?.duzen, a.duzen), ix(a.kova?.iyilik, a.iyilik)) : null;
}

/** Kayda yazılacak hâli: bulunduğu karenin zarı listeye eklenir (kare değişince yenisi eklenir, eskisi kalır). Değişmediyse aynı nesne. Ana parçada: küçük tutuldu. */
export function withAlignDice<T extends Pick<SavedCharacter, 'hizalanma' | 'hizalanmaZarlar'>>(c: T): T {
  const id = alignDiceOf(c.hizalanma);
  return !id || c.hizalanmaZarlar?.includes(id) ? c : { ...c, hizalanmaZarlar: [...(c.hizalanmaZarlar ?? []), id] };
}

/** 9 karenin tema kimlikleri (`data/zar-gorselleri.json` kategori `hizalanma`), ızgara sırasıyla (satır satır). */
export const ALIGN_DICE_IDS: string[] = [0, 1, 2].flatMap((g) => [0, 1, 2].map((d) => idAt(d, g)));
export const isAlignDice = (id: string): boolean => ALIGN_DICE_IDS.includes(id);

/** Karakterin sahip olduğu Alignment zarları: kayıtlı liste + bulunduğu karenin zarı (tekrarsız, ızgara sırasıyla). */
export function ownedAlignDice(c: Pick<SavedCharacter, 'hizalanma' | 'hizalanmaZarlar'>): string[] {
  const cur = alignDiceOf(c.hizalanma);
  const set = new Set([...(c.hizalanmaZarlar ?? []), ...(cur ? [cur] : [])]);
  return ALIGN_DICE_IDS.filter((id) => set.has(id));
}
