
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=> ({}))
  // In a real app, store to DB. Here we just echo for demo.
  return NextResponse.json({ status: 'recorded', received: body })
}
