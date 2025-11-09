export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',  // ✅ Add this to ensure Vercel finds your build
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173
  }
})
