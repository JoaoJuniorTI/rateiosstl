import { NextResponse, type NextRequest } from "next/server";
import { supabaseAuth } from "@/lib/supabase";

// O Google devolve o usuário para cá depois do login.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await supabaseAuth();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/admin`);
  }
  return NextResponse.redirect(`${origin}/admin?erro=login`);
}
