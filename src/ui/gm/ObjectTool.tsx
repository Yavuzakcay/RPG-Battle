/**
 * Görev S2: Game Master "Nesne yerleştir" aracı (savaş ekranı ve kurulum). Tür seçilir, dokunulan altıgene
 * `place_object` gider (olay tabanlı, replay uyumlu; zar yok); "Kaldır" altıgendeki nesneyi siler. Kilitli kapı ayrı
 * seçenek. Ayrı bileşen: GM Atölyesi aynı paleti kullanacak.
 */
import { OBJECTS, OBJECT_KINDS } from '../../battle/objectData';
import type { ObjectKind, ObjectState } from '../../battle/types';
import { getLang, t } from '../../i18n';

export type ObjectPick = { kind: ObjectKind; state?: ObjectState } | 'remove';
const same = (a: ObjectPick, b: ObjectPick) => (a === 'remove' || b === 'remove' ? a === b : a.kind === b.kind && a.state === b.state);

export function ObjectTool(props: { pick: ObjectPick; onPick: (p: ObjectPick) => void; onClose: () => void }) {
  const O = t().battle.gm.objectTool;
  const en = getLang() === 'en';
  const picks: Array<{ pick: ObjectPick; label: string }> = [
    ...OBJECT_KINDS.map((k) => ({ pick: { kind: k } as ObjectPick, label: `${OBJECTS[k].icon} ${en ? OBJECTS[k].en : OBJECTS[k].tr}` })),
    { pick: { kind: 'door', state: 'locked' }, label: `${OBJECTS.door.icon}🔒 ${O.locked}` },
  ];
  return (
    <div className="gm-tool" role="toolbar" aria-label={O.title}>
      <strong className="gm-tool-title">{O.title}</strong>
      {picks.map((p) => (
        <button key={p.label} className={same(props.pick, p.pick) ? 'on' : ''} aria-pressed={same(props.pick, p.pick)} onClick={() => props.onPick(p.pick)}>{p.label}</button>
      ))}
      <button className={props.pick === 'remove' ? 'on' : ''} aria-pressed={props.pick === 'remove'} onClick={() => props.onPick('remove')}>✕ {O.remove}</button>
      <button onClick={props.onClose}>{O.close}</button>
    </div>
  );
}
