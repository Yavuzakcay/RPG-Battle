/**
 * Kuyruk K20: Celestial (Düşmüş) ev kuralı verisi (`data/celestial.json`). Oluşturucu ve savaş motoru ortak okur;
 * motor kancaları `src/battle/celestial.ts`. Saf.
 */
import data from '../../data/celestial.json';

type Text = { tr: string; en: string };
export type AwakeningOption = Text & { metin: Text; strikeType: string; icon: string; radiusFt?: number; auraDamage?: string; auraType?: string;
  lightFt?: number; save?: string; dcAbility?: string; condition?: string; flyFraction?: number };
export const CELESTIAL = data as unknown as {
  lightSpell: string; healingTouch: { die: string; count: string; touch: boolean; resource: string };
  awakening: { minLevel: number; rounds: number; resource: string; bonus: string; default: string; secenekler: Record<string, AwakeningOption> };
  ozellikler: Array<Text & { id: string; minLevel?: number; metin: Text }>;
  hikaye: Text; altBaslik: Text; yurt: string; baslangic: string;
};
export const AWAKENING_OPTIONS = Object.keys(CELESTIAL.awakening.secenekler);
