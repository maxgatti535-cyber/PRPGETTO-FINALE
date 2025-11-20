import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Strictly define process.env.API_KEY to match Google GenAI guidelines
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Polyfill process.env to avoid crashes in browser environment
      'process.env': {},
    },
    base: './',
    build: {
      outDir: 'dist',
      sourcemap: true,
    }
  };
});
