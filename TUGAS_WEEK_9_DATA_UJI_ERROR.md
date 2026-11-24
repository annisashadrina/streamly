# Tugas Week 9 — Ragam Data Uji Error Form IMK

**Aplikasi:** Streamly — analisis chat TikTok Live
**Tujuan:** menyiapkan data masukan yang tidak benar dan respons yang diharapkan untuk pengujian antarmuka.

## Cakupan dan kondisi pengujian

Hasil pembacaan kode menunjukkan ada **dua elemen form** di aplikasi saat ini: form login dan form ganti target pada dashboard. Untuk memenuhi kebutuhan tiga bagian pengujian, tabel berikut membagi form login menjadi **login akun** dan **target TikTok saat login**. Bagian kedua adalah kolom dalam form login, bukan form terpisah. Jika tugas mensyaratkan tiga form yang benar-benar terpisah, proyek saat ini belum menyediakan form ketiga.

Kasus di bawah memuat rancangan data uji dan hasil eksekusi terbatas pada bagian **Hasil eksekusi**. Respons yang diharapkan adalah usulan perilaku yang mudah dipahami pengguna. Kosong berarti tidak mengisi karakter apa pun; `␠` berarti satu spasi.

**Persiapan:** jalankan frontend dan backend beserta basis data. Gunakan akun uji yang benar-benar ada dan kata sandi yang sesuai, disebut **akun valid** dan **sandi valid** di bawah. Seed proyek menyediakan `aryo_streamer` / `password123` apabila tabel pengguna awalnya kosong; periksa akun aktual jika database sudah pernah diisi. Untuk kasus ganti target, masuk terlebih dahulu lalu pilih **Ganti Target**. Jalankan satu kasus per percobaan dan pertahankan kolom lain valid kecuali disebutkan.

## 1. Form login — identitas dan kata sandi

Tekan tombol masuk biasa, bukan Mode Demo. Target TikTok dapat dibiarkan pada nilai awal `metropolitan.id`.

| ID | Data masukan error | Alasan | Respons yang diharapkan |
|---|---|---|---|
| L01 | Identitas: kosong; sandi: kosong | Kedua kolom wajib kosong. | Login ditahan; minta pengguna mengisi username atau email terlebih dahulu. |
| L02 | Identitas: `␠␠␠`; sandi: sandi valid | Identitas hanya spasi. | Login ditahan dan muncul pesan identitas wajib diisi. |
| L03 | Identitas: `@`; sandi: sandi valid | Identitas kosong setelah tanda `@` dibersihkan. | Login ditahan dan muncul pesan identitas wajib diisi. |
| L04 | Identitas: akun valid; sandi: kosong | Kata sandi wajib kosong. | Login ditahan dan muncul pesan kata sandi wajib diisi. |
| L05 | Identitas: akun valid; sandi: `sandi_salah_987` | Kata sandi tidak cocok. | Login gagal dan pengguna mendapat pesan kata sandi salah. |
| L06 | Identitas: `akun_tidak_terdaftar_987`; sandi: sandi valid | Akun tidak terdaftar; pastikan tidak ada di database. | Login gagal dan muncul pesan pengguna tidak ditemukan. |
| L07 | Identitas: `nama@@contoh..com`; sandi: sandi valid | Contoh format email tidak benar; pastikan bukan username terdaftar. | Login gagal dan pengguna mendapat pesan identitas tidak valid atau tidak ditemukan. |
| L08 | Identitas: akun valid; sandi: `␠␠␠` | Spasi bukan sandi yang sesuai untuk akun uji. | Login gagal dan muncul pesan kata sandi salah atau wajib diisi. |

**Catatan kode:** frontend memeriksa identitas setelah menghapus spasi tepi dan satu `@` awal, serta memeriksa sandi kosong. Format email tidak divalidasi khusus karena kolom juga menerima username. Backend mencocokkan akun dan sandi; pesan kesalahan dapat bergantung pada database. Secara terpisah, layanan autentikasi backend saat ini melewati pemeriksaan bila sandi tidak dikirim atau kosong, dan menerima `password123` sebagai sandi fallback. Karena itu, validasi pada form saja tidak menjamin API menolak sandi kosong; perlu diuji dan diperbaiki pada backend. Mode Demo memang melewati autentikasi dan tidak digunakan sebagai bukti login akun valid.

## 2. Masukan target TikTok pada form login

