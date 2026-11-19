/**
 * KW1: `LookFrame` çözülmüş görünümü çocuklarına (rozet `AvatarBadge`) taşır. Tek kanatlı slotlar (Dragonborn) kanadı rozetin KENDİ
 * içinde, zemin dairesi ile figür arasında çizer (kanat figürün arkasından çıkar, daire dışına taşar); LookFrame bu slotta ayrı kanat
 * katmanı çizmez. Çerçevesiz kullanımda (bağlam yok) rozet kanat çizmez.
 */
import { createContext } from 'react';
import type { LineageLook } from './lineageLook';

export const LookContext = createContext<LineageLook | null>(null);
