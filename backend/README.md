# 🚀 Streamly v2 - TikTok Live Chat Insight Engine

Streamly v2 adalah platform analisis real-time untuk TikTok Live Chat yang menggunakan AI (Gemini 1.5 Flash) dan Vector Database (Qdrant). Sistem ini menangkap pesan chat, memprosesnya melalui pipeline asinkron, dan memberikan analisis mendalam (Delta Analysis) berdasarkan konteks historis dalam tiga jendela waktu: 5 menit, 20 menit, dan 45 menit.

## 🏗️ Persiapan Infrastruktur

Aplikasi ini membutuhkan **Redis** untuk antrian pesan & cache, serta **Qdrant** untuk penyimpanan vektor (memori jangka panjang).

### Menggunakan Docker (Rekomendasi)
Jalankan perintah berikut untuk menyiapkan infrastruktur secara instan:

```bash
# Jalankan Redis
docker run --name streamly-redis -p 6379:6379 -d redis:latest

```

*Catatan: MySQL bersifat opsional/sekunder pada versi ini, namun jika diperlukan Anda dapat menjalankannya di port 3306.*
```bash
# mysql opsional
docker run --name streamly-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=streamly_db -p 3306:3306 -d mysql:latest
```

### Konfigurasi Environment
Salin `.env.example` menjadi `.env` dan isi nilai yang diperlukan:

```bash
cp .env.example .env
```

Pastikan variabel berikut terisi:
- `GEMINI_API_KEY`: API Key dari Google AI Studio.
- `REDIS_URL`: URL instance Redis Anda.

---

## 🚀 Menjalankan Aplikasi

### 1. Instalasi
```bash
npm install
```

### 2. Jalankan API Server
API Server bertindak sebagai pusat kendali yang mengelola Scraper dan Orchestrator.
```bash
npm run api
```
Setelah dijalankan, API akan tersedia di: **`http://localhost:3000`**

---

## 🧪 Menguji Fitur v2 (Step-by-Step)

### Langkah 1: Aktivasi Analisis
Gunakan endpoint login untuk memulai proses penarikan data dan analisis bagi user tertentu.
```bash
curl -X POST http://localhost:3000/api/login \
     -H "Content-Type: application/json" \
     -d '{"username": "khabylame"}'
```

### Langkah 2: Tunggu Proses Batch
Sistem akan bekerja di balik layar:
- **Scraper** mendorong chat ke Redis.
- **Orchestrator** mengambil batch chat setiap 5, 20, dan 45 menit.
- **Gemini** melakukan analisis dengan membandingkan data saat ini dengan memori di **Qdrant**.

### Langkah 3: Ambil Insight
Ambil hasil analisis terbaru melalui endpoint insights:
```bash
# Mengambil semua tipe insight (5m, 20m, 45m)
curl http://localhost:3000/api/insights?username=khabylame

# Mengambil tipe spesifik (contoh: 5m)
curl "http://localhost:3000/api/insights?username=khabylame&type=5m"
```

---

## 🛠️ Tech Stack
- **Backend**: Node.js (TypeScript), Express.
- **AI**: Google Gemini 1.5 Flash (Generative & Embedding).
- **Storage**: 
  - **Redis**: Message Broker (Queue) & Fast Insight Cache.
- **Connector**: `tiktok-live-connector`.
- **Testing**: Vitest.

---

## 💡 Fitur Unggulan v2
- **Temporal Zoom**: Analisis otomatis dalam 3 rentang waktu berbeda.
- **Delta Analysis**: Menghasilkan tren sentimen (`rising`, `falling`, `stable`) dengan membandingkan batch saat ini dengan data historis di Qdrant.
- **Actionable Insights**: AI tidak hanya merangkum, tapi memberikan saran konkret untuk streamer.
