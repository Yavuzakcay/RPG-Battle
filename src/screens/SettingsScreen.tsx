/**
 * Ayarlar (tembel parça). SD8: sade ekran: oyuncunun ayarları üstte (dil, ses, efekt, savaş sonu videosu,
 * hamle önizlemesi, şehir görünümü, harita rengi, Keşif Defteri bağlantısı; zar seçimi SD8 eki: karakter oluşturucunun son ekranında); oda ayarları Game Master kurulumundaki
 * "Oda kuralları"na taşındı; "Gelişmiş" katında Dış içerik, Keşif Defteri yedeği, "Tüm zarlar açık". Saklama anahtarları aynı.
 * Dış içerik (Görev E1): paketler dosya seçiciyle (mobil dahil) ya da masaüstünde klasör seçiciyle içe aktarılır; yerel `icerik/` klasörü kendiliğinden yüklenir. Görev AS2: paket aç/kapa, silme ve
 * kopya politikası yok (alt sınıflar hep seçilebilir); yalnız toplam ve geçersiz paket hatası. Hata mesajları TR/EN,
 * bozuk dosya uygulamayı bozmaz. Kod çalıştırılmaz: yalnızca JSON veri.
 */
import { useState } from 'react';
import { LANGS, getLang, setLang, t, useLang } from '../i18n';
import { textOf } from '../rules/subclasses';
import { saveEndVideo, storedEndVideo } from '../ui/endVideoSetting';
import { saveMapTint, storedMapTint } from '../ui/mapTintSetting';
import { saveCityView, storedCityView } from '../ui/cityViewSetting';
import { saveDexCover, storedDexCover } from '../ui/dexCoverSetting';
import { DiscoveryBackup, DiscoveryBook } from '../ui/preview/DiscoveryBook';
import { counts, loadSettings as loadPv, loadStore, saveSettings as savePv, type PreviewSettings } from '../app/discovery';
import { SoundPanel } from '../ui/SoundPanel';
import { useEffectsSetting, useSpriteAnimSetting } from '../ui/effectsSetting';
import { Fold, OnOffRow, SegRow } from '../ui/settings/SegRow';
import { DiceAllOpenToggle } from '../ui/DiceThemePicker';
import { type ContentError } from '../content/schema';
import { applyStoredContent, folderSupported, importTexts, readFiles, readFolder, type ImportResult, type PackRow } from '../content/store';

export function errorText(e: ContentError): string {
  const f = t().content.errors[e.code];
  return f ? f(e.path, e.detail ?? '') : `${e.code} (${e.path})`;
}

