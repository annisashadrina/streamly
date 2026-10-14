# 📜 API Contract & Documentation - Streamly v2 (Temporal Zoom Architecture)

Dokumentasi ini ditujukan untuk tim Front End sebagai panduan integrasi dengan Backend Streamly v2 yang telah di-upgrade. Arsitektur baru ini menyajikan data yang jauh lebih kaya dan terstruktur.

## 🟢 Base URL
`http://localhost:3000/api`

---

## 🔐 1. Login / Start Analysis
Mendaftarkan `username` yang ingin dipantau. Endpoint ini akan menyalakan **Scraper** (pengumpul data) dan **Orchestrator** (mesin analisis) untuk user tersebut di backend.

- **Endpoint:** `/login`
- **Method:** `POST`
- **Content-Type:** `application/json`

### Request Body:
```json
{
  "username": "khabylame"
}
```

### Response (Success - 200 OK):
```json
{
  "status": "success",
  "message": "Scraper and analysis started.",
  "username": "khabylame"
}
```

---

## 📊 2. Get All Insights
Mengambil hasil analisis terbaru untuk semua kategori (5m, 20m, 45m). Data yang dikembalikan sekarang adalah objek JSON yang kaya, bukan lagi teks mentah.

- **Endpoint:** `/insights`
- **Method:** `GET`
- **Query Parameters:**
  - `username` (Required): Username TikTok tanpa '@'.

### Example Request:
`GET /api/insights?username=khabylame`

### Response (Success - 200 OK):
```json
{
  "status": "success",
  "data": {
    "5m": {
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
    },
    "20m": {
      "id": "e5f6g7h8-...",
      "username": "khabylame",
      "batch_type": "20m",
      "created_at": "2026-04-25T10:50:00.456Z",
      "sentiment_score": 0.6,
      "sentiment_trend": "stable",
      "emerging_topics": ["price", "comparison", "new feature", "availability"],
      "summary": "Discussion is stable, focusing on the new feature's price and availability compared to competitors.",
      "actionable_insight": "Address the most common questions about pricing directly on stream to clear up confusion.",
      "message_count": 680
    },
    "45m": null
  }
}
```
*Note: Nilai `null` menandakan analisis untuk batch tersebut belum selesai atau belum ada.*

---

## 🎯 3. Get Specific Insight Type
Mengambil hasil analisis terbaru hanya untuk satu kategori (`5m`, `20m`, atau `45m`).

- **Endpoint:** `/insights`
- **Method:** `GET`
- **Query Parameters:**
  - `username` (Required): Username TikTok.
  - `type` (Required): `5m`, `20m`, atau `45m`.

### Example Request:
`GET /api/insights?username=khabylame&type=5m`

### Response (Success - 200 OK):
```json
{
    "status": "success",
    "data": {
        "id": "a1b2c3d4-...",
        "username": "khabylame",
        "batch_type": "5m",
        "created_at": "2026-04-25T11:05:00.123Z",
        "sentiment_score": 0.85,
        "sentiment_trend": "rising",
        "emerging_topics": ["new feature", "tutorial", "so cool!"],
        "summary": "Audience shows high enthusiasm for a newly demonstrated feature, with many asking for a tutorial.",
        "actionable_insight": "A direct suggestion for the streamer to act upon now.",
        "message_count": 152
    }
}
```

---

## 🧩 Data Schema v2 (The Contract)

Ini adalah kontrak data baru yang **WAJIB** diikuti.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String (UUID)`| Unique ID dari analisis, dihasilkan oleh backend. |
| `username` | `String` | Username TikTok target. |
| `batch_type` | `String` | Enum: `5m`, `20m`, `45m`. |
| `created_at` | `String (ISO)`| Timestamp saat analisis dibuat. |
| `sentiment_score`| `Number` | Skor sentimen dari -1.0 (sangat negatif) hingga 1.0 (sangat positif). |
| `sentiment_trend`| `String` | Enum: `rising`, `falling`, `stable`. Hasil perbandingan dengan data historis. |
| `emerging_topics`| `Array<String>`| Topik atau kata kunci yang sedang hangat dibicarakan. |
| `summary` | `String` | 1-2 kalimat ringkasan netral dari percakapan. |
| `actionable_insight`| `String` | **Insight utama**: Saran konkret yang bisa langsung ditindaklanjuti oleh streamer. |
| `message_count`| `Number` | Jumlah pesan yang dianalisis dalam batch ini. |

---

## 💡 Frontend Implementation Tips v3
1.  **Bento Box UI**: Struktur data baru ini sangat ideal untuk layout "Bento Box". Setiap field bisa menjadi satu box:
    -   `sentiment_score` -> **Sentiment Gauge** (misal: dengan library `recharts`).
    -   `sentiment_trend` -> Ikon panah naik/turun di sebelah gauge.
    -   `emerging_topics` -> **Keyword Cloud** atau Tag Pills.
    -   `actionable_insight` -> **"For You" Box**: Tampilkan ini dengan jelas sebagai saran utama.
    -   `summary` -> Teks ringkasan standar.
2.  **No Markdown**: Field `summary` dan `actionable_insight` adalah teks biasa. Tidak perlu lagi library Markdown.
3.  **Polling Tetap Relevan**: Polling `GET /insights?username=...` setiap 30-60 detik adalah strategi yang baik untuk menjaga dashboard tetap hidup dan terasa *real-time*.
4.  **Temporal Zooming**: Di UI, saat user mengklik tombol `5m`/`20m`/`45m`, panggil endpoint `GET /insights?username=...&type=...` untuk me-render ulang Bento Box dengan data dari rentang waktu tersebut.