Isi identitas dan sandi dengan akun valid, lalu ganti kolom **Target Akun TikTok Live** dengan satu nilai berikut dan tekan masuk biasa. Kolom ini bersifat opsional dalam implementasi sekarang: nilai kosong digantikan identitas login. Jadi kasus kosong di bawah adalah uji perilaku fallback, **bukan** data yang otomatis salah menurut aturan saat ini.

| ID | Data masukan target | Alasan / kondisi | Respons yang diharapkan |
|---|---|---|---|
| T01 | `nama akun` | Ada spasi di tengah username. | Beri pesan bahwa format username target tidak sesuai sebelum memulai koneksi. |
| T02 | `nama#akun` | Memuat karakter `#` pada username. | Beri pesan format target tidak sesuai. |
| T03 | `https://www.tiktok.com/@contoh` | URL profil dimasukkan pada kolom username. | Minta username saja atau ubah URL menjadi username dengan penjelasan yang jelas. |
| T04 | `@@contoh` | Tanda `@` dimasukkan dua kali. | Beri pesan format target tidak sesuai. |
| T05 | `akun_tidak_ada_987654321` | Contoh target yang harus dipastikan tidak ada sebelum uji. | Beri tahu bahwa target tidak ditemukan atau koneksi gagal; jangan menyatakan live terhubung. |
| T06 | Nama akun TikTok yang diketahui sedang offline | Target ada, tetapi tidak sedang live; verifikasi kondisi saat uji. | Login akun tetap dapat berhasil, tetapi status target harus menunjukkan live belum terhubung. |
| T07 | Kosong atau `␠␠␠` | Kasus batas: target opsional menurut kode. | Jelaskan target pengganti yang digunakan agar pengguna tidak bingung. |

**Catatan kode:** target dibersihkan dari spasi di awal/akhir dan satu `@` awal, tetapi tidak terlihat validasi format lebih lanjut. Nilai kosong diganti identitas login; jika identitas berupa email, target pengganti juga dapat berupa email. Backend mengizinkan login berhasil ketika scraper gagal, sehingga hasil koneksi perlu diperiksa terpisah dari hasil login.

## 3. Form ganti target TikTok Live pada dashboard

Setelah masuk, klik **Ganti Target**, masukkan data, lalu klik **Hubungkan**. Catat target yang aktif sebelum percobaan.

| ID | Data masukan error | Alasan | Respons yang diharapkan |
|---|---|---|---|
| G01 | Kosong | Target baru tidak diisi. | Target lama tetap aktif dan muncul pesan bahwa username wajib diisi. |
| G02 | `␠␠␠` | Hanya spasi. | Target lama tetap aktif dan muncul pesan bahwa username wajib diisi. |
| G03 | `@` | Kosong setelah tanda `@` dibersihkan. | Target lama tetap aktif dan muncul pesan bahwa username wajib diisi. |
| G04 | `nama akun` | Username mengandung spasi di tengah. | Tolak input dan tampilkan pesan format username tidak sesuai. |
| G05 | `nama#akun` | Username mengandung karakter `#`. | Tolak input dan tampilkan pesan format username tidak sesuai. |
| G06 | `https://www.tiktok.com/@contoh` | URL dimasukkan sebagai username. | Minta username saja atau olah URL menjadi username secara jelas. |
| G07 | `@@contoh` | Tanda `@` ganda. | Tolak input dan tampilkan pesan format username tidak sesuai. |
| G08 | `akun_tidak_ada_987654321` | Target yang tidak ditemukan; pastikan dahulu akun tidak ada. | Beri pesan kegagalan koneksi dan pertahankan target lama. |
| G09 | Akun TikTok yang diketahui sedang offline | Akun ada tetapi tidak sedang live; verifikasi saat uji. | Beri tahu bahwa live belum tersedia dan pertahankan target lama jika koneksi gagal. |

**Catatan kode:** input kosong setelah dibersihkan langsung dihentikan tanpa pesan pada handler. Untuk input lain, format tidak tampak diperiksa di frontend; hasil koneksi bergantung pada respons backend dan layanan TikTok. Tanda `@` tunggal di awal username normal dibersihkan dan bukan dianggap error.

## Cara mencatat hasil