export function SettingsScreen(props: { onBack: () => void; onChanged?: () => void }) {
  const C = t().content;
  const U = t().settingsUi;
  const lang = useLang();
  const langNow = getLang();
  const [view, setView] = useState<'main' | 'book'>('main');
  const [rows, setRows] = useState<PackRow[]>(() => applyStoredContent());
  const [results, setResults] = useState<ImportResult[]>([]);
  const [video, setVideo] = useState<boolean>(storedEndVideo);
  const [tint, setTint] = useState<boolean>(storedMapTint);
  const [city, setCity] = useState<boolean>(storedCityView);
  const [dexCover, setDexCover] = useState<boolean>(storedDexCover);
  const [pv, setPv] = useState<PreviewSettings>(loadPv);
  const setPvs = (p: Partial<PreviewSettings>) => { const n = { ...pv, ...p }; savePv(n); setPv(n); };
  const [fxOn, setFxOn] = useEffectsSetting();
  const [spriteAnim, setSpriteAnim] = useSpriteAnimSetting();
  const changed = (next: PackRow[]) => { setRows(next); props.onChanged?.(); };
  const load = (files: Array<{ name: string; text: string; bytes: number }>) => {
    setResults(importTexts(files));
    changed(applyStoredContent());
  };
  const found = counts(loadStore());
  if (view === 'book') {
    return (
      <div className="menu-screen">
        <main className="app settings">
          <header><h1>{U.book} {found.found}/{found.total}</h1><button className="ghost" onClick={() => setView('main')}>{U.bookBack}</button></header>
          <section className="panel"><DiscoveryBook /></section>
        </main>
      </div>
    );
  }
  return (
    <div className="menu-screen">
      <main className="app settings">
        <header><h1>{C.settingsTitle}</h1><button className="ghost" onClick={props.onBack}>{t().common.home}</button></header>
        <section className="panel set-panel" aria-label={C.settingsTitle}>
          <div className="set-row">
            <div className="set-text"><strong>{U.language}</strong></div>
            <div className="set-seg" role="radiogroup" aria-label={U.language}>
              {LANGS.map((l) => <button key={l} type="button" role="radio" aria-checked={lang === l} className={lang === l ? 'on' : 'ghost'} onClick={() => setLang(l)}>{t().lang[l]}</button>)}
            </div>
          </div>
          <div className="set-row set-sound"><div className="set-text"><strong>{U.sound}</strong></div><SoundPanel /></div>
          <OnOffRow label={U.effects} help={U.effectsHelp} value={spriteAnim} on={U.on} off={U.off} onChange={setSpriteAnim} />
          <OnOffRow label={U.mapFx} value={fxOn} on={U.on} off={U.off} onChange={setFxOn} />
          <OnOffRow label={U.video} help={U.videoHelp} value={video} on={U.on} off={U.off} onChange={(on) => { saveEndVideo(on); setVideo(on); }} />
          <OnOffRow label={U.preview} help={U.previewHelp} value={pv.on} on={U.on} off={U.off} onChange={(on) => setPvs({ on })} />
          {pv.on && <SegRow label={U.detail} value={pv.detail} options={[{ value: 'kisa', label: U.short }, { value: 'tam', label: U.full }]} onChange={(detail) => setPvs({ detail })} />}
          <OnOffRow label={U.dexCover} help={U.dexCoverHelp} value={dexCover} on={U.on} off={U.off} onChange={(on) => { saveDexCover(on); setDexCover(on); }} />
          <OnOffRow label={U.city} help={U.cityHelp} value={city} on={U.on} off={U.off} onChange={(on) => { saveCityView(on); setCity(on); }} />
          <OnOffRow label={U.tint} help={U.tintHelp} value={tint} on={U.on} off={U.off} onChange={(on) => { saveMapTint(on); setTint(on); }} />
          <div className="set-row">
            <div className="set-text"><strong>{U.book}</strong></div>
            <div className="set-seg"><button type="button" className="ghost" onClick={() => setView('book')}>{U.bookOpen} {found.found}/{found.total}</button></div>
          </div>
        </section>
        <Fold title={U.advanced} help={U.advancedHelp} className="panel settings-advanced">
          <DiceAllOpenToggle />
          <h3>{C.title}</h3>
          <p className="mute">{C.intro}</p>
          <div className="set-btns">
            <label className="file-btn">
              {C.importFiles}
              <input type="file" accept=".json,application/json" multiple
                onChange={(e: { target: HTMLInputElement }) => {
                  const files = e.target.files;
                  if (files) void readFiles(files).then(load);
                  e.target.value = '';
                }} />
            </label>
            <button className="ghost" disabled={!folderSupported()} title={folderSupported() ? undefined : C.folderUnsupported}
              onClick={() => { void readFolder().then((f) => { if (f) load(f); }, () => { /* seçim iptal */ }); }}>{C.importFolder}</button>
          </div>
          {!folderSupported() && <small className="mute">{C.folderUnsupported}</small>}
          {results.length > 0 && (
            <ul className="content-results" aria-live="polite">
              {results.map((r) => (
                <li key={r.file} className={r.ok ? 'ok' : 'error'}>
                  {r.ok ? C.loaded(r.file, r.packId ?? '') : C.failed(r.file)}
                  {r.errors.length > 0 && <ul>{r.errors.slice(0, 12).map((e, i) => <li key={i}>{errorText(e)}</li>)}</ul>}
                </li>
              ))}
            </ul>
          )}
          {/* SD8: 120 alt sınıf zaten hep seçilebilir; yalnız yüklü paket sayısı ve geçersiz paketlerin ilk hatası. */}
          {rows.length === 0 ? <p className="mute">{C.empty}</p> : <p className="mute">{U.packs(rows.filter((r) => r.errors.length === 0).length)}</p>}
          {rows.filter((r) => r.errors.length > 0).map((r) => (
            <p key={r.pack.id} className="error">{textOf(r.pack.name ?? { tr: r.pack.id, en: r.pack.id }, langNow)} ({r.pack.id}): {C.invalid}: {errorText(r.errors[0] as ContentError)}</p>
          ))}
          <h3>{U.backup}</h3>
          <DiscoveryBackup />
          {/* Görsel envanter galerisi (geliştirici aracı; `#galeri`, App tembel parça). */}
          <h3>{U.dev}</h3>
          <div className="set-row">
            <div className="set-text"><strong>{U.gallery}</strong><p className="mute">{U.galleryHelp}</p></div>
            <div className="set-seg"><button type="button" className="ghost" onClick={() => { window.location.hash = '#galeri'; }}>{U.galleryOpen}</button></div>
          </div>
        </Fold>
      </main>
    </div>
  );
}
