/**
 * Bitkinlik (Exhaustion; SRD 5.2.1 Rules Glossary, Görev S1): seviye 1–6, birikir. Her seviye d20 Testlerine
 * (saldırı, save, yetenek kontrolü) −2 ve hıza −5 ft; 6. seviyede ölüm. Uzun dinlenme 1 seviye azaltır. Saf.
 */
export const MAX_EXHAUSTION = 6;

/** d20 Testlerine ceza (pozitif sayı; 0 yoksa). */
export const exhaustionD20Penalty = (level: number | undefined): number => 2 * Math.max(0, Math.min(MAX_EXHAUSTION, level ?? 0));

/** Hız cezası (ft). */
export const exhaustionSpeedFt = (level: number | undefined): number => 5 * Math.max(0, Math.min(MAX_EXHAUSTION, level ?? 0));

/** Uzun dinlenme sonrası seviye. */
export const exhaustionAfterLongRest = (level: number | undefined): number => Math.max(0, (level ?? 0) - 1);
