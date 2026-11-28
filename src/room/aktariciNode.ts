/**
 * Görev ODA-2 (O2): aktarıcının node bağlaması (`ws`, yalnız dev bağımlılığı). Bir http sunucusunun `upgrade` olayına
 * `/oda` yolunda takılır; çekirdek `aktarici.ts`. Kullananlar: `scripts/oda-sunucu.ts` (dist + aktarıcı), Vite
 * geliştirme eklentisi (`vite.config.ts`), testler. Tarayıcı kodu bu dosyayı içe aktarmaz.
 */
import type { IncomingMessage, Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer, type WebSocket } from 'ws';
import { networkInterfaces } from 'node:os';
import { Aktarici, type HizSiniri } from './aktarici';

/** Görev ODA-5 (madde 6): katılım adresi uç noktası (oda lobisi telefonlara gösterir). */
export const ODA_ADRES_YOLU = '/oda/adres';

/** Bu bilgisayarın yerel ağ (IPv4, iç olmayan) adresleri. */
export const yerelAdresler = (): string[] => Object.values(networkInterfaces()).flat()
  .filter((a): a is NonNullable<typeof a> => !!a && a.family === 'IPv4' && !a.internal)
  .map((a) => a.address);

/** `GET /oda/adres` yanıtı: telefonların uygulamayı açacağı `http://<ip>:<port>` adresleri. */
export const adresYaniti = (port: number): string => JSON.stringify({ adresler: yerelAdresler().map((ip) => `http://${ip}:${port}`) });

export const ODA_YOLU = '/oda';

export interface NodeAktarici {
  core: Aktarici;
  /** Bağlı soket sayısı. */
  readonly baglanti: number;
  kapat(): Promise<void>;
}

/**
 * `server`'a aktarıcıyı takar. `nabizMs`'de bir ping; yanıt vermeyen soket düşürülür (kopma algısı: 2 × nabız).
 */
export function odaAktarici(server: Server, o: { yol?: string; nabizMs?: number; hiz?: HizSiniri } = {}): NodeAktarici {
  const yol = o.yol ?? ODA_YOLU;
  const core = new Aktarici(undefined, o.hiz);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 8 * 1024 * 1024 });
  let sayi = 0;
  const canli = new WeakMap<WebSocket, boolean>();
  const yukselt = (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const path = (req.url ?? '').split('?')[0];
    if (path !== yol) return;
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  };
  server.on('upgrade', yukselt);
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // Görev ODA-5: hız sınırı anahtarı uzak adres.
    const soket = { id: `b${++sayi}`, kaynak: req.socket.remoteAddress ?? undefined, gonder: (v: string) => ws.send(v), kapat: () => ws.close() };
    canli.set(ws, true);
    core.baglandi(soket);
    ws.on('pong', () => canli.set(ws, true));
    ws.on('message', (data, isBinary) => { if (!isBinary) core.mesaj(soket, data.toString()); });
    ws.on('close', () => core.kapandi(soket));
    ws.on('error', () => core.kapandi(soket));
  });
  const nabiz = setInterval(() => {
    for (const ws of wss.clients) {
      if (canli.get(ws) === false) { ws.terminate(); continue; }
      canli.set(ws, false);
      try { ws.ping(); } catch { /* kapanıyor */ }
    }
  }, o.nabizMs ?? 15_000);
  nabiz.unref?.();
  return {
    core,
    get baglanti() { return wss.clients.size; },
    kapat: () => new Promise<void>((r) => {
      clearInterval(nabiz);
      server.off('upgrade', yukselt);
      for (const ws of wss.clients) ws.terminate();
      wss.close(() => r());
    }),
  };
}
