import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";



export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "10");

  // Try FastAPI first, fall back to mock data

    const params = new URLSearchParams({ limit: String(limit) });
    if (category && category !== "All") params.set("category", category);
    const res = await fetch(`${FASTAPI_URL}/news?${params}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`FastAPI returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  
}
