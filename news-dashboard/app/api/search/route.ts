import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q     = searchParams.get("q") || "";
  const limit = searchParams.get("limit") || "10";

  if (!q.trim()) return NextResponse.json([]);

  try {
    const res = await fetch(`${FASTAPI_URL}/search?q=${encodeURIComponent(q)}&limit=${limit}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`FastAPI returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Semantic search unavailable — is FastAPI running?" }, { status: 503 });
  }
}
