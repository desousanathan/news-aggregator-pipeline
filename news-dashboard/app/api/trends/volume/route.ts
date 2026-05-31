import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hours = searchParams.get("hours") || "24";
  const bucket_hours = searchParams.get("bucket_hours") || "1";
  const res = await fetch(`${FASTAPI_URL}/trends/volume?hours=${hours}&bucket_hours=${bucket_hours}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`FastAPI returned ${res.status}`);
  const data = await res.json();
  return NextResponse.json(data);
}
