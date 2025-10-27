import { NextRequest, NextResponse } from "next/server";
import { loadGrouped } from "@/lib/rulesLoader";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cpt = (searchParams.get("cpt") || "").trim();
  const keyword = (searchParams.get("keyword") || "").trim().toLowerCase();
  const state = (searchParams.get("state") || "TX").trim().toUpperCase();

  let grouped;
  try {
    grouped = await loadGrouped();
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }

  // 1) Exact CPT match (preferred)
  let rec = cpt ? grouped.find(g => g.cpt === cpt) : undefined;

  // 2) Keyword fallback (very light-weight — article title search)
  if (!rec && keyword) {
    rec = grouped.find(g =>
      g.articles.some(a => a.article_title.toLowerCase().includes(keyword))
    );
  }

  if (!rec) {
    // naive suggestions: nearby items
    const suggestions = grouped.slice(0, 5).map(g => ({ cpt: g.cpt, description: g.articles[0]?.article_title || "" }));
    return NextResponse.json({
      query: { cpt: cpt || undefined, keyword: keyword || undefined, state },
      matchQuality: "NONE",
      suggestions,
      disclaimers: ["No WISeR match in current dataset. Verify with your MAC/CMS."]
    }, { status: 404 });
  }

  // Filter articles by state for display
  const stateArticles = rec.articles.filter(a => a.state.toUpperCase() === state);
  const anyArticles = stateArticles.length ? stateArticles : rec.articles;

  // Lift a human-ish description from the first article title
  const description = (anyArticles[0]?.article_title || `CPT/HCPCS ${rec.cpt}`)
    .replace(/^Billing\s*&\s*Coding:\s*/i, "")
    .trim();

  // Map your grouped shape into the UI "Rule" shape
  const rule = {
    id: `${rec.cpt}-WISeR`,
    cpt: rec.cpt,
    description,
    requiresPA: rec.requires_pa ? "YES" : "NO", // if you add CONDITIONAL later, handle here
    program: rec.programs[0] || "WISeR",
    states: Array.from(new Set(rec.articles.map(a => a.state))),
    effectiveDate: "2026-01-01",
    documentation: [
      { id: "dx-notes",     label: "Physician notes supporting medical necessity", required: true },
      { id: "conservative", label: "Conservative therapy documented (if applicable)", required: true },
      { id: "imaging",      label: "Relevant imaging / diagnostics attached", required: true },
    ],
    references: anyArticles.map(a => ({
      title: a.article_title,
      url: a.cms_article_url
    })),
    lastUpdated: anyArticles[0]?.last_updated || ""
  };

  return NextResponse.json({
    query: { cpt: cpt || undefined, keyword: keyword || undefined, state },
    matchQuality: cpt ? "EXACT" : "FUZZY",
    rule,
    disclaimers: ["Informational tool only. Verify with your MAC and current CMS publications."]
  });
}