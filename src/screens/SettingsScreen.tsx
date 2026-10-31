/**
 * Ayarlar (Görev E1; tembel parça): "Dış içerik" bölümü. Paketler dosya seçiciyle (mobil dahil) ya da masaüstünde
 * klasör seçiciyle içe aktarılır; liste, tek tek açma/kapama ve silme. Hata mesajları TR/EN, bozuk dosya uygulamayı
 * bozmaz. Kod çalıştırılmaz: yalnızca JSON veri.
 */
import { journeyEnabled, setJourneyEnabled } from '../app/features';
import { useState } from 'react';
import { getLang, t } from '../i18n';
import { textOf } from '../rules/subclasses';
import { CARRY_RULES, type CarryRule } from '../rules/carry';
import { saveCarryRule, storedCarryRule } from '../ui/carrySetting';
import { saveEndVideo, storedEndVideo } from '../ui/endVideoSetting';
import { LIMITS, type ContentError } from '../content/schema';
import { applyStoredContent, folderSupported, importTexts, readFiles, readFolder, removePack, setPackEnabled, type ImportResult, type PackRow } from '../content/store';

export function errorText(e: ContentError): string {
  const f = t().content.errors[e.code];
  return f ? f(e.path, e.detail ?? '') : `${e.code} (${e.path})`;
}

export function SettingsScreen(props: { onBack: () => void; onChanged?: () => void }) {
  const C = t().content;
  const lang = getLang();
  const [rows, setRows] = useState<PackRow[]>(() => applyStoredContent());
  const [results, setResults] = useState<ImportResult[]>([]);
  const [confirm, setConfirm] = useState<string | null>(null);
  const K = t().carry;
  const [carry, setCarry] = useState<CarryRule>(storedCarryRule);
  const V = t().endVideo;
  const [video, setVideo] = useState<boolean>(storedEndVideo);
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
          {rows.length === 0 ? <p className="mute">{C.empty}</p> : (
            <ul className="content-list">
              {rows.map((r) => (
                <li key={r.pack.id} className={r.errors.length ? 'invalid' : ''}>
                  <div>
                    <strong>{textOf(r.pack.name, lang)}</strong> <small className="mute">{r.pack.id}{r.pack.author ? ` · ${r.pack.author}` : ''}</small>
                    <small>{C.summary(r.summary.subclasses.length, r.summary.notWorking)}</small>
                    <small className="mute">{r.pack.subclasses.map((s) => `${textOf(s.name, lang)} (${s.class})`).join(', ')}</small>
                    {r.errors.length > 0 && <small className="error">{C.invalid}: {errorText(r.errors[0] as ContentError)}</small>}
                  </div>
                  <div className="card-actions">
                    <button className={r.enabled ? 'on' : 'ghost'} aria-pressed={r.enabled} onClick={() => changed(setPackEnabled(r.pack.id, !r.enabled))}>
                      {r.enabled ? C.enabled : C.disabled}
                    </button>
                    {confirm === r.pack.id ? (
                      <>
                        <span className="mute">{C.confirmRemove(textOf(r.pack.name, lang))}</span>
                        <button onClick={() => { setConfirm(null); changed(removePack(r.pack.id)); }}>{C.remove}</button>
                        <button className="ghost" onClick={() => setConfirm(null)}>{t().common.cancel}</button>
                      </>
                    ) : <button className="ghost" onClick={() => setConfirm(r.pack.id)}>{C.remove}</button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
