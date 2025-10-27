import { NextResponse } from "next/server";
import { invalidateRulesCache } from "@/lib/rulesLoader";

export async function POST() {
  invalidateRulesCache();
  return NextResponse.json({ ok: true });
}
