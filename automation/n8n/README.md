# Notifikasi WhatsApp otomatis (n8n + WhatsApp Cloud API)

Saat pesanan berubah ke **Siap Diambil**, pelanggan menerima pesan WhatsApp berisi kode pesanan, cabang, sisa tagihan (bila ada), dan tautan pelacakan. Pesan dikirim oleh workflow n8n lewat **WhatsApp Cloud API resmi milik Meta**, bukan dari aplikasi WashFlow.

File di folder ini:

- `washflow-wa-siap-diambil.json`: workflow n8n siap impor.
- `README.md`: panduan ini.

## Cara kerjanya

```
Kasir menggeser pesanan ke "Siap Diambil"
   -> trigger database menaruh 1 baris di tabel notifications (hanya bila saklar aktif)
   -> n8n (tiap 1 menit) memanggil claim_notifications(): mengambil dan mengunci baris yang siap
   -> n8n mengirim template WhatsApp
   -> n8n memanggil complete_notification(): sent, atau gagal (dicoba ulang maksimal 3 kali)
```

Kenapa antrean di database dan bukan webhook langsung:

- Status pengiriman tersimpan dan terlihat di **Detail pesanan** (Menunggu, Terkirim, Gagal).
- Bila n8n mati lalu hidup lagi, pesan yang tertunda tetap terkirim, tanpa kiriman ganda.
- Satu pesanan hanya dinotifikasi sekali, meski statusnya dimundurkan lalu Siap lagi.
- Pesan yang menunggu lebih dari 6 jam dilewati (tidak relevan lagi), begitu juga pesanan yang sudah tidak berstatus Siap.
- Database tidak perlu tahu alamat n8n, dan tidak ada yang perlu dibuka ke internet dari sisi Supabase.

## Yang perlu disiapkan

