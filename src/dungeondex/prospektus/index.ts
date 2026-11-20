/** Dungeondex prospektüsü: saf bölüm modülü (bileşen `ProspektusSections.tsx` ayrı dosyada). */
export * from './types';
export { esyaProspektus, esyaIds, findEsya, ESYA_DATA, type EsyaTur, type ProStrings } from './esya';
export { buyuProspektus, spellStatus, BUYU_DATA, SPELL_BLOCKS, type BuyuKayit, type BuyuSure } from './buyu';
export { featProspektus, turOzellikProspektus, sinifOzellikProspektus, altSinifProspektus, OZELLIK_DATA } from './ozellik';
