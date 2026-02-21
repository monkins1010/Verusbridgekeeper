import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        setupFiles: ['tests/setup.ts'],
        include: ['tests/**/*.test.ts'],
        globals: true,
    },
    resolve: {
        alias: {
            '@config': path.resolve(__dirname, 'src/config'),
            '@server': path.resolve(__dirname, 'src/server'),
            '@ethereum': path.resolve(__dirname, 'src/ethereum'),
            '@bridge': path.resolve(__dirname, 'src/bridge'),
            '@serialization': path.resolve(__dirname, 'src/serialization'),
            '@cache': path.resolve(__dirname, 'src/cache'),
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@cli-tools': path.resolve(__dirname, 'src/cli-tools'),
            '@types': path.resolve(__dirname, 'src/types'),
        },
    },
});
