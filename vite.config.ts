import { defineConfig, loadEnv } from 'vite';
import type { ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import type { ClientRequest } from 'node:http';

/**
 * 도서관정보나루 API 프록시.
 * - 브라우저에는 인증키를 노출하지 않고, dev/preview 서버가 대신 주입한다.
 * - 클라이언트는 /api/naru/<endpoint> 로 호출한다.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const authKey = env.LIBRARY_API_KEY ?? env.DATA4LIBRARY_KEY ?? env.KEY ?? '';

  const naruProxy: Record<string, ProxyOptions> = {
    '/api/naru': {
      target: 'https://data4library.kr',
      changeOrigin: true,
      secure: true,
      rewrite: (path) => path.replace(/^\/api\/naru/, '/api'),
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq: ClientRequest) => {
          if (!authKey) return;
          const url = new URL(proxyReq.path, 'https://data4library.kr');
          if (!url.searchParams.has('authKey')) url.searchParams.set('authKey', authKey);
          proxyReq.path = `${url.pathname}${url.search}`;
        });
      },
    },
  };

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: naruProxy,
      // WSL drvfs에서는 inotify가 누락될 수 있어 폴링을 쓰되, 대용량 데이터는 감시에서 제외한다.
      watch: {
        usePolling: true,
        interval: 1500,
        ignored: ['**/node_modules/**', '**/dist/**', '**/data/catalog.json', '**/public/data/**'],
      },
    },
    preview: { port: 4173, proxy: naruProxy },
    build: { target: 'es2022', chunkSizeWarningLimit: 1400 },
  };
});
