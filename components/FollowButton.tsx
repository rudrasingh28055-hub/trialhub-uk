"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function FollowButton({ currentProfileId, targetProfileId, targetAccountVisibility }: {
  currentProfileId: string,
  targetProfileId: string,
  targetAccountVisibility?: string
}) {
  const [status, setStatus] = useState<'none' | 'pending' | 'approved'>('none')
  const supabase = createClient()

  useEffect(() => {
    // Check existing follow status
    supabase.from('follow_edges')
      .select('status')
      .eq('follower_id', currentProfileId)
      .eq('followed_id', targetProfileId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setStatus(data.status as any)
      })
  }, [currentProfileId, targetProfileId])

  async function handleFollow() {
    if (status === 'approved') {
      // Unfollow
      await supabase.from('follow_edges').delete()
        .eq('follower_id', currentProfileId).eq('followed_id', targetProfileId)
      setStatus('none')
    } else if (status === 'none') {
      const newStatus = targetAccountVisibility === 'private' ? 'pending' : 'approved'
      await supabase.from('follow_edges').insert({
        follower_id: currentProfileId, followed_id: targetProfileId, status: newStatus
      })
      setStatus(newStatus)
    }
  }

  const label = status === 'approved' ? 'Following' : status === 'pending' ? 'Requested' : 'Follow'
  const bgColor = status === 'none' ? '#7C3AED' : 'transparent'
  const border = status !== 'none' ? '1px solid rgba(255,255,255,0.2)' : 'none'

  return (
    <button onClick={handleFollow} style={{
      backgroundColor: bgColor, color: 'white', border,
      padding: '8px 20px', borderRadius: '8px', fontSize: '14px',
      fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
    }}>
      {label}
    </button>
  )
}
