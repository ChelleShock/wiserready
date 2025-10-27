
import { NextRequest, NextResponse } from 'next/server'

let SAVED: any[] = []

export async function GET() {
  return NextResponse.json({ items: SAVED })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  const id = `case_${Math.random().toString(36).slice(2,8)}`
  SAVED.push({ id, ...body, createdAt: new Date().toISOString() })
  return NextResponse.json({ id })
}
