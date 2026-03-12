import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ articles: [] })
  }
  
  try {
    const queries = [
      'Premier League transfer',
      'La Liga transfer signing',
      'Arsenal Chelsea Liverpool ManCity ManUnited transfer',
      'Real Madrid Barcelona transfer'
    ].join(' OR ')

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(queries)}&sortBy=publishedAt&language=en&pageSize=10&apiKey=${apiKey}` 

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
        text.includes('transfer') ||
        text.includes('arsenal') ||
        text.includes('chelsea') ||
        text.includes('liverpool') ||
        text.includes('manchester') ||
        text.includes('real madrid') ||
        text.includes('barcelona') ||
        text.includes('atletico') ||
        text.includes('tottenham') ||
        text.includes('signing') ||
        text.includes('loan move') ||
        text.includes('contract')
      
      const isOtherSport = 
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
