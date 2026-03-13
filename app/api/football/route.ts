import { NextResponse } from 'next/server'

const ESPN_LEAGUES = [
  'eng.1',        // Premier League
  'esp.1',        // La Liga
  'ger.1',        // Bundesliga
  'ita.1',        // Serie A
  'fra.1',        // Ligue 1
  'uefa.champions' // Champions League
]

// Transform ESPN event into the football-api-sports shape HomeClient expects
function espnToFixture(event: any, leagueName: string, leagueLogo: string) {
  const comp = event.competitions?.[0] ?? {}
  const home = comp.competitors?.find((c: any) => c.homeAway === 'home')
  const away = comp.competitors?.find((c: any) => c.homeAway === 'away')
  const statusName: string = event.status?.type?.name ?? ''
  const isLive = statusName === 'STATUS_IN_PROGRESS' || statusName === 'STATUS_HALFTIME'
  const isFinal =
    statusName === 'STATUS_FINAL' ||
    statusName === 'STATUS_FULL_TIME' ||
    statusName === 'STATUS_FINAL_AET' ||
    statusName === 'STATUS_FINAL_PEN'

  return {
    fixture: {
      id: parseInt(event.id, 10),
      date: event.date,
      status: {
        elapsed: isLive ? parseInt(event.status?.displayClock ?? '0') : null,
        short: isLive ? '1H' : isFinal ? 'FT' : 'NS'
      }
    },
    teams: {
      home: { name: home?.team?.displayName ?? '', logo: home?.team?.logo ?? '' },
      away: { name: away?.team?.displayName ?? '', logo: away?.team?.logo ?? '' }
    },
    goals: {
      home: !isFinal && !isLive ? null : parseInt(home?.score ?? '0', 10),
      away: !isFinal && !isLive ? null : parseInt(away?.score ?? '0', 10)
    },
    league: { name: leagueName, logo: leagueLogo }
  }
}

async function fetchLeague(slug: string) {
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard`,
    { next: { revalidate: 60 } }
  )
  return res.json()
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'live'

  try {
    const results = await Promise.allSettled(ESPN_LEAGUES.map(fetchLeague))

    const allFixtures: any[] = []
    for (const result of results) {
      if (result.status !== 'fulfilled') continue
      const data = result.value
      const leagueName: string = data.leagues?.[0]?.name ?? ''
      const leagueLogo: string = data.leagues?.[0]?.logos?.[0]?.href ?? ''
      for (const event of data.events ?? []) {
        allFixtures.push(espnToFixture(event, leagueName, leagueLogo))
      }
    }

    if (type === 'live') {
      const live = allFixtures.filter(f => f.fixture.status.short === '1H')
      if (live.length > 0) return NextResponse.json({ response: live })

      // No live matches — show today's finished results with real scores
      const todayStart = new Date()
      todayStart.setUTCHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setUTCHours(23, 59, 59, 999)

      const todayResults = allFixtures
        .filter(f => {
          if (f.fixture.status.short !== 'FT') return false
          const d = new Date(f.fixture.date)
          return d >= todayStart && d <= todayEnd
        })
        .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())

      if (todayResults.length > 0) {
        return NextResponse.json({ response: todayResults, resultsOnly: true })
      }

      // Nothing today — return empty so client shows "no matches" state
      return NextResponse.json({ response: [], fallback: true })
    }

    if (type === 'upcoming') {
      const upcoming = allFixtures
        .filter(f => f.fixture.status.short === 'NS')
        .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
        .slice(0, 6)
      return NextResponse.json({ response: upcoming })
    }
  } catch (error) {
    console.error('Football API error:', error)
  }

  return NextResponse.json({ response: [] })
}
