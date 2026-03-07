import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    server: {
        proxy: {
            '/api/v2': {
                target: 'https://api-inference.huggingface.co',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/v2/, '')
            }
        }
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                generate: resolve(__dirname, 'generate.html')
            }
        }
    }
});
