# Laporan Sistem Backend - Streamly v3 (Hierarchical Summarization)

Dokumen ini memberikan gambaran umum yang komprehensif tentang arsitektur, fitur, dan API dari sistem backend Streamly v3. Tujuannya adalah untuk menjadi panduan utama bagi developer (terutama tim Frontend) yang akan berinteraksi dengan sistem ini. Arsitektur ini menggantikan sistem v2 (berbasis vektor) sepenuhnya.

---

## 1. Fitur Utama

Sistem backend Streamly v3 dirancang untuk menyediakan analisis mendalam dari live chat TikTok secara real-time dengan pendekatan agregasi berjenjang.

-   **Analisis Multi-Jendela Waktu (Temporal Zoom):** Sistem secara otomatis memproses dan menyajikan data dalam tiga rentang waktu: 5 menit (analisis taktis), 20 menit (tren jangka menengah), dan 45 menit (ringkasan strategis).
-   **Sintesis Kontekstual Berjenjang:** Fitur inti dari arsitektur baru ini.
    -   **Laporan 5m** dibuat dari analisis komentar mentah.
    -   **Laporan 20m** adalah sintesis cerdas dari empat laporan 5m sebelumnya.
    -   **Laporan 45m** adalah sintesis dari dua laporan 20m dan satu laporan 5m terbaru.
    Ini memungkinkan sistem untuk mendeteksi tren (`rising`, `falling`, `stable`) berdasarkan evolusi data dari waktu ke waktu, tanpa memerlukan database vektor.
-   **Output Data Terstruktur:** API menyajikan objek JSON yang kaya dan siap pakai, mencakup:
    -   Skor Sentimen (numerik -1.0 hingga 1.0)
    -   Tren Sentimen (naik, turun, atau stabil)
    -   Topik/Kata Kunci yang Muncul
    -   Ringkasan Percakapan
    -   **Insight yang Dapat Ditindaklanjuti (Actionable Insight)**: Saran konkret untuk streamer.
-   **Arsitektur Skalabel:** Dirancang dari awal untuk menangani beberapa sesi analisis secara bersamaan untuk pengguna yang berbeda, berkat pola *producer-consumer* dan manajemen state yang terpusat di Redis.

---

## 2. Arsitektur Sistem (Desain C - Hierarchical)

Sistem ini mengikuti arsitektur berbasis event yang terfokus pada pemisahan tugas dan agregasi data secara periodik. **Komponen Qdrant dan logika embedding telah dihapus sepenuhnya.**

**Diagram Alur Data:**
`TikTok API` → `Scraper` → `Redis (Queue)` → `Orchestrator` → `Gemini Analyzer` → `Redis (Insight History)` → `API Server`

**Komponen Utama:**

1.  **`TikTokScraper` (Producer):**
    -   **Tugas:** Menghubungkan diri ke live stream TikTok dan menangkap pesan chat.
    -   **Aksi:** Segera mendorong (push) setiap pesan mentah ke dalam antrian (Redis List) yang spesifik untuk pengguna tersebut.

2.  **`RedisRepository` (Message Broker & Insight Store):**
    -   **Tugas 1 (Queue):** Berfungsi sebagai perantara antara `Scraper` dan `Orchestrator`, menampung pesan-pesan yang belum diproses.
    -   **Tugas 2 (Insight History):** Menyimpan histori laporan analisis (`5m`, `20m`, `45m`) dalam daftar Redis yang terpisah. Ini adalah "memori" sistem yang baru, menggantikan Qdrant.

3.  **`AnalysisOrchestrator` (The Brain):**
    -   **Tugas:** Otak dari sistem. Berjalan sebagai service *singleton* yang mengelola jadwal analisis (5m, 20m, 45m) untuk setiap pengguna aktif.
    -   **Aksi:** Secara berkala, ia menentukan jenis batch mana yang harus dijalankan dan mengambil data yang sesuai dari Redis (pesan mentah untuk 5m, atau laporan insight sebelumnya untuk 20m/45m) untuk diberikan kepada `GeminiAnalyzer`.

