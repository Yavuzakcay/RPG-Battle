/**
 * Eylem menüsü düğmelerinin kısa açıklamaları (üzerine gelince ya da telefonda uzun basınca).
 * Anahtarlar MapBattle'daki menü öğeleriyle aynı.
 */
export const ACTION_HINTS: Record<string, string> = {
  move: 'Yürüyerek hareket et: yeşil altıgenlere gidebilirsin, sayı harcanacak hareketi gösterir. Hızın kadar (30 ft = 6 altıgen).',
  jump: 'Lavın üstünden başka bir adaya atla: Athletics zarı, başaramazsan lava düşebilirsin. Bu turun hareketinin yerine geçer.',
  attack: 'Silahınla bir düşmana saldır: parlayan hedefe dokun. Ekstra Saldırın varsa eylemde birden çok vuruş yaparsın.',
  spell: 'Büyü listesini aç: hedefli, alan ya da kendine büyü seç. Büyü slotu ve eylem (ya da bonus eylem) harcar.',
  hide: 'Uygun bir altıgende (çalılık, kaya, gölge) Stealth zarıyla gizlen. Seni görmeyen düşmana saldırın avantajlı olur.',
  shove: 'Bitişik düşmanı 5 ft it ya da yere düşür (Athletics karşılaştırması). Bir saldırı hakkını harcar.',
  dodge: 'Kaçın (Dodge): sonraki turunun başına dek sana saldıranlar dezavantajlı olur, DEX kurtarma zarların avantajlı. Eylemini harcar; etkisiz kalırsan ya da hızın 0 olursa işe yaramaz.',
  help: 'Yardım (Help): bitişik bir düşman seç; sonraki turunun başına dek tarafının o düşmana ilk saldırısı avantajlı olur. Eylemini harcar.',
  search: 'Algı zarıyla çevrede gizlenmiş düşman ve tuzak ara. Eylemini harcar.',
  dash: 'Koş (Dash): bu tur hızın kadar ek hareket kazan. Eylemini harcar; Rogue bonus eylemle yapabilir.',
  disengage: 'Ayrıl (Disengage): bu tur düşmanların yanından fırsat saldırısı almadan uzaklaş.',
  escape: 'Batağa saplandın: Athletics zarıyla kurtulmaya çalış. Eylemini harcar.',
  stand: 'Yerdesin (Prone): ayağa kalk. Hızının yarısı kadar hareket harcar; yürürken kendiliğinden kalkarsın. Yerdeyken yakın saldırılar sana avantajlı, uzaktan atışlar dezavantajlı.',
  escape_grapple: 'Yakalandın (Grappled): Athletics ya da Acrobatics zarıyla (yüksek olan) kaçış DC\'sini geç. Eylemini harcar. Yakalayan düşer ya da etkisiz kalırsa kendiliğinden kurtulursun.',
  pull: 'Batağa saplanmış bitişik müttefikini çekip kurtarmaya çalış. Eylemini harcar.',
  surge: 'Atılım (Action Surge): bu tur bir eylem daha kazanırsın. Savaşçı, dinlenmeye kadar bir kez.',
  wind: 'Nefes (Second Wind): bonus eylemle 1d10 + seviye kadar HP iyileş. Savaşçı.',
  followup: "Konsantrasyon büyünü sürdür: Hunter's Mark'ı yeni hedefe taşı ya da Spiritual Weapon ile vur. Bonus eylem.",
  end: 'Turunu bitir; sıra sonraki savaşçıya geçer.',
};

/** Düğmenin açıklaması; kullanılamıyorsa nedeni de eklenir. */
export function actionTip(key: string, opts: { disabled?: boolean; reason?: string } = {}): string {
  const hint = ACTION_HINTS[key] ?? '';
  if (opts.reason) return `${hint} Şu an kullanılamaz: ${opts.reason}`;
  if (opts.disabled) return `${hint} Şu an kullanılamaz.`;
  return hint;
}
