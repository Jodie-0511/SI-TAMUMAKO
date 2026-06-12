import { NextResponse } from "next/server";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Hanya administrator yang dapat menghapus petugas." }, { status: 403 });
  }

  const { id } = await params;

  if (id === session?.id) {
    return NextResponse.json({ error: "Akun yang sedang login tidak dapat dihapus." }, { status: 400 });
  }

  const { data: target, error: targetError } = await supabaseAdmin
    .from("app_users")
    .select("id,role")
    .eq("id", id)
    .single();

  if (targetError || !target) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });

  if (target.role === "admin") {
    return NextResponse.json({ error: "Administrator utama tidak dapat dihapus." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("app_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