Untuk setiap ID: (1) isi data sesuai tabel, (2) kirim form, (3) catat pesan dan perubahan layar atau target, (4) bandingkan dengan respons yang diharapkan, dan (5) tandai **Lulus** jika sesuai atau **Gagal** jika tidak sesuai. Simpan tangkapan layar sebagai bukti bila diminta dosen. Jangan mengisi status lulus/gagal sebelum menjalankan percobaan.

| ID | Hasil aktual | Status | Bukti / catatan |
|---|---|---|---|
| Contoh | Isi hasil aktual dari percobaan lanjutan | Lulus / Gagal | Tangkapan layar bila tersedia |

## Hasil eksekusi — 12 November 2026

Pengujian menjalankan **handler asli** `handleSubmit` dan `handleChangeChannel` yang diambil langsung dari kode frontend. State React, penyimpanan lokal, serta respons `fetch` disimulasikan dengan skrip `uji_form_logika.cjs`; hasil mentah tersimpan di `hasil_uji_form_logika.json`. Pengujian ini tidak menjalankan tampilan di browser atau mengakses MySQL/TikTok. Respons berhasil/gagal dari backend adalah respons tiruan, sehingga status di bawah hanya berlaku untuk logika frontend dalam kondisi simulasi. Upaya menjalankan browser tidak berhasil; port standar MySQL dan Redis juga tidak terdeteksi aktif.

| ID | Hasil aktual pada simulasi | Status terhadap respons yang diharapkan |
|---|---|---|
| L01, L02, L03 | Handler menahan pengiriman dan mengatur pesan identitas wajib diisi. | Lulus pada handler frontend. |
| L04 | Handler menahan pengiriman dan mengatur pesan kata sandi wajib diisi. | Lulus pada handler frontend. |
| L05, L08 | Data dikirim ke backend tiruan; respons sandi salah ditampilkan oleh handler. | Lulus dengan backend tiruan; autentikasi asli belum diuji. |
| L06, L07 | Data dikirim ke backend tiruan; respons pengguna tidak ditemukan diteruskan oleh handler. | Lulus dengan backend tiruan; database asli belum diuji. |
| T01, T02, T03 | Nilai target tidak ditolak dan dikirim apa adanya; respons login tiruan diterima. | Gagal: tidak ada pesan validasi format sebelum pengiriman. |
| T04 | `@@contoh` dibersihkan menjadi `@contoh` dan dikirim tanpa pesan validasi. | Gagal terhadap respons yang diharapkan. |
| T05, T06 | Tidak dicoba ke TikTok sebenarnya. | Belum diuji; membutuhkan verifikasi akun dan status live. |
| T07 | Target kosong diganti `aryo_streamer` dan dikirim tanpa pesan penjelasan. | Fallback berjalan; gagal terhadap usulan pemberitahuan target pengganti. |
| G01, G02, G03 | Pengiriman dihentikan dan target tidak diubah, tetapi tidak ada pesan error. | Gagal sebagian: target tetap, tetapi pesan wajib diisi tidak muncul. |
| G04, G05, G06 | Nilai tidak ditolak di frontend dan diteruskan ke backend tiruan, yang mengembalikan kegagalan. | Gagal validasi format frontend; hasil backend asli belum diuji. |
| G07 | `@@contoh` dibersihkan menjadi `@contoh` dan diteruskan ke backend tiruan. | Gagal validasi format frontend. |
| G08 | Handler meneruskan target; respons kegagalan tiruan ditampilkan dan target tidak diubah. | Belum dapat dinilai untuk akun nyata; penanganan respons gagal bekerja dalam simulasi. |
| G09 | Tidak dicoba ke TikTok sebenarnya. | Belum diuji; membutuhkan akun yang dipastikan offline. |

Jalankan ulang dari direktori proyek dengan `node uji_form_logika.cjs`. File JSON berisi data akun dan sandi **khusus simulasi**, bukan bukti keberhasilan autentikasi sebenarnya. Untuk menyelesaikan pengujian IMK, jalankan kasus tersebut pada browser dengan backend, MySQL, Redis, dan koneksi TikTok yang aktif, lalu catat pesan aktual serta tangkapan layar.

**Sumber yang dipelajari:** `README.md`, `frontend/src/auth/LoginPage.jsx`, `frontend/src/pages/DashboardPage.jsx`, `frontend/src/pages/AccountPage.jsx`, `backend/src/cmd/api/app.ts`, `backend/src/internal/service/auth.ts`, dan `backend/src/internal/repository/db.ts`.
