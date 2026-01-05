import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Injecting the provided API keys as a comma-separated string
    'process.env.API_KEY': JSON.stringify(
      "AIzaSyCXRGC1P3V12kZQofbJA8-ew2fIbZz1eXk," +
      "AIzaSyAlWb7tJLe6asN49x-F0e6fuQBJptT56eU," +
      "AIzaSyCFHcNQgPksWmgYOfF6Iz94Guk6LPmxH4U," +
      "AIzaSyD3-ZDM3Z_U7ejel2PvuD4x0zhH4upIYXQ," +
      "AIzaSyAK2csddeFETm0QKrhhTNSk_nbOrOr1ljU," +
      "AIzaSyAEyuFX2sUgzPthaKWtWar8HAhZPoY-NXY"
    )
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})