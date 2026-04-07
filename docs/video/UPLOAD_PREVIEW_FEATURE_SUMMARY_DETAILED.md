# Upload dan Preview Pipeline v2

## Ringkasan Eksekutif
Dokumen ini menjelaskan implementasi fitur upload dan preview media versi terbaru yang sudah diterapkan pada aplikasi aktif di folder apps. Fokus utama implementasi adalah:

- Upload video besar yang tahan gangguan jaringan melalui resumable chunk upload.
- Pengalaman pengguna non-blocking, sehingga composer dapat ditutup dan upload tetap berjalan di background.
- Status upload real-time melalui websocket agar progres dapat dipantau secara global dari mana pun di aplikasi.
- Perceived performance feed yang lebih cepat untuk gambar melalui thumbnail teroptimasi dan metadata blurhash.
- Batas ukuran upload video 100MB yang ditegakkan konsisten di backend dan frontend.

Secara fungsional, user sekarang bisa mulai upload video, menutup modal, berpindah halaman, lalu tetap melihat progres, retry, cancel, dan status akhir upload tanpa kehilangan konteks.

## Tujuan Produk dan Alasan Teknis
Sebelum perubahan ini, upload media berpotensi terasa rapuh saat koneksi tidak stabil dan pengalaman upload cenderung mengunci alur pengguna di composer. Di sisi feed, gambar ukuran besar juga bisa memperlambat persepsi loading awal.

Perubahan v2 menjawab itu dengan tiga strategi:

1. Reliability first untuk video upload: file dibagi per chunk dan tiap chunk dapat diulang kirim jika gagal.
2. UX continuity: status upload dipindahkan ke global task manager, bukan lagi terikat lifecycle satu modal.
3. Faster first paint untuk gambar: feed dapat memakai thumbnail ringan terlebih dulu, sambil tetap mempertahankan image full quality.

## Cakupan Implementasi
Implementasi mencakup backend NestJS pada apps/backend dan frontend Next.js pada apps/frontend.

Area utama yang berubah:

- API resumable upload session untuk video.
- Service backend pengelolaan chunk, assembly, complete, cancel, dan status emit websocket.
- Global upload task store di frontend (Zustand), termasuk retry per chunk dan cancel.
- Widget global status upload di UI.
- Integrasi websocket event upload:status pada provider frontend.
- Pipeline turunan gambar (thumbnail, blurhash, metadata dimensi).
- Penyesuaian response data feed/post agar metadata turunan gambar tersedia ke frontend.

## Arsitektur Upload Video Resumable

### 1) Pembuatan Session Upload
Saat user memilih video, frontend memulai request pembuatan session. Backend memvalidasi:

