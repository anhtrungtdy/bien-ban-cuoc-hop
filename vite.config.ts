import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Cast process to any to avoid TS error: Property 'cwd' does not exist on type 'Process'
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Logic: Prioritize API_KEY from system environment variables (Hosting settings)
      // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false
    }
  }
})