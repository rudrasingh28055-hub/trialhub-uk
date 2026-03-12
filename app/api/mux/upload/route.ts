import Mux from '@mux/mux-node'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const tokenId = process.env.MUX_TOKEN_ID
    const tokenSecret = process.env.MUX_TOKEN_SECRET
    
    console.log('MUX_TOKEN_ID exists:', !!tokenId)
    console.log('MUX_TOKEN_SECRET exists:', !!tokenSecret)
    console.log('MUX_TOKEN_ID prefix:', tokenId?.slice(0, 8))
    
    if (!tokenId || !tokenSecret) {
      return NextResponse.json({ 
        error: 'Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET in .env.local' 
      })
    }

    const mux = new Mux({
      tokenId,
      tokenSecret
    })

    const { action, uploadId, assetId } = await request.json()
    console.log('Mux action:', action)

    if (action === 'create-upload') {
      try {
        const upload = await mux.video.uploads.create({
          new_asset_settings: {
            playback_policy: ['public'],
            encoding_tier: 'baseline',
            mp4_support: 'capped-1080p'
          },
          cors_origin: '*'
        })
        
        console.log('Mux upload created:', upload.id)
        return NextResponse.json({
          uploadId: upload.id,
          uploadUrl: upload.url
        })
      } catch (muxError: any) {
        console.error('Mux create upload error:', muxError?.message || muxError)
        console.error('Mux error details:', JSON.stringify(muxError))
        return NextResponse.json({ 
          error: muxError?.message || 'Failed to create Mux upload' 
        })
      }
    }

    if (action === 'check-status' && uploadId) {
      try {
        const upload = await mux.video.uploads.retrieve(uploadId)
        console.log('Upload status:', upload.status, 'Asset ID:', upload.asset_id)
        
        if (upload.asset_id) {
          const asset = await mux.video.assets.retrieve(upload.asset_id)
          const playbackId = asset.playback_ids?.[0]?.id
          console.log('Asset status:', asset.status, 'Playback ID:', playbackId)
          
          return NextResponse.json({
            status: asset.status,
            assetId: asset.id,
            playbackId,
            playbackUrl: playbackId 
              ? `https://stream.mux.com/${playbackId}.m3u8` 
              : null,
            thumbnailUrl: playbackId
              ? `https://image.mux.com/${playbackId}/thumbnail.jpg` 
              : null
          })
        }
        return NextResponse.json({ status: upload.status })
      } catch (muxError: any) {
        console.error('Mux status check error:', muxError?.message)
        return NextResponse.json({ error: muxError?.message })
      }
    }

    // Enable capped-1080p MP4 on an existing asset (for TwelveLabs compatibility)
    if (action === 'ensure-mp4' && assetId) {
      try {
        const credentials = Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64')
        await fetch(`https://api.mux.com/video/v1/assets/${assetId}/mp4-support`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ standard: 'capped-1080p' })
        })
        return NextResponse.json({ ok: true })
      } catch (muxError: any) {
        return NextResponse.json({ error: muxError?.message })
      }
    }

    // Check whether static renditions (MP4) are ready on an asset
    if (action === 'mp4-status' && assetId) {
      try {
        const asset = await mux.video.assets.retrieve(assetId)
        return NextResponse.json({
          mp4Status: (asset as any).static_renditions?.status ?? 'disabled'
        })
      } catch (muxError: any) {
        return NextResponse.json({ error: muxError?.message })
      }
    }

    return NextResponse.json({ error: 'Invalid action' })
  } catch (error: any) {
    console.error('Mux route error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Mux operation failed' })
  }
}
