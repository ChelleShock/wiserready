
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=> ({}))
  // Demo only: pretend to email or generate PDF
  const mode = body?.destination === 'pdf' ? 'pdf' : 'email'
  return NextResponse.json({
    status: mode === 'pdf' ? 'pdf-ready' : 'sent',
    // In a real app, return a signed URL to a generated file.
    pdfUrl: mode === 'pdf' ? '/demo/checklist.pdf' : undefined
  })
}
