-- SI-TAMU MAKO - Supabase PostgreSQL Schema
-- Jalankan seluruh SQL ini di Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  username text not null unique,
  password_hash text not null,
  role text not null check (role in ('admin', 'petugas')),
  created_at timestamptz not null default now()
);

-- Mengunci agar hanya boleh ada 1 administrator utama.
create unique index if not exists unique_single_admin
on app_users ((role))
where role = 'admin';

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  nik text,
  instansi text,
  hp text,
  foto_base64 text,
  created_at timestamptz not null default now()
);

create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  tujuan text not null,
  keperluan text not null,
  status text not null default 'Menunggu Konfirmasi'
    check (status in ('Menunggu Konfirmasi', 'Sedang di Dalam Kantor', 'Telah Meninggalkan Kantor', 'Ditolak')),
  waktu_masuk timestamptz,
  waktu_keluar timestamptz,
  petugas_masuk text,
  petugas_keluar text,
  petugas_tolak text,
  sumber text not null default 'Form Tamu',
  created_at timestamptz not null default now()
);

create index if not exists visits_created_at_idx on visits (created_at desc);
create index if not exists visits_status_idx on visits (status);
create index if not exists guests_nik_idx on guests (nik);

-- Catatan:
-- Aplikasi ini memakai API server Next.js dengan SUPABASE_SERVICE_ROLE_KEY.
-- Jangan pernah meletakkan service role key di kode client/browser.
