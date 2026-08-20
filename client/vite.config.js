import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages dạng project page phục vụ app tại /<tên-repo>/ nên cần base tương ứng.
// Render Static Site và dev local vẫn dùng '/' mặc định.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    tailwindcss(),
    react(),
  ],
})
