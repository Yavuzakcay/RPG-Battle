import gorunum from '../../data/alt-soy-gorunum.json';
/** Celestial Göksel Uyanış kimlikleri (veriden). */
export const CELESTIAL_AWAKENINGS: string[] = Object.keys((gorunum as unknown as { celestialUyanis: Record<string, unknown> }).celestialUyanis);