1. Aplikasi WashFlow sudah ter-deploy dan `npx supabase db push` sudah dijalankan (migrasi `20260929000700_m5b_notifications.sql`).
2. Instance n8n yang selalu hidup (n8n Cloud, atau self-host di VPS dengan HTTPS dan login). Node Schedule hanya berjalan bila workflow **Active** dan n8n menyala.
3. Akun Meta Business dan aplikasi di [developers.facebook.com](https://developers.facebook.com) dengan produk **WhatsApp**. Menu dan nama tombol Meta sering berubah, jadi ikuti dokumentasi resmi Meta bila tampilannya berbeda dari yang ditulis di sini.

## Langkah 1: Template pesan di Meta

WhatsApp mewajibkan pesan yang dikirim lebih dulu oleh bisnis memakai **template yang sudah disetujui**. Buat di WhatsApp Manager > Message templates:

| Isian | Nilai |
| --- | --- |
| Nama | `pesanan_siap_diambil` (harus sama dengan `templateName` di node Config) |
| Kategori | Utility |
| Bahasa | Indonesian (`id`) |

Isi (body):

```
Halo {{1}}, cucian Anda ({{2}}) di {{3}} sudah siap diambil. {{4}} Pantau pesanan di sini: {{5}} Terima kasih.
```

Contoh nilai yang diminta Meta saat pengajuan:

| Variabel | Isi sebenarnya | Contoh |
| --- | --- | --- |
| `{{1}}` | Nama depan pelanggan | Made |
| `{{2}}` | Kode pesanan | WF-2609-00071 |
| `{{3}}` | Nama cabang | Cabang Denpasar |
| `{{4}}` | Sisa tagihan atau "Pesanan sudah lunas." | Sisa tagihan Rp 63.000. |
| `{{5}}` | Tautan pelacakan | https://contoh.com/track/abc123 |

Catatan: teks tidak boleh diawali atau diakhiri variabel (itu sebabnya ada "Halo" di depan dan "Terima kasih." di belakang). Urutan variabel di template harus sama dengan urutan di node **Build message**. Jika Anda mengubah kalimat, ubah juga jumlah dan urutan parameternya. Persetujuan biasanya cepat, tetapi Meta bisa menolak; baca alasan penolakannya lalu ajukan ulang.

## Langkah 2: Nomor pengirim dan token

1. Di aplikasi Meta > WhatsApp > API Setup, catat **Phone number ID** (bukan nomor teleponnya).
2. Mode uji: Meta menyediakan nomor uji dan daftar penerima yang harus Anda tambahkan dulu (maksimal beberapa nomor). Kirim ke nomor di luar daftar akan ditolak.
3. Token sementara dari halaman API Setup berlaku singkat. Untuk pemakaian nyata buat token permanen lewat **System User** di Business Settings, dengan izin `whatsapp_business_messaging` dan `whatsapp_business_management`, lalu berikan akses ke aplikasi dan akun WhatsApp Business Anda.
4. Untuk klien sungguhan, daftarkan nomor WhatsApp milik klien (bukan nomor uji) dan selesaikan verifikasi bisnis sesuai aturan Meta.

## Langkah 3: Credential di n8n

Buat dua credential (Credentials > Create). Isi kuncinya **langsung di n8n**. Jangan menempelkannya di chat, repo, atau berkas `.env` frontend.

1. **Supabase API**, beri nama `WashFlow Supabase`
   - Host: `https://<project-id>.supabase.co`
   - Service Role Secret: kunci `service_role` dari Supabase Dashboard > Project Settings > API.
2. **Bearer Auth**, beri nama `WhatsApp Cloud API token`
   - Token: token WhatsApp dari Langkah 2.

Kunci `service_role` melewati RLS, jadi perlakukan seperti kata sandi: n8n harus memakai HTTPS dan login, dan kunci diganti bila pernah bocor. Fungsi yang dipakai workflow ini (`claim_notifications`, `complete_notification`) hanya bisa dipanggil dengan kunci itu; pengguna aplikasi biasa (termasuk admin) tidak bisa memanggilnya.

## Langkah 4: Impor dan atur workflow

1. n8n > Workflows > Import from file > pilih `washflow-wa-siap-diambil.json`.
2. Buka node **Config** dan ganti semua nilai bertanda GANTI:
   - `supabaseUrl`: `https://<project-id>.supabase.co`
   - `appUrl`: alamat aplikasi WashFlow yang sudah ter-deploy (dipakai untuk tautan pelacakan).
   - `phoneNumberId`: dari Langkah 2.
   - `templateName` dan `templateLang`: sesuai template Anda. `waApiVersion` bisa dinaikkan mengikuti versi Graph API yang didukung Meta.
3. Pasang credential pada node **Ambil antrean**, **Tandai terkirim**, **Tandai gagal** (Supabase) dan **Kirim WhatsApp** (Bearer).

## Langkah 5: Uji sebelum dinyalakan untuk klien

1. Di WashFlow (login admin) buka **Pengaturan > Notifikasi WhatsApp Otomatis** dan aktifkan saklarnya. Bawaannya mati supaya instalasi tanpa n8n tidak menumpuk antrean.
2. Pastikan nomor pelanggan uji terdaftar di daftar penerima Meta (mode uji).
3. Geser satu pesanan pelanggan uji ke **Siap Diambil**.
4. Di n8n tekan **Execute workflow** (atau tunggu semenit), lalu cek WhatsApp uji.
5. Buka Detail pesanan di WashFlow: bagian **Notifikasi WhatsApp** harus berubah dari Menunggu dikirim menjadi Terkirim.
6. Setelah puas, aktifkan workflow (**Active**).

## Bila ada masalah

| Gejala | Kemungkinan penyebab dan tindakan |
| --- | --- |
| Status menunggu terus, tidak berubah | Workflow belum Active atau n8n mati. Ringkasan di halaman Pengaturan menampilkan jumlah menunggu. |
| Gagal, pesan berisi `131026` | Nomor pelanggan bukan pengguna WhatsApp, atau tidak bisa dijangkau. Tidak dicoba ulang. Hubungi lewat tombol WhatsApp manual di Detail pesanan. |
| Gagal, pesan berisi `131030` | Mode uji: nomor belum ada di daftar penerima Meta. Tidak dicoba ulang. |
| Gagal, `132000`, `132001`, atau `132012` | Template tidak cocok dengan kiriman: jumlah variabel, nama atau bahasa, atau belum disetujui. Perbaiki template atau node Build message. Tidak dicoba ulang. |
| Gagal, `190` atau 401 | Token WhatsApp salah atau kedaluwarsa (token sementara hanya berlaku singkat). |
| Node Ambil antrean gagal 401 atau 403 | Service Role Secret salah. Bila project memakai format kunci baru dan n8n menolaknya, coba kunci `service_role` versi lama (JWT) dari tab legacy. |
| Node Ambil antrean gagal 404 atau fungsi tidak ditemukan | Migrasi `20260929000700_m5b_notifications.sql` belum dijalankan (`npx supabase db push`). |
| Pesan terkirim dua kali | Sangat jarang: WhatsApp menerima pesan tetapi pelaporan ke database gagal berturut-turut, sehingga baris dikembalikan ke antrean setelah 10 menit. |

Kegagalan lain (jaringan, 5xx dari Meta) dicoba ulang otomatis dengan jeda 5 menit lalu 10 menit, maksimal 3 percobaan, setelah itu berstatus Gagal.

## Biaya dan aturan yang perlu diketahui

- n8n Cloud berbayar; self-host membutuhkan VPS dan perawatan (HTTPS, cadangan, pembaruan).
- Meta menagih pesan template per pesan terkirim, dengan tarif berbeda per kategori dan negara (tersedia dalam Rupiah). Template Utility yang dikirim dalam jendela layanan pelanggan yang sedang terbuka gratis. Cek daftar tarif terbaru di dokumentasi Meta sebelum menawarkan harga ke klien.
- Pelanggan sebaiknya tahu bahwa nomornya dipakai untuk kabar pesanan (mis. satu kalimat di struk atau saat pendaftaran pelanggan). Meta juga mensyaratkan izin (opt-in) dari penerima.
- Jangan mengganti dengan library WhatsApp tidak resmi (sesi WhatsApp Web): akun klien bisa diblokir.

## Yang belum ada

- Hanya satu jenis notifikasi (pesanan siap). Struktur tabel sudah mengizinkan jenis lain, tinggal menambah trigger dan template.
- Tidak ada webhook status dibaca/terkirim dari Meta; status "Terkirim" berarti diterima oleh WhatsApp Cloud API.
- Tidak ada tombol kirim ulang di aplikasi; untuk yang Gagal, gunakan tautan WhatsApp manual di Detail pesanan.
- Kunci `service_role` di n8n punya akses penuh. Peningkatan keamanan di masa depan: peran database khusus otomasi yang hanya boleh memanggil dua fungsi ini.

## Yang sudah diuji dan yang belum

Diuji dengan n8n 2.x sungguhan yang menjalankan workflow ini terhadap database Supabase-kompatibel lokal dan server WhatsApp tiruan: pengiriman sukses, penandaan terkirim, kegagalan permanen (131026) tanpa percobaan ulang, kegagalan sementara (500) dengan 3 percobaan lalu gagal, antrean kosong, dan pengambil antrean yang berjalan bersamaan tanpa saling tumpang tindih.

**Belum diuji terhadap WhatsApp Cloud API sungguhan.** Uji dengan nomor uji Meta (Langkah 5) sebelum diserahkan ke klien. Kemungkinan hal yang perlu disesuaikan: teks template (penolakan Meta), versi Graph API, dan format kunci Supabase.
