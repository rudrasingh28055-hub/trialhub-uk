import { NextResponse } from 'next/server'

const TWELVELABS_API_KEY = process.env.TWELVELABS_API_KEY
const TWELVELABS_INDEX_ID = process.env.TWELVELABS_INDEX_ID
const BASE_URL = 'https://api.twelvelabs.io/v1.3'

export async function GET() {
  try {
    const envVars = {
      hasApiKey: !!TWELVELABS_API_KEY,
      hasIndexId: !!TWELVELABS_INDEX_ID,
      apiKeyLength: TWELVELABS_API_KEY?.length,
      indexIdLength: TWELVELABS_INDEX_ID?.length,
      apiKeyPrefix: TWELVELABS_API_KEY?.substring(0, 8) + '...',
      indexId: TWELVELABS_INDEX_ID
    }

    // Test Twelve Labs connection
    let connectionTest = 'Not attempted'
    try {
      const response = await fetch(`${BASE_URL}/indexes`, {
        headers: { 'x-api-key': TWELVELABS_API_KEY! }
      })
      
      if (response.ok) {
        const data = await response.json()
        connectionTest = `Success - Found ${data.data?.length || 0} indexes`
      } else {
        const errorText = await response.text()
        connectionTest = `Failed (${response.status}): ${errorText.substring(0, 200)}`
      }
    } catch (error) {
      connectionTest = `Failed: ${error instanceof Error ? error.message : String(error)}`
    }

    return NextResponse.json({
      environment: envVars,
      connection: connectionTest,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
