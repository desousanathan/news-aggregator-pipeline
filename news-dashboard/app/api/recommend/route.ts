import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id    = searchParams.get("id") || "";
  const limit = searchParams.get("limit") || "5";

  if (!id) return NextResponse.json([]);

  try {
    const res = await fetch(`${FASTAPI_URL}/recommend/${id}?limit=${limit}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`FastAPI returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
