export const BLOCKS: string[];
export function mergedOf(s: Record<string, unknown>): Record<string, unknown>;
export interface DurumRow { id: string; name: string; level: number; file: string; textEmpty: boolean; durum: 'çalışır' | 'kısmi' | 'yok' | 'savaş dışı'; neden?: string; blok?: string; gm?: string; kapsam?: string; sigmayan?: string; upgrade?: boolean }
export function classify(game: Record<string, unknown> | undefined): Omit<DurumRow, 'id' | 'name' | 'level' | 'file' | 'textEmpty'>;
export function durumRows(srd: Array<{ id: string; name: string; level: number }>, game: Array<Record<string, unknown>>): DurumRow[];
