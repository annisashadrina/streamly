# Tutorial: Menjalankan Unit Test untuk Gemini Analyzer

Dokumen ini memandu Anda untuk menyiapkan environment testing dan menjalankan unit test untuk `GeminiAnalyzer` secara manual.

Unit test ini penting untuk memverifikasi bahwa logika di `GeminiAnalyzer` berfungsi seperti yang diharapkan tanpa harus membuat panggilan API sungguhan ke Google, sehingga menghemat waktu dan biaya.

## Langkah 1: Instalasi Test Runner (vitest)

Proyek ini sudah dikonfigurasi untuk menggunakan **vitest**, sebuah test runner modern untuk proyek Vite/JS/TS. Jika Anda belum menginstalnya, buka terminal di root direktori proyek dan jalankan:

```bash
npm install -D vitest @vitest/ui
```
*   `vitest`: Library inti untuk testing.
*   `@vitest/ui`: Sebuah antarmuka visual di browser untuk melihat hasil tes (opsional tapi sangat direkomendasikan).

## Langkah 2: Tambahkan Script Testing ke `package.json`

Buka file `package.json` Anda dan tambahkan script berikut di dalam objek `"scripts"`:

```json
// package.json
{
  "name": "backend",
  "version": "1.0.0",
  // ...
  "scripts": {
    "start": "node --loader ts-node/esm src/cmd/api/main.ts",
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  // ...
}

```
*   `test`: Akan menjalankan semua file `*.test.ts` di terminal.
*   `test:ui`: Akan membuka dashboard Vitest di browser.

## Langkah 3: Menjalankan Unit Test

Sekarang Anda siap untuk menjalankan tes.

### Opsi A: Menjalankan di Terminal

Untuk menjalankan tes `GeminiAnalyzer` secara spesifik dan melihat hasilnya langsung di terminal, jalankan perintah:

```bash
npm test src/internal/analyzer/gemini.test.ts
```

**Output yang Diharapkan:**

Anda akan melihat output yang menunjukkan bahwa semua tes `PASS`. Ini menandakan bahwa logika internal `GeminiAnalyzer` untuk setiap jenis batch (`5m`, `20m`, `45m`) sudah benar.

```plaintext
 ✓ src/internal/analyzer/gemini.test.ts (3)
   ✓ GeminiAnalyzer (v3 - Hierarchical) (3)
     ✓ 5m Batch Analysis (3)
       ✓ should return null if messages array is empty
       ✓ should call the generative model with the correct 5m prompt
       ✓ should return a structured insight for a 5m batch
     ✓ 20m Batch Analysis (2)
       ✓ should return null if there are not enough 5m insights
       ✓ should call the generative model with the correct 20m prompt and data
     ✓ 45m Batch Analysis (2)
       ✓ should return null if there is not enough data
       ✓ should call the generative model with the correct 45m prompt and data

 Test Files  1 passed (1)
      Tests  8 passed (8)
   Start at  10:00:00
   Duration  155ms (transform 2ms, setup 0ms, collect 25ms, tests 2ms)
```

### Opsi B: Menjalankan dengan UI (Direkomendasikan)

Untuk pengalaman yang lebih interaktif, jalankan:

```bash
npm run test:ui
```

Perintah ini akan memberikan Anda sebuah URL (biasanya `http://localhost:51204/__vitest__/`). Buka URL tersebut di browser Anda.

Di dashboard UI, Anda bisa:
- Melihat semua file tes.
- Mengklik `gemini.test.ts` untuk melihat detail setiap tes (`it(...)`).
- Melihat kode sumber dan *assertion* yang dijalankan.
- Menjalankan ulang tes secara individual.

---

Selesai! Dengan cara ini, Anda bisa dengan percaya diri memodifikasi atau mengembangkan `GeminiAnalyzer` di masa depan dan memastikan perubahannya tidak merusak logika yang sudah ada.