- mimeType harus video/*
- fileSize tidak boleh melebihi 100MB
- totalChunks harus lebih dari 0

Backend lalu membuat sessionId dan taskId, menyiapkan folder chunk sementara, lalu menyimpan state session di memory map.

State inti session:

- identitas: sessionId, taskId, userId
- metadata file: fileName, mimeType, fileSize
- parameter upload: totalChunks, chunkSize
- progres: uploadedChunks, chunkSizes, uploadedBytes
- status lifecycle: created, uploading, processing, completed, failed

### 2) Upload Chunk Bertahap
Frontend mengirim chunk satu per satu (dengan paralel terbatas). Untuk setiap chunk:

- Backend cek index valid.
- Backend cek ukuran chunk dan total akumulasi agar tidak menembus batas 100MB.
- Chunk disimpan sebagai berkas part per index.
- Progres dihitung dari jumlah chunk terunggah.
- Backend emit status websocket ke user terkait.

Pada tahap ini, upload tahan gangguan karena chunk yang gagal bisa dikirim ulang tanpa mengulang dari awal file.

### 3) Retry per Chunk
Frontend menerapkan retry otomatis per chunk hingga beberapa kali percobaan. Bila jaringan sementara gagal, task tidak langsung gagal total. Ini mengurangi friksi pada koneksi mobile atau jaringan tidak stabil.

### 4) Complete Session
Setelah seluruh chunk terunggah:

- Frontend memanggil endpoint complete.
- Backend memverifikasi tidak ada chunk yang hilang.
- Backend menggabungkan seluruh part sesuai urutan index menjadi file utuh.
- Backend menjalankan alur publish video melalui service video yang sudah ada.
- Backend emit status akhir completed atau failed.

### 5) Cancel Session
User bisa membatalkan task upload yang sedang berjalan:

- Frontend menghentikan request aktif melalui AbortController.
- Backend menerima cancel session.
- File sementara chunk dibersihkan dan state task diubah ke canceled.

## Arsitektur Status Realtime

### Event Emission di Backend
Backend mengirim event upload:status ke room user khusus. Payload dapat memuat:

- taskId/sessionId
- status
- progress
- uploadedChunks dan totalChunks
- message
- error jika ada

### Subscription di Frontend
Frontend subscribe event upload:status pada socket provider. Ketika event masuk:

- payload diterapkan ke global upload store
- kartu status di UI langsung berubah tanpa perlu refresh
- task tetap terpantau walau user sudah menutup composer

## Arsitektur Global Background Upload UI

### Store Upload Task
Global state menyimpan task upload lintas halaman, dengan kemampuan:

- startVideoUpload
- retryTask
- cancelTask
- dismissTask
- applyServerStatus

Status yang dikelola:

- queued
- creating-session
- uploading
- processing
- completed
- failed
- canceled

### Widget Global Status
Widget floating di kanan bawah menampilkan semua task aktif dan task selesai sementara.

Fitur UI:

- Progress bar persentase
- Counter chunk selesai versus total chunk
- Tombol Retry saat failed
- Tombol Batal saat running
- Tombol Tutup saat completed/failed/canceled

Hasilnya, user memiliki kontrol penuh upload tanpa harus tetap berada di satu modal.

## Progressive Image Pipeline

### 1) Derivative Generation di Backend
Setiap aset gambar post dapat diproses menjadi data turunan:

- thumbnail webp (ringan, ukuran maksimal 640 sisi panjang)
- blurhash untuk placeholder visual
- metadata dimensi source dan thumbnail

Langkah teknis ringkas:

- Ambil source buffer dari file upload atau URL.
- Baca metadata asli (width/height).
- Buat thumbnail webp quality teroptimasi.
- Buat blurhash dari versi gambar kecil raw.
- Upload thumbnail ke storage.

Jika proses derivative gagal, post tetap berjalan dengan fallback aman:

- url asli tetap dipakai
- field turunan bernilai null

### 2) Penyimpanan Metadata
Schema database diperluas untuk menyimpan:

- thumbnailUrl
- blurhash
- width/height
- thumbnailWidth/thumbnailHeight

Dengan ini, client bisa memilih strategi render yang lebih cepat tanpa kehilangan fleksibilitas kualitas.

### 3) Pemakaian di Feed
Frontend feed memprioritaskan thumbnailUrl saat tersedia, lalu fallback ke url asli. Dampaknya:

- waktu tampil awal lebih cepat
- bandwidth awal lebih hemat
- pengalaman scroll feed terasa lebih responsif

## Fast Path Upload Gambar
Selain pipeline derivative, alur gambar juga didukung fast upload path:

- frontend minta presigned URLs ke backend
- browser upload langsung ke object storage
- backend membuat post dari URLs hasil upload

Jika tahap cepat gagal, tersedia fallback multipart upload supaya alur posting tetap bisa lanjut.

## Validasi dan Guardrail 100MB
Batas 100MB diterapkan berlapis:

- DTO request session resumable.
- Validasi service saat create session.
- Validasi akumulasi bytes saat upload chunk.
- Validasi hasil assembly sebelum publish.
- Guard tambahan pada sisi frontend sebelum upload dimulai.

Pendekatan berlapis ini mencegah bypass dari satu pintu validasi saja.

## Alur Pengguna End-to-End

### Alur Video
1. User pilih video di composer.
2. Frontend validasi ukuran dan tipe dasar.
3. Frontend membuat upload task global.
4. Backend membuat session resumable.
5. Frontend upload chunk paralel terbatas, dengan retry otomatis per chunk.
6. Progress tampil real-time di widget global.
7. User boleh menutup composer dan lanjut aktivitas lain.
8. Frontend panggil complete saat semua chunk sukses.
9. Backend gabungkan file dan publish video.
10. Task berubah ke completed, user melihat status selesai.

### Alur Gambar
1. User pilih gambar.
2. Frontend upload via fast path presigned URLs.
3. Backend membuat post from URLs.
4. Backend proses thumbnail + blurhash + metadata.
5. Feed menggunakan thumbnail untuk render awal lebih cepat.

## Dampak UX dan Kinerja

### Dampak UX
- Upload video tidak lagi memaksa user menunggu di modal.
- Transparansi progres lebih baik karena status terlihat global.
- Kegagalan parsial lebih mudah dipulihkan lewat retry, bukan restart full.

### Dampak Kinerja
- Chunk upload menurunkan risiko gagal total untuk file besar.
- Thumbnail gambar menurunkan biaya render awal feed.
- Event realtime mengurangi polling manual dari frontend.

## Keterbatasan Saat Ini
Beberapa batasan yang masih ada pada implementasi saat ini:

- Session resumable disimpan in-memory di backend.
- Jika service restart, session aktif bisa hilang.
- Untuk skala multi-instance horizontal, penyimpanan session perlu dipindah ke Redis atau database.

## Rekomendasi Pengembangan Lanjutan
Untuk meningkatkan robustness produksi:

1. Persist session resumable ke Redis agar restart-safe dan multi-instance safe.
2. Tambahkan mekanisme resume after app reload di client dengan sinkron status session.
3. Gunakan blurhash secara eksplisit sebagai placeholder UI sebelum thumbnail siap.
4. Tambahkan metrik operasional upload success rate, retry rate, dan average completion time.
5. Tambahkan test e2e khusus skenario jaringan buruk dan chunk retry.

## Status Verifikasi
Implementasi sudah tervalidasi melalui:

- Build backend sukses.
- Build frontend sukses.
- Diagnostics pada file inti yang diubah menunjukkan tidak ada error.

Dokumen ini bisa dipakai sebagai acuan onboarding tim, referensi QA, dan baseline keputusan untuk hardening tahap berikutnya.
