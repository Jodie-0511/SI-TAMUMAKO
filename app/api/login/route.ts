import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!username || !password) {
    return NextResponse.json({ error: "Username dan password wajib diisi." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("id,nama,username,password_hash,role,created_at")
    .eq("username", username)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, data.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
  }

  await setSessionCookie({
    id: data.id,
    nama: data.nama,
    username: data.username,
    role: data.role
  });

  return NextResponse.json({
    user: {
      id: data.id,
      nama: data.nama,
      username: data.username,
      role: data.role,
      created_at: data.created_at
    }
  });
}
