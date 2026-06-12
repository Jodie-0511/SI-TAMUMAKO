import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("id,nama,username,role,created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Hanya administrator yang dapat menambah petugas." }, { status: 403 });
  }

  const body = await req.json();
  const nama = String(body.nama || "").trim();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!nama || !username || password.length < 4) {
    return NextResponse.json({ error: "Nama, username, dan password minimal 4 karakter wajib diisi." }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .insert({ nama, username, password_hash, role: "petugas" })
    .select("id,nama,username,role,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data });
}
