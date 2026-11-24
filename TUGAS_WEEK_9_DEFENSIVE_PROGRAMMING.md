# Tugas Week 9 — Pengujian Data Error dan Defensive Programming Streamly

## Dasar materi

Penerapan pada Streamly: uji identitas/sandi login, target TikTok saat login, dan target TikTok di dashboard. Dua bagian pertama berada dalam **satu form login**; aplikasi memiliki dua form HTML, bukan tiga form terpisah. API juga diuji karena dapat menerima masukan tanpa melalui form.

## Cara dan batas pengujian

Pengujian dilaksanakan 12 November 2026. Skrip `backend/uji_defensive.ts` memanggil handler route Express yang sebenarnya beserta `AuthService` dan `UserRepository`. Pool database diganti fixture yang mencatat query dan parameternya, dan koneksi scraper diganti stub yang selalu gagal. Tidak ada koneksi ke MySQL, Redis, atau TikTok yang sesungguhnya. Respons merupakan hasil pemanggilan handler langsung, bukan pengujian HTTP melalui jaringan. Data SQL hanya berupa teks uji; tidak ada perintah penghapusan data.

Fixture memiliki akun `akun_uji` dengan sandi `sandi_benar_unik`; kedua nilai hanya data percobaan. **Lulus** berarti sesuai harapan untuk kondisi fixture, bukan jaminan keamanan keseluruhan aplikasi. **Gagal** berarti hasil aktual berbeda dari harapan yang dinyatakan di tabel. Pengujian render browser dan eksekusi JavaScript XSS belum dilakukan.

## A. Form login dan endpoint autentikasi

Semua pengujian bagian ini memakai `POST /api/auth/login` melalui handler yang sama. Masukan yang tidak disebut memakai nilai fixture yang valid.

| ID | Jenis dan data masukan | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|
| S01 | SQL injection pada identitas: `' OR 1=1;/*`; sandi salah | Login ditolak; teks tidak mengubah struktur query. | Status 401; query memakai `username = ? OR email = ?` dan payload tercatat sebagai dua parameter. | Lulus pada fixture. |
| S02 | SQL injection pada sandi: `' OR 1=1;/*` | Login ditolak. | Status 401, pesan sandi salah. | Lulus pada fixture. |
| S03 | XSS pada identitas: `<script>alert(1)</script>` | Login ditolak; teks tidak dieksekusi. | Status 401; teks tercantum dalam pesan JSON. Tidak ada pengujian render browser. | Login ditolak; keamanan XSS **belum dapat dinilai**. |
| S04 | Sandi tidak dikirim | Login ditolak karena sandi wajib. | Status 200 dan login berhasil pada akun fixture. | **Gagal**. |
| S05 | Sandi berupa string kosong `""` | Login ditolak karena sandi wajib. | Status 200 dan login berhasil pada akun fixture. | **Gagal**. |
| S06 | Sandi `password123`, yang bukan sandi fixture | Login ditolak. | Status 200 dan login berhasil karena fallback sandi di layanan. | **Gagal**. |
| S09 | Identitas sepanjang 5.000 karakter `x` | Usulan: panjang masukan berlebihan ditolak dengan pesan validasi yang jelas. | Status 401 pengguna tidak ditemukan; seluruh identitas diteruskan ke query fixture dan dicantumkan kembali dalam pesan. | **Gagal** terhadap validasi panjang yang diusulkan. |
| S10 | Identitas bertipe array `["akun_uji"]` | Status 400 dan pesan identitas harus berupa teks. | Status 401 dengan pesan teknis `identifier.trim is not a function`. | **Gagal**. |
| S11 | Sandi berupa objek `{"x":1}` | Status 400 dan pesan sandi harus berupa teks. | Status 401 dengan pesan sandi salah. | **Gagal** terhadap validasi tipe yang diusulkan. |

Catatan: pemeriksaan parameter SQL di S01 mengamati argumen yang dikirim repository ke pool tiruan, bukan eksekusi pada server MySQL. Tidak cukup untuk menyatakan seluruh aplikasi bebas SQL injection. S04–S06 menguji API langsung; antarmuka login biasa menahan sandi kosong, tetapi pemeriksaan di frontend dapat dilewati melalui API.

## B. Masukan target TikTok pada form login

Gunakan identitas dan sandi fixture yang benar pada endpoint login.

| ID | Data target | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|
| S07 | `<script>alert(1)</script>` | Target berformat tidak sesuai ditolak sebelum diteruskan ke scraper. | Status 200; teks menjadi target scraper tiruan dan dikembalikan sebagai `tiktokUsername`; `streamActive` adalah `false`. | **Gagal** untuk validasi target. Eksekusi XSS di browser belum diuji. |
| S08 | `nama akun` | Target yang mengandung spasi di tengah ditolak dengan pesan format. | Status 200; target diteruskan ke scraper tiruan; `streamActive` adalah `false`. | **Gagal** untuk validasi target. |

Login tetap berhasil ketika koneksi TikTok tiruan gagal. Oleh sebab itu, status 200 ini menunjukkan autentikasi berhasil, bukan live berhasil terhubung.

## C. Form ganti target dan endpoint koneksi

Masukan berikut dikirim ke handler `POST /api/live/connect`. Stub mencatat target yang mencapai scraper kemudian mengembalikan kegagalan koneksi.

| ID | Data `channel` | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|
| G-S01 | `""` | Status 400 dan pesan target wajib diisi. | Status 400, `Channel TikTok live wajib diisi.`; scraper tidak dipanggil. | Lulus pada handler API. |
| G-S02 | `' OR 1=1;/*` | Tolak format sebelum memulai scraper. | Teks diteruskan ke scraper; status 400 berasal dari kegagalan koneksi tiruan. | **Gagal** validasi format. |
| G-S03 | `<script>alert(1)</script>` | Tolak format sebelum memulai scraper; jangan eksekusi sebagai kode. | Teks diteruskan ke scraper dan dipantulkan dalam pesan JSON; status 400 berasal dari stub. | **Gagal** validasi format; XSS di browser belum diuji. |
| G-S04 | `nama akun` | Tolak spasi di tengah sebelum memulai scraper. | Teks diteruskan ke scraper; status 400 berasal dari stub. | **Gagal** validasi format. |
| G-S05 | Angka `123` | Status 400 dengan pesan tipe data tidak valid. | Pemanggilan handler melempar `trim is not a function`; harness mencatat 500. | **Gagal**. |

Khusus G-S05, angka 500 adalah hasil pencatatan exception pada harness; respons aktual Express melalui jaringan belum diuji. Status 400 pada G-S02–G-S04 **bukan bukti validasi berhasil** karena sumbernya adalah stub koneksi setelah target sudah masuk ke scraper.

## Interpretasi dan tindak lanjut

Prioritas temuan adalah autentikasi API yang menerima sandi kosong dan fallback `password123`. Setelah itu, validasi tipe, panjang, dan format target perlu dilakukan di backend; antarmuka juga perlu memberikan pesan yang mudah dipahami. Uji keamanan XSS memerlukan browser dan pemeriksaan tampilan aktual; memantulkan teks pada JSON saja tidak membuktikan XSS. Materi juga membahas command injection, tetapi tidak ada jalur input-ke-shell yang dibuktikan pada pengujian ini, sehingga tidak ada klaim lulus atau gagal untuknya.

Untuk mengulang pengujian, dari folder `backend` jalankan `npx tsx uji_defensive.ts`. Hasil mentah berada pada `hasil_uji_defensive.json`.
