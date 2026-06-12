import { NextResponse } from "next/server";
import { getSessionUser, requireOfficer, requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const allowedStatuses = [
  "Menunggu Konfirmasi",
  "Sedang di Dalam Kantor",
  "Telah Meninggalkan Kantor",
  "Ditolak"
];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!requireOfficer(user)) {
    return NextResponse.json({ error: "Tidak memiliki akses mengubah status." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const status = String(body.status || "");

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  const patch: Record<string, unknown> = { status };

  if (status === "Sedang di Dalam Kantor") {
    patch.waktu_masuk = new Date().toISOString();
    patch.waktu_keluar = null;
    patch.petugas_masuk = user!.nama;
  }

  if (status === "Telah Meninggalkan Kantor") {
    patch.waktu_keluar = new Date().toISOString();
    patch.petugas_keluar = user!.nama;
  }

  if (status === "Ditolak") {
    patch.petugas_tolak = user!.nama;
  }

  const { data, error } = await supabaseAdmin
    .from("visits")
    .update(patch)
    .eq("id", id)
    .select(`
      id,status,tujuan,keperluan,waktu_masuk,waktu_keluar,petugas_masuk,petugas_keluar,petugas_tolak,sumber,created_at,
      guests:guest_id(id,nama,nik,instansi,hp,foto_base64,created_at)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ visit: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!requireAdmin(user)) {
    return NextResponse.json({ error: "Hanya administrator yang dapat menghapus data." }, { status: 403 });
  }

  const { id } = await params;

  const { error } = await supabaseAdmin.from("visits").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
