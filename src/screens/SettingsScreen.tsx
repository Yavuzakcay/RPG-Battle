/**
 * Ayarlar (Görev E1; tembel parça): "Dış içerik" bölümü. Paketler dosya seçiciyle (mobil dahil) ya da masaüstünde
 * klasör seçiciyle içe aktarılır; yerel `icerik/` klasörü kendiliğinden yüklenir. Görev AS2: paket aç/kapa, silme ve
 * kopya politikası yok (alt sınıflar hep seçilebilir); yalnız toplam ve geçersiz paket hatası. Hata mesajları TR/EN,
 * bozuk dosya uygulamayı bozmaz. Kod çalıştırılmaz: yalnızca JSON veri.
 */
import { alignmentAutoOnly, alignmentEnabled, alignmentMoralEnabled, alignmentRace, setAlignmentMoralEnabled, setAlignmentAutoOnly, setAlignmentEnabled, setAlignmentRace, journeyEnabled, setJourneyEnabled, setUpperLevelsEnabled, upperLevelsEnabled } from '../app/features';
import { useState } from 'react';
import { getLang, t } from '../i18n';
import { textOf } from '../rules/subclasses';
import { CARRY_RULES, type CarryRule } from '../rules/carry';
import { saveCarryRule, storedCarryRule } from '../ui/carrySetting';
import { saveEndVideo, storedEndVideo } from '../ui/endVideoSetting';
import { saveMapTint, storedMapTint } from '../ui/mapTintSetting';
import { saveCityView, storedCityView } from '../ui/cityViewSetting';
import { DiscoveryBook } from '../ui/preview/DiscoveryBook';
import { loadSettings as loadPv, saveSettings as savePv, type PreviewSettings } from '../app/discovery';
import { DICE_THEMES, diceThemeName, saveDiceTheme, storedDiceTheme } from '../ui/diceTheme';
import { LIMITS, type ContentError } from '../content/schema';
import { applyStoredContent, folderSupported, importTexts, readFiles, readFolder, type ImportResult, type PackRow } from '../content/store';

export function errorText(e: ContentError): string {
  const f = t().content.errors[e.code];
  return f ? f(e.path, e.detail ?? '') : `${e.code} (${e.path})`;
}

