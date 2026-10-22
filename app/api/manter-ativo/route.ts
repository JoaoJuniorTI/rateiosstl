import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Chamado 1x por dia pela Vercel (vercel.json) para o Supabase grátis não pausar o projeto.
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const { count, error } = await supabaseAdmin().from("stls").select("id", { count: "exact", head: true });
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, stls: count });
}
