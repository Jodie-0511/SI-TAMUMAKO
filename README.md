# SI-TAMU MAKO Online Database

Aplikasi SI-TAMU MAKO versi online database berbasis:

- Next.js
- Supabase PostgreSQL
- Vercel
- Session cookie server-side
- Administrator tunggal
- Petugas Jaga fleksibel
- Data tamu online lintas perangkat

## Fitur

1. Halaman depan modern tanpa QR.
2. Form registrasi tamu online.
3. Foto tamu via kamera browser.
4. Setup Administrator Utama hanya sekali.
5. Administrator tidak bisa dibuat ulang karena dikunci oleh database.
6. Admin dapat menambah/hapus Petugas Jaga.
7. Petugas Jaga dapat mengubah status:
   - Menunggu Konfirmasi
   - Sedang di Dalam Kantor
   - Telah Meninggalkan Kantor
   - Ditolak
8. Riwayat kunjungan online.
9. Hapus riwayat kunjungan khusus admin.
10. Export CSV.
11. PDF detail tamu.
12. PDF rekap berdasarkan rentang tanggal.
13. Semua perangkat membaca database yang sama.

## Cara Instalasi

### 1. Buat project Supabase

Buka Supabase, buat project baru, lalu buka SQL Editor.

Jalankan file:

```txt
sql/schema.sql
```

### 2. Ambil Supabase credentials

Di Supabase buka:

```txt
Project Settings → API
```

Ambil:

- Project URL
- service_role key

Penting: gunakan `service_role key` hanya di environment variable server, jangan di client.

### 3. Isi `.env.local`

Copy file `.env.example` menjadi `.env.local`, lalu isi:

```env
SUPABASE_URL=https://PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=isi_service_role_key_supabase
SESSION_SECRET=buat_secret_panjang_minimal_32_karakter
```

### 4. Jalankan lokal

```bash
npm install
npm run dev
```

Buka:

```txt
http://localhost:3000
```

### 5. Deploy ke Vercel

Upload project ini ke GitHub, lalu import ke Vercel.

Di Vercel isi Environment Variables:

```env
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SESSION_SECRET
```

Redeploy project.

## Cara Penggunaan Awal

1. Buka `/admin`.
2. Karena database masih kosong, sistem menampilkan setup Administrator Utama.
3. Buat akun admin pertama.
4. Setelah itu admin dapat menambah Petugas Jaga.
5. Tamu membuka `/tamu` untuk mengisi form.
6. Admin/Petugas memantau status di `/admin`.

## Catatan Keamanan

- Aplikasi ini sudah tidak memakai `localStorage` untuk akun dan data tamu.
- Data tersimpan di Supabase PostgreSQL.
- Password disimpan dengan bcrypt hash.
- Session login memakai HTTP-only cookie.
- Administrator dikunci satu akun oleh unique partial index pada database.
