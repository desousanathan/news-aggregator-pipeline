import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const n = searchParams.get("n_clusters") || "8";

  try {
    const res = await fetch(`${FASTAPI_URL}/clusters?n_clusters=${n}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`FastAPI returned ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Clustering unavailable — is FastAPI running?" }, { status: 503 });
  }
}
