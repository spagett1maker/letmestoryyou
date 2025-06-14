import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const { secret_key } = await req.json();

  if (!secret_key) {
    return NextResponse.json({ error: "Secret key missing" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("answers")
    .select("answer_text, encrypted_answer, sentiment, created_at, question_id")
    .eq("secret_key", secret_key)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Answer not found" }, { status: 404 });
  }

  // 하루 지났는지 확인
  const expired = Date.now() - new Date(data.created_at).getTime() > 24 * 60 * 60 * 1000;

  if (expired) {
    return NextResponse.json({ expired: true, message: "답변이 만료되었습니다." }, { status: 403 });
  }

  return NextResponse.json({ ...data, expired: false });
}