4.  **`GeminiAnalyzer` (The Synthesis Engine):**
    -   **Tugas:** Menggunakan model AI generatif Google untuk mengubah data menjadi insight. Ia memiliki tiga "persona" atau mode operasi.
    -   **Aksi (Mode 5m):** Menerima pesan mentah dan menghasilkan laporan `5m_insight`.
    -   **Aksi (Mode 20m):** Menerima 4 laporan `5m_insight` dan mensintesisnya menjadi satu `20m_insight`.
    -   **Aksi (Mode 45m):** Menerima 2 laporan `20m_insight` dan 1 laporan `5m_insight` untuk disintesis menjadi `45m_insight`.

5.  **`API Server (Express)` (The Interface):**
    -   **Tugas:** Menyediakan antarmuka HTTP untuk dunia luar (frontend).
    -   **Aksi:** Mengekspos endpoint minimalis untuk memulai analisis dan mengambil hasil laporan terbaru dari `Redis Insight History`.

---

## 3. Gambaran Umum API

API tidak berubah dari perspektif Frontend, namun data yang disajikan sekarang berasal dari alur kerja yang berbeda.

-   `POST /api/login`
    -   **Fungsi:** "Tombol Start". Memberi tahu backend untuk memulai proses scraping dan analisis untuk `username` yang diberikan.
    -   **Body:** `{ "username": "nama_user" }`

-   `GET /api/insights`
    -   **Fungsi:** Mengambil **laporan analisis terbaru** dari setiap kategori (`5m`, `20m`, `45m`) dari histori Redis. Endpoint ini sangat cepat dan ringan.
    -   **Query Params:**
        -   `username` (Wajib): Menentukan data pengguna mana yang akan diambil.
        -   `type` (Opsional: `5m`, `20m`, `45m`): Jika disertakan, hanya akan mengembalikan laporan terbaru untuk tipe tersebut. Jika tidak, akan mengembalikan ketiganya.

**Contoh Data yang Diterima Frontend (Struktur tetap sama):**
```json
{
    "id": "a1b2c3d4-...",
    "username": "khabylame",
    "batch_type": "5m",
    "created_at": "2026-04-25T11:05:00.123Z",
    "sentiment_score": 0.85,
    "sentiment_trend": "rising",
    "emerging_topics": ["new feature", "tutorial", "so cool!"],
    "summary": "Audience shows high enthusiasm for a newly demonstrated feature, with many asking for a tutorial.",
    "actionable_insight": "Consider pinning a comment with a link to the feature's documentation or a tutorial video.",
    "message_count": 152
}
```
Kontrak data JSON ini tetap valid.

---

## 4. Kesatuan Sistem (Ringkasan Alur Kerja v3)

Secara ringkas, inilah cara sistem bekerja sebagai satu kesatuan:

1.  Frontend mengirim `POST /api/login` dengan `username`.
2.  Backend menyalakan `Scraper` dan `Orchestrator` untuk `username` tersebut.
3.  `Scraper` mulai memasukkan pesan chat ke antrian di **Redis**.
4.  Setiap **5 menit**, `Orchestrator` mengambil pesan dari Redis, lalu menyuruh `GeminiAnalyzer` (mode 5m) untuk membuat laporan `5m_insight`. Hasilnya disimpan ke **histori insight Redis**.
5.  Setiap **20 menit**, `Orchestrator` mengambil 4 laporan `5m_insight` terakhir dari histori Redis, lalu menyuruh `GeminiAnalyzer` (mode 20m) untuk membuat laporan `20m_insight`. Hasilnya disimpan ke **histori insight Redis**.
6.  Setiap **45 menit**, `Orchestrator` mengambil 2 laporan `20m_insight` dan 1 laporan `5m_insight` terbaru dari histori Redis, lalu menyuruh `GeminiAnalyzer` (mode 45m) untuk membuat laporan `45m_insight`. Hasilnya disimpan ke **histori insight Redis**.
7.  Frontend, yang melakukan polling ke `GET /api/insights`, kini mendapatkan laporan terbaru dari setiap kategori langsung dari histori insight Redis dengan sangat cepat.
