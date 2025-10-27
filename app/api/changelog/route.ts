
import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({
    releases:[
      { versionId:'v2025-10-16-02', note:'Add ortho codes v0.2', date:'2025-10-16' },
      { versionId:'v2025-10-01-01', note:'Initial WISeR seed', date:'2025-10-01' }
    ]
  })
}