export function SettingsScreen(props: { onBack: () => void; onChanged?: () => void }) {
  const C = t().content;
  const lang = getLang();
  const [rows, setRows] = useState<PackRow[]>(() => applyStoredContent());
  const [results, setResults] = useState<ImportResult[]>([]);
  const K = t().carry;
  const [carry, setCarry] = useState<CarryRule>(storedCarryRule);
  const V = t().endVideo;
  const [video, setVideo] = useState<boolean>(storedEndVideo);
  const [upper, setUpper] = useState<boolean>(upperLevelsEnabled);
  const [align, setAlign] = useState({ on: alignmentEnabled(), race: alignmentRace(), auto: alignmentAutoOnly(), moral: alignmentMoralEnabled() });
  const MT = t().mapTint;
  const CV = t().cityView;
  const [tint, setTint] = useState<boolean>(storedMapTint);
  const [city, setCity] = useState<boolean>(storedCityView);
  // Kuyruk K58: önizleme ve keşif ayarları.
  const [pv, setPv] = useState<PreviewSettings>(loadPv);
  const setPvs = (p: Partial<PreviewSettings>) => { const n = { ...pv, ...p }; savePv(n); setPv(n); };
  const PV = t().previewSetting;
  const [diceTheme, setDiceTheme] = useState<string>(storedDiceTheme);
  const DT = t().diceThemeSetting;
  const [journey, setJourney] = useState<boolean>(journeyEnabled);
  const changed = (next: PackRow[]) => { setRows(next); props.onChanged?.(); };
  const load = (files: Array<{ name: string; text: string; bytes: number }>) => {
    setResults(importTexts(files));
    changed(applyStoredContent());
  };
  return (
    <div className="menu-screen">
      <main className="app settings">
        <header><h1>{C.settingsTitle}</h1><button className="ghost" onClick={props.onBack}>{t().common.home}</button></header>
        {/* Kuyruk 14 Y1: deneysel yolculuk bayrağı (varsayılan kapalı). */}
        <section className="panel" aria-labelledby="deneysel">
          <h2 id="deneysel">{t().journey.flag}</h2>
          <label><input type="checkbox" checked={journey} onChange={(e) => { setJourneyEnabled(e.target.checked); setJourney(e.target.checked); }} /> {t().journey.flag}</label>
          {/* Kuyruk 38: Game Master "Üst seviye (6–20)" (varsayılan kapalı). */}
          <label><input type="checkbox" checked={upper} onChange={(e) => { setUpperLevelsEnabled(e.target.checked); setUpper(e.target.checked); }} /> {t().journey.upperFlag}</label>
          <p className="mute">{t().journey.upperNote}</p>
          {/* Görev AS2: Karadul Çemberi ve imza alt sınıf anahtarları kalktı (alt sınıflar hep seçilebilir). */}
          {/* Kuyruk K51: hizalanma ev kuralı (varsayılan kapalı) ve iki Game Master ayarı. */}
          <fieldset className="align-flags"><legend>{t().view.hizalanma.flag}</legend>
            <label><input type="checkbox" checked={align.on} onChange={(e) => { setAlignmentEnabled(e.target.checked); setAlign({ ...align, on: e.target.checked }); }} /> {t().view.hizalanma.flag}</label>
            <label><input type="checkbox" checked={align.race} disabled={!align.on} onChange={(e) => { setAlignmentRace(e.target.checked); setAlign({ ...align, race: e.target.checked }); }} /> {t().view.hizalanma.raceFlag}</label>
            <label><input type="checkbox" checked={align.auto} disabled={!align.on} onChange={(e) => { setAlignmentAutoOnly(e.target.checked); setAlign({ ...align, auto: e.target.checked }); }} /> {t().view.hizalanma.autoFlag}</label>
            <label><input type="checkbox" checked={align.moral} disabled={!align.on} onChange={(e) => { setAlignmentMoralEnabled(e.target.checked); setAlign({ ...align, moral: e.target.checked }); }} /> {t().view.hizalanma.moralFlag}</label>
            <p className="mute">{t().view.hizalanma.note}</p>
          </fieldset>
          <p className="mute">{t().journey.flagNote}</p>
        </section>
        {/* Görev K5: taşıma yükü kuralı. */}
        <section className="panel" aria-labelledby="tasima">
          <h2 id="tasima">{K.title}</h2>
          <div className="seg" role="radiogroup" aria-label={K.title}>
            {CARRY_RULES.map((r) => (
              <button key={r} role="radio" aria-checked={carry === r} className={carry === r ? 'on' : ''}
                onClick={() => { saveCarryRule(r); setCarry(r); }}>{K.rule[r]}</button>
            ))}
          </div>
          <p className="mute">{K.help[carry]}</p>
        </section>
        {/* Görev U3: savaş sonu başlık videosu. */}
        <section className="panel" aria-labelledby="son-video">
          <h2 id="son-video">{V.title}</h2>
          <div className="seg" role="radiogroup" aria-label={V.title}>
            {[true, false].map((on) => (
              <button key={String(on)} role="radio" aria-checked={video === on} className={video === on ? 'on' : ''}
                onClick={() => { saveEndVideo(on); setVideo(on); }}>{on ? V.on : V.off}</button>
            ))}
          </div>
          <p className="mute">{V.help}</p>
        </section>
        {/* Kuyruk 17 G6: zar teması (yalnızca görünüm). */}
        <section className="panel" aria-labelledby="zar-temasi">
          <h2 id="zar-temasi">{DT.title}</h2>
          <div className="seg" role="radiogroup" aria-label={DT.title}>
            {DICE_THEMES.map((x) => (
              <button key={x.id} role="radio" aria-checked={diceTheme === x.id} className={diceTheme === x.id ? 'on' : ''} data-zar-tema={x.id}
                onClick={() => { saveDiceTheme(x.id); setDiceTheme(x.id); }}>{diceThemeName(x, getLang())}</button>
            ))}
          </div>
          <p className="mute">{DT.help}</p>
        </section>
        {/* Kuyruk K58: hamle önizlemesi, keşif modu ve Keşif Defteri. */}
        <section className="panel" aria-labelledby="onizleme">
          <h2 id="onizleme">{PV.title}</h2>
          <div className="seg" role="radiogroup" aria-label={PV.title}>
            {[true, false].map((on) => <button key={String(on)} role="radio" aria-checked={pv.on === on} className={pv.on === on ? 'on' : ''} onClick={() => setPvs({ on })}>{on ? PV.on : PV.off}</button>)}
            {(['kisa', 'tam'] as const).map((d) => <button key={d} role="radio" aria-checked={pv.detail === d} className={pv.detail === d ? 'on' : ''} onClick={() => setPvs({ detail: d })}>{PV[d]}</button>)}
          </div>
          <p className="mute">{PV.help}</p>
          <div className="seg" role="radiogroup" aria-label={PV.discovery}>
            <small>{PV.discovery}</small>
            {[true, false].map((on) => <button key={String(on)} role="radio" aria-checked={pv.discovery === on} className={pv.discovery === on ? 'on' : ''} onClick={() => setPvs({ discovery: on })}>{on ? PV.on : PV.off}</button>)}
          </div>
          <p className="mute">{PV.discoveryHelp}</p>
          <div className="seg" role="radiogroup" aria-label={PV.hints}>
            <small>{PV.hints}</small>
            {[true, false].map((on) => <button key={String(on)} role="radio" aria-checked={pv.hints === on} className={pv.hints === on ? 'on' : ''} onClick={() => setPvs({ hints: on })}>{on ? PV.on : PV.off}</button>)}
          </div>
          <p className="mute">{PV.hintsHelp}</p>
          <DiscoveryBook />
        </section>
        {/* Kuyruk 44: Game Master ayarı, yerleşimde şehir görünümü (kapalıysa eski hub). */}
        <section className="panel" aria-labelledby="sehir-gorunum">
          <h2 id="sehir-gorunum">{CV.title}</h2>
          <div className="seg" role="radiogroup" aria-label={CV.title}>
            {[true, false].map((on) => (
              <button key={String(on)} role="radio" aria-checked={city === on} className={city === on ? 'on' : ''}
                onClick={() => { saveCityView(on); setCity(on); }}>{on ? CV.on : CV.off}</button>
            ))}
          </div>
          <p className="mute">{CV.help}</p>
        </section>
        {/* Kuyruk 35: yerleşim görünümü savaş haritasında. */}
        <section className="panel" aria-labelledby="harita-renk">
          <h2 id="harita-renk">{MT.title}</h2>
          <div className="seg" role="radiogroup" aria-label={MT.title}>
            {[true, false].map((on) => (
              <button key={String(on)} role="radio" aria-checked={tint === on} className={tint === on ? 'on' : ''}
                onClick={() => { saveMapTint(on); setTint(on); }}>{on ? MT.on : MT.off}</button>
            ))}
          </div>
          <p className="mute">{MT.help}</p>
        </section>
        <section className="panel content-section" aria-labelledby="dis-icerik">
          <h2 id="dis-icerik">{C.title}</h2>
          <p className="mute">{C.intro}</p>
          <p className="mute">{C.limits(LIMITS.fileBytes / 1024, LIMITS.packs)}</p>
          <div className="gm-row">
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
          {/* Görev AS2: paket başına satır, aç/kapa ve sil yok; yalnız toplam ve geçersiz paketlerin ilk hatası. */}
          {rows.length === 0 ? <p className="mute">{C.empty}</p> : (
            <p className="mute">{C.loadedTotal(rows.filter((r) => r.errors.length === 0).reduce((n, r) => n + r.pack.subclasses.length, 0), rows.filter((r) => r.errors.length === 0).length)}</p>
          )}
          {rows.filter((r) => r.errors.length > 0).map((r) => (
            <p key={r.pack.id} className="error">{textOf(r.pack.name ?? { tr: r.pack.id, en: r.pack.id }, lang)} ({r.pack.id}): {C.invalid}: {errorText(r.errors[0] as ContentError)}</p>
          ))}
        </section>
      </main>
    </div>
  );
}
