/** Durum ekranı: GOREV.md adımları ve haritalar. Ayrı parça (tembel yüklenir). */
import { readErrors } from '../ui/errorLog';
import { maps, variantLabel } from '../map/maps';
import { getLang, t } from '../i18n';
import gorev from '../../docs/harita/GOREV.md?raw';

/** GOREV.md'deki adımlar ve durumları: satırda "(tamam)" yazanlar tamam. */
export function parseStatus(md: string): Array<{ id: string; title: string; done: boolean }> {
  const out: Array<{ id: string; title: string; done: boolean }> = [];
  // Yalnızca "## Adımlar" bölümü (bir sonraki "## " başlığına kadar); başlık yoksa bütün metin.
  const all = md.split(/\r?\n/);
  const from = all.findIndex((l) => l.startsWith('## Adımlar'));
  const rest = from === -1 ? all : all.slice(from + 1);
  const to = rest.findIndex((l) => l.startsWith('## '));
  for (const line of to === -1 ? rest : rest.slice(0, to)) {
    const m = /^(\d+[a-z]?)\.\s+(.*)$/.exec(line) ?? /^- \*\*([A-Z])\)\s*(.*)$/.exec(line);
    if (!m) continue;
    const text = (m[2] ?? '').replace(/\*\*/g, '');
    const title = (text.split(/[:.(]/)[0] ?? text).trim();
    out.push({ id: m[1] ?? '', title, done: /\(tamam\)/i.test(line) });
  }
  return out;
}

export function StatusScreen(props: { onBack: () => void }) {
  const steps = parseStatus(gorev);
  const done = steps.filter((s) => s.done).length;
  const errors = readErrors();
  return (
    <div className="menu-screen">
      <main className="app">
        <header>
          <h1>{t().status.title}</h1>
          <button className="ghost" onClick={props.onBack}>{t().common.home}</button>
        </header>
        <section className="panel">
          <p>{t().status.progress(done, steps.length)}</p>
          <ul className="status-list">
            {steps.map((s) => (
              <li key={s.id} className={s.done ? 'done' : 'todo'}>
                <span>{s.done ? '✓' : '○'}</span> <b>{s.id}</b> {s.title}
              </li>
            ))}
          </ul>
        </section>
        {/* Görev K20: arayüz hata günlüğü (sihirbaz adımı çökmeleri). */}
        <section className="panel">
          <h2>{t().status.errors}</h2>
          {errors.length === 0 ? <p className="mute">{t().status.noErrors}</p> : (
            <ul className="status-list error-log">
              {errors.map((e, i) => (
                <li key={i}><b>{e.at.replace('T', ' ').slice(0, 19)}</b> {e.where}: {e.message}
                  {e.context && <pre>{JSON.stringify(e.context)}</pre>}
                  {e.stack && <details><summary>stack</summary><pre>{e.stack}</pre></details>}</li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <h2>{t().status.maps(maps.length)}</h2>
          <ul className="status-list">
            {maps.map((m) => <li key={m.id}><b>{m.name}</b> {m.variants.map((v) => variantLabel(v, getLang())).join(', ')}</li>)}
          </ul>
        </section>
      </main>
    </div>
  );
}
