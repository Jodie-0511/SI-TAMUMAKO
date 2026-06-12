import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const nama = String(body.nama || "").trim();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!nama || !username || password.length < 4) {
    return NextResponse.json({ error: "Nama, username, dan password minimal 4 karakter wajib diisi." }, { status: 400 });
  }

  const { count, error: countError } = await supabaseAdmin
    .from("app_users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  if (count && count > 0) {
    return NextResponse.json({ error: "Administrator utama sudah ada." }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .insert({ nama, username, password_hash, role: "admin" })
    .select("id,nama,username,role,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await setSessionCookie({
    id: data.id,
    nama: data.nama,
    username: data.username,
    role: data.role
  });

  return NextResponse.json({ user: data });
}
