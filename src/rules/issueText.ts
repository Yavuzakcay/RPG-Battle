/**
 * Görev SD4: oluşturucu sorun metinlerine saf erişim. Metinler `src/i18n/strings.ts` (TR) ve `strings.en.ts` (EN) `issues`
 * bölümünde; kural modülleri (`src/rules/*`) i18n'in tarayıcı belleğine dokunan kısmını içe aktarmaz: varsayılan Türkçe
 * tablo, arayüz dili `src/i18n/index.ts` tarafından `setIssueTexts` ile bağlanır (dil değişince EN tablosu).
 */
import { STRINGS_TR } from '../i18n/strings';

export type IssueTexts = (typeof STRINGS_TR)['issues'];
let provider: () => IssueTexts = () => STRINGS_TR.issues;
export const setIssueTexts = (f: () => IssueTexts): void => { provider = f; };
/** Geçerli dilin sorun metinleri. */
export const I = (): IssueTexts => provider();
