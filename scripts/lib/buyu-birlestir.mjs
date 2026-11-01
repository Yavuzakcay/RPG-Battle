/**
 * Kuyruk 41b: `npm run srd:buyu` birleştirmesi. Elle yazılmış yukarı slot tanımı (`mechanics.upcast`: zar, süre
 * eşikleri `durationBySlot`, `bonusBySlot`, `radiusFt`, `burstDice`, `applied`…) olduğu gibi korunur; SRD metninden
 * üretilen tanım yalnızca upcast hiç yoksa yazılır (alan alan karıştırmak motorun uyguladığı zarı değiştirebilir).
 * Eski `upcastDice: true` işareti `applied` olarak taşınır.
 */
export function mergeUpcast(mechanics, srdUpcast) {
  const m = { ...mechanics };
  const legacy = m.upcastDice === true;
  delete m.upcastDice;
  const up = m.upcast ?? srdUpcast ?? null;
  if (!up) return m;
  m.upcast = legacy ? { ...up, applied: true } : up;
  return m;
}

/**
 * Döküm süresi: motor yalnızca eylem/bonus/tepki/ritüel tanır (`Spell.castingTime`). SRD'deki uzun süreler ("1 minute",
 * "10 minutes", "Ritual") savaşta anlamsız; var olan değer korunur (ritüel yalnızca kurulumda, savaş dışı büyüler menüde
 * "savaş dışı" notuyla görünür kalır). Eylem/bonus/tepki SRD'den eşitlenir.
 */
export function mergeCastingTime(current, fromSrd) {
  const combat = fromSrd === 'action' || fromSrd === 'bonus' || fromSrd === 'reaction';
  if (current === 'ritual' || (!combat && current !== undefined)) return current;
  return fromSrd;
}
