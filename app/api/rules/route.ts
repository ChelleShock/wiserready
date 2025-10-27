import { NextRequest, NextResponse } from "next/server";
import { loadGrouped } from "@/lib/rulesLoader";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cpt = (searchParams.get("cpt") || "").trim();
  const state = (searchParams.get("state") || "").trim().toUpperCase();

  let data;
  try {
    data = await loadGrouped();
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }

  // Filter by CPT
  let items = cpt ? data.filter(d => d.cpt === cpt) : data;

  // Filter by state (if provided)
  if (state) {
    items = items
      .map(d => ({
        ...d,
        articles: d.articles.filter(a => a.state.toUpperCase() === state),
      }))
      .filter(d => d.articles.length > 0);
  }

  return NextResponse.json({ items, count: items.length });
}
