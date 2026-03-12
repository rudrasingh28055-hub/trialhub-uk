import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ articles: [] })
  }
  
  try {
    const url = `https://newsapi.org/v2/everything?q=football+transfer+OR+Premier+League+OR+Champions+League&sortBy=publishedAt&language=en&pageSize=20&apiKey=${apiKey}`

    const res = await fetch(url)
    const data = await res.json()

    const filtered = data.articles?.filter((article: any) => {
      const text = (
        (article.title || '') + 
        (article.description || '')
      ).toLowerCase()
      
      const isFootball =
        text.includes('premier league') ||
        text.includes('la liga') ||
        text.includes('bundesliga') ||
        text.includes('serie a') ||
        text.includes('ligue 1') ||
        text.includes('champions league') ||
        text.includes('transfer') ||
        text.includes('arsenal') ||
        text.includes('chelsea') ||
        text.includes('liverpool') ||
        text.includes('manchester') ||
        text.includes('real madrid') ||
        text.includes('barcelona') ||
        text.includes('atletico') ||
        text.includes('tottenham') ||
        text.includes('juventus') ||
        text.includes('ac milan') ||
        text.includes('inter milan') ||
        text.includes('psg') ||
        text.includes('signing') ||
        text.includes('loan move') ||
        text.includes('contract') ||
        text.includes('footballer') ||
        text.includes(' fc ') ||
        text.includes('match') ||
        text.includes('goal') ||
        text.includes('manager') ||
        text.includes('sacked') ||
        text.includes('appointed')
      
      const isOtherSport =
        text.includes('football manager') ||
        text.includes('fm26') ||
        text.includes('fm25') ||
        text.includes('fmscout') ||
        text.includes('nba') ||
        text.includes('nfl') ||
        text.includes('nhl') ||
        text.includes('mlb') ||
        text.includes('basketball') ||
        text.includes('baseball') ||
        text.includes('american football') ||
        text.includes('tennis') ||
        text.includes('golf') ||
        text.includes('cricket') ||
        text.includes('rugby') ||
        text.includes('wbc') ||
        text.includes('ravens') ||
        text.includes('lakers') ||
        text.includes('knicks')
      
      return isFootball && !isOtherSport
    }) || []

    const sorted = filtered
      .sort((a: any, b: any) => 
        new Date(b.publishedAt).getTime() - 
        new Date(a.publishedAt).getTime()
      )
      .slice(0, 4)

    if (sorted.length === 0) {
      return NextResponse.json({ 
        articles: [
          {
            title: "Premier League clubs monitoring transfer window targets",
            source: { name: "Transfer News" },
            publishedAt: new Date().toISOString(),
            url: "https://premierleague.com"
          },
          {
            title: "La Liga: Real Madrid and Barcelona eye summer signings",
            source: { name: "Transfer News" },
            publishedAt: new Date().toISOString(),
            url: "https://laliga.com"
          }
        ]
      })
    }

    return NextResponse.json({ articles: sorted })
  } catch (error) {
    console.error('News API error:', error)
    return NextResponse.json({ articles: [] })
  }
}
