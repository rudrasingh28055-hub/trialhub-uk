import { NextResponse } from 'next/server'

export const STANDINGS_LEAGUES: Record<string, string> = {
  'eng.1': 'Premier League',
  'esp.1': 'La Liga',
  'ger.1': 'Bundesliga',
  'ita.1': 'Serie A',
  'fra.1': 'Ligue 1',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const league = searchParams.get('league') || 'eng.1'

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/v2/sports/soccer/${league}/standings`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()
    const entries: any[] = data.children?.[0]?.standings?.entries ?? []

    const standings = entries
      .map((entry: any) => {
        const stats: Record<string, any> = {}
        for (const s of entry.stats ?? []) {
          stats[s.name] = s.value ?? s.displayValue
        }
        const team = entry.team ?? {}
        return {
          pos:  Math.round(Number(stats.rank ?? 0)),
          team: {
            name:      team.displayName ?? '',
            shortName: team.abbreviation ?? '',
            logo:      team.logos?.[0]?.href ?? '',
          },
          mp:  Math.round(Number(stats.gamesPlayed ?? 0)),
          w:   Math.round(Number(stats.wins ?? 0)),
          d:   Math.round(Number(stats.ties ?? 0)),
          l:   Math.round(Number(stats.losses ?? 0)),
          gd:  Math.round(Number(stats.pointDifferential ?? 0)),
          pts: Math.round(Number(stats.points ?? 0)),
        }
      })
      .sort((a, b) => a.pos - b.pos)

    return NextResponse.json({ standings })
  } catch (error) {
    return NextResponse.json({ standings: [] })
  }
}
