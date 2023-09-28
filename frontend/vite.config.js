import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
	hmr: {
        clientPort: 80,
    },
	watch: {
		usePolling: true,
	},
  },
  plugins: [react()],
})
