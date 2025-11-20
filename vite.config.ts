import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Qui diciamo al sito di usare la chiave API sicura
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Evitiamo che il sito si rompa se cerca "process"
      'process.env': {}
    },
    // Questo punto "./" è fondamentale per GitHub Pages
    base: './',
    build: {
      outDir: 'dist',
      sourcemap: true,
    }
  };
});
