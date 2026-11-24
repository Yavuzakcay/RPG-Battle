/**
 * Paket (Serüven öncesi): kanat verisi (`data/kanat-esleme.json`, `data/dragonborn-kanat-kok.json`; ≈13 kB) ana parçadan
 * çıktı, tembel parça. Yalnız görünüm. Uygulama sınıf verisiyle birlikte yükler (`App.tsx` `useClassData`); yüklenene dek
 * kanat katmanı yok, rozet ve jetonlar `useWingData` ile yüklenince yeniden çizilir. Testler `test-setup.ts`'te bekler.
 */
import { useEffect, useState } from 'react';
import type { WingSlotData } from './lineageLook';

export interface WingTable { klasor: string; slotlar: Record<string, WingSlotData>; /** CELESTIAL-KANAT-IYILESME: uyanış → uçuşun iyileştiği seviye (`data/celestial.json` `ucus.seviyeEsigi`). */ iyilesmeEsigi: Record<string, number> }
export interface WingRootTable { sinif: Record<string, number[]>; jeton: Record<string, number[]> }

/** Yüklenene dek boş tablo (kanat yok). */
export const wingTable: WingTable = { klasor: '', slotlar: {}, iyilesmeEsigi: {} };
export const wingRootTable: WingRootTable = { sinif: {}, jeton: {} };
/** Kanat slot kimlikleri (yüklenince dolar). */
export const WING_SLOTS: string[] = [];

let loading: Promise<void> | null = null;
let loaded = false;
const listeners = new Set<() => void>();
export const wingDataLoaded = (): boolean => loaded;

export function loadWingData(): Promise<void> {
  loading ??= Promise.all([import('../../data/kanat-esleme.json'), import('../../data/dragonborn-kanat-kok.json'), import('../../data/celestial.json')]).then(([k, r, c]) => {
    if (loaded) return;
    const w = k.default as unknown as WingTable, kr = r.default as unknown as WingRootTable;
    // Aynı nesneler (kopya değil): testler veri modülünü geçici olarak değiştirebilir.
    wingTable.klasor = w.klasor;
    wingTable.slotlar = w.slotlar;
    wingTable.iyilesmeEsigi = celestialThresholds(c.default);
    WING_SLOTS.push(...Object.keys(w.slotlar));
    wingRootTable.sinif = kr.sinif;
    wingRootTable.jeton = kr.jeton;
    loaded = true;
    for (const f of listeners) f();
  });
  return loading;
}

/**
 * CELESTIAL-KANAT-IYILESME: Göksel Uyanış seçeneklerinden uçuş seviye eşiği (`ucus.seviyeEsigi`; Kırık Kanat 13). Celestial verisi
 * kanat verisiyle birlikte tembel (ana parçaya girmez); eşik yokken iyileşme yok.
 */
export function celestialThresholds(data: unknown): Record<string, number> {
  const sec = (data as { awakening?: { secenekler?: Record<string, { ucus?: { seviyeEsigi?: unknown } }> } }).awakening?.secenekler ?? {};
  const out: Record<string, number> = {};
  for (const [id, o] of Object.entries(sec)) if (typeof o.ucus?.seviyeEsigi === 'number') out[id] = o.ucus.seviyeEsigi;
  return out;
}

/** Bileşen kancası: veri yoksa yüklemeyi başlatır, yüklenince bileşen yeniden çizilir. */
export function useWingData(): boolean {
  const [, rerender] = useState(0);
  useEffect(() => {
    if (loaded) return;
    const f = () => rerender((n) => n + 1);
    listeners.add(f);
    void loadWingData().catch(() => { /* Kanatsız devam (yalnız görünüm). */ });
    return () => { listeners.delete(f); };
  }, []);
  return loaded;
}
