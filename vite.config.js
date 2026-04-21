import {
    defineConfig
} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        host: true,
        historyApiFallback: true,
        allowedHosts: ['refutative-clarisa-unafflictedly.ngrok-free.dev', '.ngrok-free.dev', '.ngrok.io']
    },
    preview: {
        port: 3000,
        host: true,
        historyApiFallback: true
    }
})