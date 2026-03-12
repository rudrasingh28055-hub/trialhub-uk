import { NextResponse } from 'next/server'

const TWELVELABS_API_KEY = process.env.TWELVELABS_API_KEY
const TWELVELABS_INDEX_ID = process.env.TWELVELABS_INDEX_ID
const BASE_URL = 'https://api.twelvelabs.io/v1.3'

export async function POST(request: Request) {
  const { action, videoUrl, videoId } = await request.json()

  console.log('Twelve Labs API call:', { action, hasVideoUrl: !!videoUrl, hasVideoId: !!videoId })

  if (!TWELVELABS_API_KEY || !TWELVELABS_INDEX_ID) {
    console.error('Missing Twelve Labs credentials:', {
      hasApiKey: !!TWELVELABS_API_KEY,
      hasIndexId: !!TWELVELABS_INDEX_ID,
      apiKeyLength: TWELVELABS_API_KEY?.length,
      indexIdLength: TWELVELABS_INDEX_ID?.length
    })
    return NextResponse.json({ error: 'Twelve Labs not configured' })
  }

  console.log('Twelve Labs credentials validated:', {
    apiKeyPrefix: TWELVELABS_API_KEY?.substring(0, 8) + '...',
    indexId: TWELVELABS_INDEX_ID
  })

  // ACTION 1: Upload video for indexing
  if (action === 'index') {
    console.log('Attempting to index URL:', videoUrl)
    
    const formData = new FormData()
    formData.append('index_id', TWELVELABS_INDEX_ID!)
    formData.append('video_url', videoUrl)
    formData.append('language', 'en')

    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'x-api-key': TWELVELABS_API_KEY!
      },
      body: formData
    })

    const responseText = await res.text()
    console.log('Twelve Labs response status:', res.status)
    console.log('Twelve Labs response body:', responseText)

    if (!res.ok) {
      return NextResponse.json({ 
        error: responseText,
        status: res.status
      })
    }

    const data = JSON.parse(responseText)
    return NextResponse.json({ taskId: data._id })
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
