import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q     = searchParams.get("q") || "";
  const limit = searchParams.get("limit") || "5";

  if (!q.trim()) return NextResponse.json({ error: "No question provided" }, { status: 400 });

  try {
    const res = await fetch(`${FASTAPI_URL}/chat?q=${encodeURIComponent(q)}&limit=${limit}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`FastAPI returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Chat unavailable — is FastAPI running?" }, { status: 503 });
  }
}
