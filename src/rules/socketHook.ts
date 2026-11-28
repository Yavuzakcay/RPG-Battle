/**
 * Görev KATALOG-GUC-TAM D: yuva kuralı (`sockets.ts`, `data/yuva-kurallari.json`) tembel parçada; `loadClassData` katalog
 * eşyalarıyla birlikte yükleyip burada kaydeder (ana parça sınırı; `mcHook.ts` deseni). Mühür taşları yalnız katalog eşyası
 * olduğundan kayıt öncesinde taş yoktur. Yaprak modül.
 */
export interface SocketImpl { isStone: (id: string) => boolean; socketItemNames: (s: { itemNames: string[]; armorName?: string | null; shield?: boolean; yuvalar?: Record<string, string[]> }) => string[] }
let impl: SocketImpl | null = null;
export const setSocketImpl = (x: SocketImpl): void => { impl = x; };
export const socketImpl = (): SocketImpl | null => impl;
