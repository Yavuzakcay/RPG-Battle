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

/** Kuyruk K48: Karadul Çemberi ev kuralı (Game Master; varsayılan kapalı): oluşturucuda seçilir, yeni savaşlarda `karadulCemberi` açık gelir. */
export const karadulEnabled = (): boolean => read().karadul === true;
export function setKaradulEnabled(on: boolean): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), karadul: on })); } catch { /* depolama yok */ }
}
/** Kuyruk K48: Karadul yalnız kadın karakterlere (varsayılan açık; yalnızca oluşturucuda seçimi kapatır, savaşı etkilemez). */
export const karadulWomenOnly = (): boolean => read().karadulKadinKisiti !== false;
export function setKaradulWomenOnly(on: boolean): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), karadulKadinKisiti: on })); } catch { /* depolama yok */ }
}

/**
 * Kuyruk K50: imza alt sınıf ev kuralları (Game Master; her biri varsayılan kapalı; `imza_<ad>`): açık olan oluşturucuda
 * seçilir, yeni savaşlarda o ev kuralı açık gelir. Birlik Manastırı ev kuralı değil (her zaman).
 */
export const imzaEnabledList = (): string[] => {
  const v = (read() as Record<string, unknown>).imza;
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
};
export const imzaEnabled = (rule: string): boolean => imzaEnabledList().includes(rule);
export function setImzaEnabled(rule: string, on: boolean): void {
  const list = new Set(imzaEnabledList());
  if (on) list.add(rule); else list.delete(rule);
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), imza: [...list] })); } catch { /* depolama yok */ }
}
/** Karakter ev kuralı varsayılanları (Game Master kurulumu ve yeni savaş): Karadul + açık imza kuralları. */
export const characterHouseRules = (): Record<string, boolean> => ({
  karadulCemberi: karadulEnabled(), ...Object.fromEntries(imzaEnabledList().map((r) => [r, true])), ...(read().hizalanma === true ? { hizalanma: true } : {}),
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
