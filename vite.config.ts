import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Create a global constant for the API key to avoid 'process' issues in browser
      '__API_KEY__': JSON.stringify(env.API_KEY || ''),
    },
    base: './',
    build: {
      outDir: 'dist',
      sourcemap: true,
    }
  };
});
