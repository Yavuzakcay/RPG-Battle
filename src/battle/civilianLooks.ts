/** Masum görünümleri (Görev F ek): veri `data/masumlar.json`, görseller `npm run masumlar` ile üretilir. */
import civilianData from '../../data/masumlar.json';
import { seededRng } from '../rules/dice';
import type { Combatant } from './types';

/** Masum görünümleri (data/masumlar.json): kimlik, görünen ad, görsel. */
export interface CivilianLook { id: string; name: string; image: string }
export const CIVILIAN_LOOKS: readonly CivilianLook[] = civilianData.masumlar;
export const civilianLook = (id: string | undefined): CivilianLook | undefined => CIVILIAN_LOOKS.find((l) => l.id === id);

/** Masum görünüm kimlikleri `seed` ile karışık sırada (savaşın zarlarını tüketmez). */
export function civilianArt(seed: number): string[] {
  const out = CIVILIAN_LOOKS.map((l) => l.id);
  const r = seededRng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j] as string, out[i] as string];
  }
  return out;
}

/** N. masumun tohumlu varsayılan görünümü (GM seçmezse; `gorselId` alanı olmayan eski kayıtlar da buna düşer). */
export const defaultCivilianLook = (index: number, seed = 1): string => {
  const art = civilianArt(seed);
  return art[(Math.max(1, index) - 1) % art.length] as string;
};

/** Masumun görünümünü uygular: `gorselId` ve jeton görseli. */
export function withCivilianLook(c: Combatant, gorselId: string): Combatant {
  const look = civilianLook(gorselId);
  return look ? { ...c, gorselId: look.id, avatar: { ...c.avatar, src: look.image } } : c;
}


/** Arayüzde görünen ad: masumda "Masum: Tüccar", diğerlerinde kendi adı. */
export const displayName = (c: Pick<Combatant, 'name' | 'civilian' | 'gorselId'>): string => {
  const look = c.civilian ? civilianLook(c.gorselId) : undefined;
  return look ? `Masum: ${look.name}` : c.name;
};
