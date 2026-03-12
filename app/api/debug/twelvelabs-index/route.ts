import { NextResponse } from 'next/server'

const TWELVELABS_API_KEY = process.env.TWELVELABS_API_KEY
const TWELVELABS_INDEX_ID = process.env.TWELVELABS_INDEX_ID
const BASE_URL = 'https://api.twelvelabs.io/v1.3'

export async function GET() {
  try {
    if (!TWELVELABS_API_KEY || !TWELVELABS_INDEX_ID) {
      return NextResponse.json({ error: 'Missing credentials' })
    }

    // Get index details
    const response = await fetch(`${BASE_URL}/indexes/${TWELVELABS_INDEX_ID}`, {
      headers: { 'x-api-key': TWELVELABS_API_KEY }
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ 
        error: 'Failed to get index details',
        status: response.status,
        details: errorText
      })
    }

    const indexData = await response.json()
    
    return NextResponse.json({
      indexId: TWELVELABS_INDEX_ID,
      engine: indexData.engine,
      engineOptions: indexData.engine_options,
      createdAt: indexData.created_at,
      updatedAt: indexData.updated_at,
      totalDuration: indexData.total_duration,
      videoCount: indexData.video_count,
      isEngineCorrect: indexData.engine?.includes('marengo-2.6'),
      hasVisualEnabled: indexData.engine_options?.includes('visual')
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
