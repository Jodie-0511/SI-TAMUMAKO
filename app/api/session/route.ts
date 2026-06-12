import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const user = await getSessionUser();
  const { count, error } = await supabaseAdmin
    .from("app_users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    user,
    hasAdmin: Boolean(count && count > 0)
  });
}
