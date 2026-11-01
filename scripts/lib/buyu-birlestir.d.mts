export function mergeUpcast(mechanics: Record<string, unknown>, srdUpcast: Record<string, unknown> | null): Record<string, unknown> & { upcast?: unknown };
export function mergeCastingTime(current: string | undefined, fromSrd: string): string | undefined;
