# Debut — Claude Code Instructions

## Project
- **App name:** Debut (debut.football)
- **Dev command:** `npm run dev`

## Stack
- Next.js 16, React, TypeScript
- Tailwind CSS, Framer Motion
- Supabase (auth + database)

## Design System
- **Background:** obsidian `#0B0B0F`
- **Accent:** violet `#7C3AED` — use sparingly, CTAs only
- **Fonts:** Satoshi 900 for headings, Inter for body
- **Glass cards:** `background: rgba(255,255,255,0.04)`

## DO NOT MODIFY
- `app/api/**` — all API routes
- `lib/feed/actions.ts`
- `lib/feed/types.ts`
- `hooks/**`
- `supabase/migrations/**`
- `onTimeUpdate` handler in `FeedVideo.tsx`

## Current Priority
Fix Mux video upload failing with "Mux operation failed" error.
- Check `app/api/mux/upload/route.ts`
- Check `components/MuxVideoUploader.tsx`
