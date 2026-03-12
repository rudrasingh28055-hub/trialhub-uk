import Mux from '@mux/mux-node'
import { NextResponse } from 'next/server'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
})

export async function POST(request: Request) {
  try {
    const { action, uploadId, assetId } = await request.json()

    // ACTION: Create a direct upload URL
    if (action === 'create-upload') {
      const upload = await mux.video.uploads.create({
        new_asset_settings: {
          playback_policy: ['public'],
          encoding_tier: 'baseline',
          mp4_support: 'standard'
        },
        cors_origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      })
      
      return NextResponse.json({
        uploadId: upload.id,
        uploadUrl: upload.url
      })
    }

    // ACTION: Check upload status and get playback ID
    if (action === 'check-status' && uploadId) {
      const upload = await mux.video.uploads.retrieve(uploadId)
      
      if (upload.asset_id) {
        const asset = await mux.video.assets.retrieve(upload.asset_id)
        const playbackId = asset.playback_ids?.[0]?.id
        
        return NextResponse.json({
          status: asset.status,
          assetId: asset.id,
          playbackId: playbackId,
          playbackUrl: playbackId 
            ? `https://stream.mux.com/${playbackId}.m3u8` 
            : null,
          thumbnailUrl: playbackId
            ? `https://image.mux.com/${playbackId}/thumbnail.jpg` 
            : null
        })
      }
      
      return NextResponse.json({ status: upload.status })
    }

    return NextResponse.json({ error: 'Invalid action' })
  } catch (error) {
    console.error('Mux error:', error)
    return NextResponse.json({ error: 'Mux operation failed' })
  }
}
