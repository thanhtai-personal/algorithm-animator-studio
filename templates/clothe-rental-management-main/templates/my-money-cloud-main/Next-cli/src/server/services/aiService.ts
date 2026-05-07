import { NextRequest, NextResponse } from "next/server";
import { parseTransactionServer } from "@/lib/voice/transactionParser";
import { getServerClient } from "@/server/data-access/ai";
import { CategoryRow } from "@/features/categories/types";

export async function handleAiParse(request: NextRequest) {
  try {
    const supabase = getServerClient();
    const { transcript, language = "vi-VN" } = await request.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "Missing or invalid transcript" }, { status: 400 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let remainingRequests: number | null = null;
    try {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("ai_requests_remaining")
        .eq("user_id", user.id)
        .single();
      if (typeof settings?.ai_requests_remaining === "number") {
        remainingRequests = settings.ai_requests_remaining;
      }
    } catch {
      // Ignore settings read failures; don't block AI parsing.
    }


    // Lấy danh sách categories từ database
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, icon, color, user_id, created_at, anon_key")
      .or(`user_id.is.null,user_id.eq.${user.id}`);
    if (categoriesError || !categoriesData) {
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }

    let parsed = parseTransactionServer(transcript, categoriesData, language);
    let usedAI = false;

    if (parsed.amount === 0) {
      // Placeholder for future AI integration
      usedAI = false;
    }

    let newRemaining: number | null = null;
    if (typeof remainingRequests === "number") {
      newRemaining = Math.max(0, remainingRequests - 1);
      const { error: updateError } = await supabase
        .from("user_settings")
        .update({ ai_requests_remaining: newRemaining })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("[AI Parse] Failed to decrement request count:", updateError);
      }
    }

    return NextResponse.json({
      amount: parsed.amount,
      note: parsed.note,
      description: parsed.note,
      type: parsed.type,
      categoryId: parsed.category,
      category: parsed.category,
      usedAI,
      remaining: newRemaining,
    });
  } catch (error) {
    console.error("Error parsing transaction:", error);
    const message = error instanceof Error ? error.message : "Failed to parse transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
