import Mux from '@mux/mux-node'
import { NextResponse } from 'next/server'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
})

export async function POST() {
  try {
    console.log('Testing Mux upload creation...')
    
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        encoding_tier: 'baseline',
        mp4_support: 'none'  // Fixed: changed from 'standard' to 'none'
      },
      cors_origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    })
    
    console.log('Mux upload created successfully:', {
      uploadId: upload.id,
      hasUrl: !!upload.url,
      urlPrefix: upload.url?.substring(0, 50) + '...'
    })
    
    return NextResponse.json({
      success: true,
      uploadId: upload.id,
      uploadUrl: upload.url
    })
    
  } catch (error) {
    console.error('Mux test failed:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      envVars: {
        hasTokenId: !!process.env.MUX_TOKEN_ID,
        hasTokenSecret: !!process.env.MUX_TOKEN_SECRET,
        tokenIdLength: process.env.MUX_TOKEN_ID?.length
      }
    })
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
