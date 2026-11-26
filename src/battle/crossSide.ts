/**
 * Görev OYUNCU-HEDEF-DOST: oyuncu/Game Master komutunda karşı taraf hedefi (`crossSide: true`, arayüzde onaylanır). SRD 5.2.1
 * hedefi tarafla sınırlamadığında motor taraf filtresi koymaz; bayrak yoksa eski davranış (yapay zekâ bayrak vermez, simülasyon
 * aynı). Rıza isteyen ("willing creature") büyüler `data/dost-hedef.json` `rizali`: rıza modeli yok, tarafları değişmez. Yaprak.
 */
import data from '../../data/dost-hedef.json';

const WILLING = new Set<string>(data.rizali);
/** Büyü SRD'de istekli yaratık ister (karşı tarafa yapılamaz). */
export const needsWilling = (spellName: string): boolean => WILLING.has(spellName);
/** Komutta karşı taraf hedefi onaylanmış mı. */
export const crossOk = (cmd: { crossSide?: true } | undefined): boolean => !!cmd?.crossSide;
