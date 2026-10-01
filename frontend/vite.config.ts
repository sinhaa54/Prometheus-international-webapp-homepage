import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  //const base = env.VITE_BASE_PATH || './';
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8000';

  return {
    base:'./',
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: false,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      target: 'es2022',
      rollupOptions: {
        output: {
          // Fixed filenames so Dataiku's HTML never needs updating after a rebuild
          entryFileNames: 'assets/index.js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: (info) =>
            info.name?.endsWith('.css') ? 'assets/index.css' : 'assets/[name][extname]',
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      css: false,
    },
  };
});
