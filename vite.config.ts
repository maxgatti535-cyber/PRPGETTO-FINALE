import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Fix for TypeScript build error: process is not defined in config
declare const process: any;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Defines global constant replacements. 
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.NODE_ENV': JSON.stringify(mode),
      // Safety fallback for process.env to avoid "process is not defined" in browser
      'process.env': {}, 
    },
    base: './', // Ensure relative paths for assets so it works on GitHub Pages subdirectories
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});
