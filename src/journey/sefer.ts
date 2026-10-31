/**
 * Kuyruk 18 V2: sefer (`data/seferler.json`) → yolculuk güzergâhı. İkinci motor yok: sefer, yolculuk motorunun
 * (`executeJourney`) bir güzergâhı olarak oynanır; HP, kaynak, altın ve iksir aynı yoldan taşınır, ilerleme yolculuk
 * kaydında (`rpg-battle-yolculuk`). Düğüm sırası verideki sıra; son düğümden (ödül) sonra salona dönüş = sefer biter.
 */
import data from '../../data/seferler.json';
import type { JourneyRoute, JourneyStop } from './types';

export interface SeferNode {
  id: string; kind: 'battle' | 'reward'; name: { tr: string; en: string }; scenario?: string; travelHours: number; potions?: number;
  x: number; y: number; thumb?: string; giris?: Array<[number, number]>; cikis?: Array<[number, number]>; hedef?: unknown;
  reward?: { gold: number; potions: number; items: string[] };
}
export interface SeferEdge { from: string; to: string; style?: 'dashed'; label?: { tr: string; en: string } }
export interface Sefer {
  id: string; name: { tr: string; en: string }; levels: number[]; nodes: SeferNode[]; edges: SeferEdge[];
  harita: { bands?: Array<{ from: number; to: number; color: string }>; gorsel?: string };
  odulSahnesi?: string;
}

export const SEFERLER = (data as unknown as { seferler: Sefer[] }).seferler;
export const seferById = (id: string): Sefer | undefined => SEFERLER.find((s) => s.id === id);

/** Seferin güzergâhı (verilen seviyede); güzergâh kimliği `sefer:<kimlik>:<seviye>`. */
export function seferRoute(sefer: Sefer, level: number): JourneyRoute {
  const stops: JourneyStop[] = sefer.nodes.map((n) => ({
    id: n.id, kind: n.kind, name: n.name, travelHours: n.travelHours,
    ...(n.scenario ? { scenario: n.scenario } : {}), ...(n.potions ? { potions: n.potions } : {}),
    ...(n.hedef ? { goals: n.hedef } : {}), ...(n.giris ? { partyStart: n.giris } : {}), ...(n.reward ? { reward: n.reward } : {}),
  }));
  return { id: `sefer:${sefer.id}:${level}`, name: sefer.name, level, stops };
}

/** Güzergâh bir sefere mi ait (sefer kimliği, yoksa null). */
export const seferOfRoute = (route: Pick<JourneyRoute, 'id'>): string | null => (route.id.startsWith('sefer:') ? route.id.split(':')[1] ?? null : null);
