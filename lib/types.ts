export type Role = "admin" | "petugas";

export type AppUser = {
  id: string;
  nama: string;
  username: string;
  role: Role;
  created_at: string;
};

export type VisitStatus =
  | "Menunggu Konfirmasi"
  | "Sedang di Dalam Kantor"
  | "Telah Meninggalkan Kantor"
  | "Ditolak";

export type VisitRow = {
  id: string;
  status: VisitStatus;
  tujuan: string;
  keperluan: string;
  waktu_masuk: string | null;
  waktu_keluar: string | null;
  petugas_masuk: string | null;
  petugas_keluar: string | null;
  petugas_tolak: string | null;
  sumber: string | null;
  created_at: string;
  guests: {
    id: string;
    nama: string;
    nik: string | null;
    instansi: string | null;
    hp: string | null;
    foto_base64: string | null;
    created_at: string;
  };
};
