import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envVars = {
      hasTokenId: !!process.env.MUX_TOKEN_ID,
      hasTokenSecret: !!process.env.MUX_TOKEN_SECRET,
      tokenIdLength: process.env.MUX_TOKEN_ID?.length,
      tokenSecretLength: process.env.MUX_TOKEN_SECRET?.length,
      tokenIdPrefix: process.env.MUX_TOKEN_ID?.substring(0, 8) + '...',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    }

    // Test Mux connection
    let muxTest = 'Not attempted'
    try {
      const Mux = require('@mux/mux-node')
      const mux = new Mux({
        tokenId: process.env.MUX_TOKEN_ID!,
        tokenSecret: process.env.MUX_TOKEN_SECRET!
      })
      
      // Simple test - try to list uploads (should work even if empty)
      const uploads = await mux.video.uploads.list({ limit: 1 })
      muxTest = 'Success - Mux connection working'
    } catch (muxError) {
      muxTest = `Failed: ${muxError instanceof Error ? muxError.message : String(muxError)}`
    }

    return NextResponse.json({
      environment: envVars,
      muxConnection: muxTest,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
