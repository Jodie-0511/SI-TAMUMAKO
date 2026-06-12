import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  let query = supabaseAdmin
    .from("visits")
    .select(`
      id,status,tujuan,keperluan,waktu_masuk,waktu_keluar,petugas_masuk,petugas_keluar,petugas_tolak,sumber,created_at,
      guests:guest_id(id,nama,nik,instansi,hp,foto_base64,created_at)
    `)
    .order("created_at", { ascending: false });

  if (start) query = query.gte("created_at", `${start}T00:00:00`);
  if (end) query = query.lte("created_at", `${end}T23:59:59`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ visits: data });
}

export async function POST(req: Request) {
  const body = await req.json();

  const nama = String(body.nama || "").trim();
  const nik = String(body.nik || "").trim();
  const instansi = String(body.instansi || "").trim();
  const hp = String(body.hp || "").trim();
  const tujuan = String(body.tujuan || "").trim();
  const keperluan = String(body.keperluan || "").trim();
  const foto_base64 = String(body.foto_base64 || "").trim();

  if (!nama || !tujuan || !keperluan) {
    return NextResponse.json({ error: "Nama, tujuan, dan keperluan wajib diisi." }, { status: 400 });
  }

  const { data: guest, error: guestError } = await supabaseAdmin
    .from("guests")
    .insert({ nama, nik, instansi, hp, foto_base64 })
    .select("id,nama,nik,instansi,hp,foto_base64,created_at")
    .single();

  if (guestError) return NextResponse.json({ error: guestError.message }, { status: 500 });

  const { data: visit, error: visitError } = await supabaseAdmin
    .from("visits")
    .insert({
      guest_id: guest.id,
      tujuan,
      keperluan,
      status: "Menunggu Konfirmasi",
      sumber: "Form Tamu"
    })
    .select(`
      id,status,tujuan,keperluan,waktu_masuk,waktu_keluar,petugas_masuk,petugas_keluar,petugas_tolak,sumber,created_at,
      guests:guest_id(id,nama,nik,instansi,hp,foto_base64,created_at)
    `)
    .single();

  if (visitError) return NextResponse.json({ error: visitError.message }, { status: 500 });

  return NextResponse.json({ visit });
}
