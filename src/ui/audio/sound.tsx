/**
 * Ses sisteminin arayüz bağlantısı (Görev S): sahne istekleri, ayarlar ve motorun tembel yüklenmesi.
 * Sahne önceliği: savaş > menü (ekran eşlemesi `SCREEN_SOUND`). Menü ekranları ve Game Master kurulumu: temaya göre
 * menü müziği; savaş ekranı: haritanın ortam sesi + yavaşça açılan savaş müziği. Savaş ekranı kapanınca menü döner.
 * Motor (Web Audio, `engine.ts`) ayrı parça: tarayıcı zaten ilk dokunuştan önce ses çaldırmaz, o anda yüklenir.
 */
import { useEffect, useState } from 'react';
import type { BattleState } from '../../battle';
import type { Scene, SoundEngine } from './engine';
import { onDiceSound } from '../diceSound';
import { SOUND, battleScene, loadSoundSettings, menuTrack, saveSoundSettings, type SoundContext, type SoundSettings } from './soundPlan';

let engine: SoundEngine | null = null;
let loading: Promise<SoundEngine | null> | null = null;

/** Motoru yükler (ilk dokunuşta); tarayıcıda doğrulama için `window.__rpgSes`. */
function loadEngine(): Promise<SoundEngine | null> {
  loading ??= import('./engine').then((m) => {
    engine = new m.SoundEngine(import.meta.env.BASE_URL);
    engine.applySettings(loadSoundSettings());
    (globalThis as { __rpgSes?: SoundEngine }).__rpgSes = engine;
    return engine;
  }, () => null);
  return loading;
}

type Layer = 'menu' | 'battle';
const ORDER: Layer[] = ['battle', 'menu'];
const layers: Partial<Record<Layer, Scene | null>> = {};
/** En öncelikli sahne isteği. */
export const currentScene = (): Scene | null => ORDER.map((l) => layers[l]).find((s) => s) ?? null;
function refresh(): void {
  const top = currentScene();
  if (top && engine) engine.setScene(top);
}
export function requestScene(layer: Layer, scene: Scene | null): void {
  layers[layer] = scene;
  refresh();
}

/** Tarayıcıda doğrulama: motor yüklenmeden önce durum. */
(globalThis as { __rpgSes?: unknown }).__rpgSes = { debug: () => ({ state: 'none', unlocked: false, playing: [], buses: [], scene: currentScene()?.key ?? null }) };

/** Uygulama açılışında bir kez: ilk dokunuşta motor yüklenip ses başlar, sekme gizlenince durur, zar olayları dinlenir. */
export function useSoundBoot(): void {
  useEffect(() => {
    const unlock = () => {
      void loadEngine().then((e) => {
        if (!e) return;
        const s = currentScene();
        if (s) e.setScene(s);
        e.unlock();
      });
    };
    const vis = () => engine?.visibility(document.visibilityState === 'hidden');
    window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    window.addEventListener('keydown', unlock, { capture: true });
    document.addEventListener('visibilitychange', vis);
    const offDice = onDiceSound((e) => engine?.dice(e));
    return () => {
      window.removeEventListener('pointerdown', unlock, { capture: true });
      window.removeEventListener('keydown', unlock, { capture: true });
      document.removeEventListener('visibilitychange', vis);
      offDice();
    };
  }, []);
}

export function menuScene(theme: 'light' | 'dark'): Scene {
  return { key: `menu:${theme}`, ambient: [], music: menuTrack(theme), musicLevel: 'menu', musicFadeIn: SOUND.timing.themeCrossfadeSec };
}

/** Savaşın ses bağlamı (harita, varyant, düşman canavarları, uyuyan ejderha ayarı). */
export function soundContextOf(state: BattleState): SoundContext {
  return {
    // Haritasız savaş oyunda yok (yalnızca simülasyon/test); eşlemesi yok, sessiz kalır.
    mapId: state.map?.id ?? '', variantId: state.map?.variantId ?? '',
    enemyMonsterIds: Object.values(state.combatants).filter((c) => c.side === 'enemies' && c.monsterId).map((c) => c.monsterId as string),
    dragonSetup: state.map?.dragon !== undefined,
  };
}

/** Savaş ekranı (yerleşim dahil, kayıttan yüklenen savaş da): ortam sesi ve yavaşça açılan savaş müziği. */
export function battleSoundScene(state: BattleState): Scene {
  const s = battleScene(soundContextOf(state));
  return {
    key: `battle:${s.ambient.join(',')}:${s.music}`,
    ambient: s.ambient, music: s.music, musicLevel: 'battle', musicFadeIn: SOUND.timing.musicFadeInSec,
  };
}

/** Bir ekranın sahne isteği: bağlı kaldıkça geçerli, kapanınca kalkar. */
export function useSceneRequest(layer: Layer, scene: Scene | null): void {
  const key = scene?.key ?? null;
  useEffect(() => {
    requestScene(layer, scene);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, key]);
  useEffect(() => () => requestScene(layer, null), [layer]);
}

/** Ses ayarları (kaydırıcılar, kapatma), bu tarayıcıda hatırlanır. */
export function useSoundSettings(): [SoundSettings, (v: SoundSettings) => void] {
  const [v, setV] = useState<SoundSettings>(loadSoundSettings);
  const set = (next: SoundSettings) => { setV(next); saveSoundSettings(next); engine?.applySettings(next); };
  return [v, set];
}
