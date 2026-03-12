import { NextResponse } from 'next/server'

const TWELVELABS_API_KEY = process.env.TWELVELABS_API_KEY
const TWELVELABS_INDEX_ID = process.env.TWELVELABS_INDEX_ID
const BASE_URL = 'https://api.twelvelabs.io/v1.2'

export async function POST(request: Request) {
  const { action, videoUrl, videoId } = await request.json()

  if (!TWELVELABS_API_KEY || !TWELVELABS_INDEX_ID) {
    return NextResponse.json({ error: 'Twelve Labs not configured' })
  }

  // ACTION 1: Upload video for indexing
  if (action === 'index') {
    try {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'x-api-key': TWELVELABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          index_id: TWELVELABS_INDEX_ID,
          url: videoUrl,
          language: 'en'
        })
      })

      const responseText = await res.text()
      console.log('Twelve Labs response status:', res.status)
      console.log('Twelve Labs response body:', responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        return NextResponse.json({ error: 'Invalid response from Twelve Labs' })
      }

      if (!res.ok) {
        return NextResponse.json({ 
          error: data.message || data.error || 'Twelve Labs API error',
          status: res.status
        })
      }

      return NextResponse.json({ taskId: data._id })
    } catch (error) {
      console.error('Index error:', error)
      return NextResponse.json({ error: 'Failed to index video' })
    }
  }

  // ACTION 2: Search for best football moment
  if (action === 'analyze' && videoId) {
    try {
      const searchRes = await fetch(`${BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'x-api-key': TWELVELABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          index_id: TWELVELABS_INDEX_ID,
          query: 'best football moment shot goal skill dribble tackle sprint',
          search_options: ['visual', 'conversation'],
          filter: { id: [videoId] },
          page_limit: 1
        })
      })
      const searchData = await searchRes.json()
      console.log('Twelve Labs search result:', JSON.stringify(searchData).slice(0, 500))

      const bestClip = searchData.data?.[0]
      if (bestClip) {
        return NextResponse.json({
          found: true,
          startTime: bestClip.start,
          endTime: bestClip.end,
          confidence: bestClip.score,
          description: bestClip.metadata?.[0]?.text || 'Best moment detected'
        })
      }
      return NextResponse.json({ found: false })
    } catch (error) {
      console.error('Analyze error:', error)
      return NextResponse.json({ error: 'Failed to analyze video' })
    }
  }

  // ACTION 3: Check task status
  if (action === 'status' && videoId) {
    try {
      const res = await fetch(`${BASE_URL}/tasks/${videoId}`, {
        headers: { 'x-api-key': TWELVELABS_API_KEY }
      })
      const data = await res.json()
      return NextResponse.json({ 
        status: data.status,
        videoId: data.video_id 
      })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to check status' })
    }
  }

  return NextResponse.json({ error: 'Invalid action' })
}
