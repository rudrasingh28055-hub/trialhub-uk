import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'live'
  
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ response: [], error: 'No API key' })
  }

  const headers = { 'x-apisports-key': apiKey }

  if (type === 'live') {
    try {
      const res = await fetch(
        'https://v3.football.api-sports.io/fixtures?live=all',
        { headers, cache: 'no-store' }
      )
      const data = await res.json()
      console.log("Live fixtures:", data.response?.length, "errors:", data.errors)

      if (data.response && data.response.length > 0) {
        return NextResponse.json(data)
      }

      // No live matches - fall back to upcoming Premier League
      const fallback = await fetch(
        'https://v3.football.api-sports.io/fixtures?league=39&season=2024&next=3',
        { headers, next: { revalidate: 300 } }
      )
      const fallbackData = await fallback.json()
      return NextResponse.json({ 
        response: fallbackData.response || [],
        fallback: true
      })
    } catch (error) {
      console.error("Live scores error:", error)
      return NextResponse.json({ response: [] })
    }
  }

  if (type === 'upcoming') {
    const LEAGUES = [39, 2, 140, 78, 135, 61]
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]
    const season = new Date().getFullYear()

    let allFixtures: any[] = []

    for (const leagueId of LEAGUES) {
      if (allFixtures.length >= 6) break
      try {
        const res = await fetch(
          `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}&from=${today}&to=${nextWeek}&status=NS`,
          { headers, next: { revalidate: 300 } }
        )
        const data = await res.json()
        console.log(`League ${leagueId}:`, data.response?.length || 0, "fixtures")
        if (data.response?.length > 0) {
          allFixtures = [...allFixtures, ...data.response]
        }
      } catch (e) {
        console.log(`League ${leagueId} failed`)
      }
    }

    allFixtures.sort((a, b) =>
      new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    )

    return NextResponse.json({ response: allFixtures.slice(0, 6) })
  }

  return NextResponse.json({ response: [] })
}
