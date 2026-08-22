import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { searchDrugCatalog } from '@/lib/drug-apis'

export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''

  if (!query.trim()) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await searchDrugCatalog(query)
    return NextResponse.json({ results })
  } catch (error) {
    console.error('GET /api/drugs/search error:', error)
    return NextResponse.json(
      { error: 'Failed to search medicines', results: [] },
      { status: 500 }
    )
  }
}
