export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',       // ✅ Add this line
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173
  }
})
