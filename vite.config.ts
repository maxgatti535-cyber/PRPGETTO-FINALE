<change>
<file>vite.config.ts</file>
<description>Update Vite config to use __API_KEY__ global constant for safe API key injection.</description>
<content><![CDATA[import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
const env = loadEnv(mode, process.cwd(), '');
return {
plugins: [react()],
base: './',
define: {
'API_KEY': JSON.stringify(env.API_KEY || '')
},
build: {
outDir: 'dist',
sourcemap: true
}
};
});]]></content>
</change>
