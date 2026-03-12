'use client'
import { useState, useRef } from 'react'

interface Props {
  onUploadComplete: (data: {
    playbackId: string
    assetId: string
    playbackUrl: string
    thumbnailUrl: string
  }) => void
  onProgress?: (progress: number) => void
}

export default function MuxVideoUploader({ onUploadComplete, onProgress }: Props) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return
    setUploading(true)
    setError('')
    setStatus('Preparing upload...')

    try {
      // Get Mux upload URL
      const res = await fetch('/api/mux/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-upload' })
      })
      const { uploadId, uploadUrl, error } = await res.json()
      
      if (error || !uploadUrl) {
        console.warn('Failed to get upload URL:', error)
        setError(error || 'Failed to prepare upload. Please try again.')
        setUploading(false)
        return
      }

      setStatus('Uploading video...')

      // Upload directly to Mux
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100)
            setProgress(pct)
            onProgress?.(pct)
          }
        })
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Upload failed: ${xhr.status}`))
        })
        xhr.addEventListener('error', reject)
        xhr.open('PUT', uploadUrl)
        xhr.send(file)
      })

      setStatus('Processing video...')
      setProgress(100)

      // Poll for processing completion
      let attempts = 0
      let playbackData = null
      
      while (!playbackData && attempts < 30) {
        await new Promise(r => setTimeout(r, 3000))
        
        const statusRes = await fetch('/api/mux/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check-status', uploadId })
        })
        const statusData = await statusRes.json()
        console.log('Mux status:', statusData.status)
        
        if (statusData.status === 'ready' && statusData.playbackId) {
          playbackData = statusData
        }
        attempts++
      }

      if (playbackData) {
        setStatus('Ready!')
        onUploadComplete(playbackData)
      } else {
        setStatus('Processing taking longer than expected...')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    }
    
    setUploading(false)
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
        }}
      />

      {error && (
        <div style={{
          marginBottom: 12,
          padding: '10px 14px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10,
          color: '#f87171',
          fontSize: 13
        }}>
          {error}
        </div>
      )}

      {!uploading ? (
        <button
          onClick={() => { setError(''); fileRef.current?.click() }}
          style={{
            width: '100%',
            padding: '48px 24px',
            background: 'rgba(255,255,255,0.04)',
            border: '2px dashed rgba(255,255,255,0.15)',
            borderRadius: '16px',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            textAlign: 'center',
            fontSize: '15px'
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎥</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            Tap to select your highlight
          </div>
          <div style={{ fontSize: 12, opacity: 0.5 }}>
            MP4, MOV, AVI — any size
          </div>
        </button>
      ) : (
        <div style={{
          padding: '32px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: 14, 
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 16,
            fontWeight: 600
          }}>
            {status}
          </div>
          <div style={{
            height: 4,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 999,
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #7C3AED, #2563EB)',
              borderRadius: 999,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ 
            fontSize: 12, 
            color: 'rgba(255,255,255,0.4)',
            marginTop: 8 
          }}>
            {progress}%
          </div>
        </div>
      )}
    </div>
  )
}
