# LioChess Analyzer

**LioChess** adalah alat analisis catur berbasis web yang memungkinkan kamu menganalisis permainan dari **Chess.com** atau **PGN** secara langsung di browser, tanpa perlu login atau backend. Dibangun dengan **Next.js**, **Stockfish**, dan **React**, LioChess memberikan pengalaman analisis yang cepat, interaktif, dan mudah digunakan.

---

## ✨ Fitur Utama

- ✅ **Analisis per langkah** menggunakan mesin **Stockfish 17 (WASM)**
- 📊 **Grafik evaluasi** posisi sepanjang permainan
- ⚠️ **Deteksi blunder** (perubahan evaluasi > 1.0 poin)
- 📥 **Ekspor hasil analisis** ke file TXT atau JSON
- 💾 **Simpan ke localStorage** — analisis tidak hilang saat refresh
- 🌐 **Tanpa login** — langsung gunakan
- 🎮 **Navigasi langkah maju/mundur** untuk replay permainan
- 🎯 **Highlight best move** di papan catur
- 🚀 **Siap deploy ke Vercel**

---

## 🛠️ Teknologi yang Digunakan

- **Framework**: [Next.js](https://nextjs.org/)
- **Library Catur**: [chess.js](https://github.com/jhlywa/chess.js)
- **Papan Catur Interaktif**: [react-chessboard](https://github.com/Clariity/react-chessboard)
- **Grafik Evaluasi**: [Recharts](https://recharts.org/)
- **Mesin Analisis**: [Stockfish (WASM)](https://github.com/niklasf/stockfish.wasm)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Cara Menjalankan

1. **Clone repositori ini**

   ```bash
   git clone https://github.com/[username-kamu]/liochess.git
   cd liochess
