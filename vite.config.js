import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    server: {
        proxy: {
            '/api/generate': {
                target: 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
                changeOrigin: true,
                rewrite: (path) => ''
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
