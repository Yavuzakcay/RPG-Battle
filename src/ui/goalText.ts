/** Görev S3: hedef ve başarısızlık koşullarının ekran metni (üst şerit, günlük, sonuç ekranı, Game Master paneli). */
import alarmData from '../../data/alarm.json';
import { OBJECTS } from '../battle/objectData';
import type { BattleState, Goal, GoalFail } from '../battle/types';
import { getLang, t } from '../i18n';

function objName(state: BattleState | undefined, id: string | undefined): string {
  const o = id ? state?.map?.objects?.find((x) => x.id === id) : undefined;
  const kind = o?.kind ?? (id?.split(':')[0] as keyof typeof OBJECTS | undefined);
  const def = kind ? OBJECTS[kind as keyof typeof OBJECTS] : undefined;
  return def ? (getLang() === 'en' ? def.en : def.tr) : id ?? '?';
}

export function goalText(g: Goal, state?: BattleState): string {
  const T = t().goals.text;
  switch (g.kind) {
    case 'defeat': return T.defeat;
    case 'reach': return T.reach(g.hexes?.length ?? 0, g.who === 'all');
    case 'protect': return T.protect(g.objectId ? objName(state, g.objectId) : T.civilians, g.rounds ?? 0);
    case 'destroy': return T.destroy(objName(state, g.objectId));
    case 'survive': return T.survive(g.rounds ?? 0);
    case 'retrieve': {
      const o = state?.map?.objects?.find((x) => x.id === g.objectId);
      const who = o?.carriedBy ? state?.combatants[o.carriedBy]?.name : undefined;
      return `${T.retrieve(objName(state, g.objectId), g.hexes?.length ?? 0)}${who ? ` — ${T.carried(who)}` : ''}`;
    }
  }
}

export function failText(f: GoalFail, state?: BattleState): string {
  const F = t().goals.fail;
  switch (f.kind) {
    case 'rounds': return F.rounds(f.rounds ?? 0);
    case 'civilians': return F.civilians(f.needed ?? 1);
    case 'object': return F.object(objName(state, f.objectId));
    case 'down': return F.down(f.ids?.length ?? 0);
    case 'alarm': return F.alarm(f.rounds ?? alarmData.failRounds);
  }
}
