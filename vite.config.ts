import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Fix for TypeScript build error: process is not defined in config
declare const process: any;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Defines global constant replacements. 
      // Safe check: if env.API_KEY is undefined, use empty string to avoid build crashes.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
    base: './', // Ensure relative paths for assets so it works on GitHub Pages subdirectories
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});
