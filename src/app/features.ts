/** Kuyruk 14 Y1: deneysel özellik bayrakları (yerel; varsayılan kapalı). Ana parçada: yalnızca okuma/yazma. */
const KEY = 'rpg-battle-deneysel';

function read(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, boolean>; } catch { return {}; }
}

/** Yolculuk (deneme) açık mı. Varsayılan kapalı: ana menüde giriş görünmez, mevcut davranış aynı. */
export const journeyEnabled = (): boolean => read().yolculuk === true;

export function setJourneyEnabled(on: boolean): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), yolculuk: on })); } catch { /* depolama yok */ }
}

/** Kuyruk 38: "Üst seviye (6–20)" (Game Master; varsayılan kapalı): oluşturucu ve ilerleme 20. seviyeye dek (Kuyruk 19; önce 10). */
export const upperLevelsEnabled = (): boolean => read().ustSeviye === true;

export function setUpperLevelsEnabled(on: boolean): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), ustSeviye: on })); } catch { /* depolama yok */ }
}

/** Kuyruk K20: Celestial (Düşmüş) ırkı ev kuralı (Game Master; varsayılan kapalı): oluşturucuda seçilir, yeni savaşlarda `celestialIrki` açık gelir. */
export const celestialEnabled = (): boolean => read().celestial === true;

export function setCelestialEnabled(on: boolean): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), celestial: on })); } catch { /* depolama yok */ }
}

/**
 * Görev AS2: Karadul Çemberi ve imza alt sınıf anahtarları kalktı (120 alt sınıf hep seçilebilir; cinsiyet kuralı alt
 * sınıfın kendisinde, `SubclassDef.cinsiyet`). Eski `rpg-battle-deneysel` kayıtlarındaki `karadul`, `karadulKadinKisiti`,
 * `imza` alanları artık okunmaz. Karakter ev kuralı varsayılanları (Game Master kurulumu ve yeni savaş): hizalanma.
 */
export const characterHouseRules = (): Record<string, boolean> => ({
  ...(read().hizalanma === true ? { hizalanma: true } : {}), ...(read().hizalanmaMoral === true ? { hizalanmaMoral: true } : {}),
});

/** Kuyruk K51: hizalanma ev kuralı (Game Master; varsayılan kapalı; kapalıyken hiçbir yerde görünmez). */
export const alignmentEnabled = (): boolean => read().hizalanma === true;
export function setAlignmentEnabled(on: boolean): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), hizalanma: on })); } catch { /* depolama yok */ }
}
/** Kuyruk K51: ırk katkısı başlangıç hesabında (`hizalanmaIrk`, varsayılan açık). */
export const alignmentRace = (): boolean => (read() as Record<string, unknown>).hizalanmaIrk !== false;
export function setAlignmentRace(on: boolean): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), hizalanmaIrk: on })); } catch { /* depolama yok */ }
}
/** Kuyruk K51: başlangıç yalnız otomatik (kabul etmeme kapalı; Game Master). */
export const alignmentAutoOnly = (): boolean => (read() as Record<string, unknown>).hizalanmaYalnizOtomatik === true;
export function setAlignmentAutoOnly(on: boolean): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), hizalanmaYalnizOtomatik: on })); } catch { /* depolama yok */ }
}

/** Kuyruk K52: hizalanma ↔ Moral bağı (ev kuralı `hizalanmaMoral`, varsayılan kapalı; hizalanma ve moralSistemi de açıkken çalışır). */
export const alignmentMoralEnabled = (): boolean => read().hizalanmaMoral === true;
export function setAlignmentMoralEnabled(on: boolean): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), hizalanmaMoral: on })); } catch { /* depolama yok */ }
}
