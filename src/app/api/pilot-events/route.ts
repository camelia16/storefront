import { NextResponse } from 'next/server'

// Server-side proxy to Pilot's ingest API (POST /api/events). Keeps
// PILOT_INGEST_KEY out of the browser — client code
// (src/lib/pilot-experiments.ts) calls this same-origin route instead of
// Pilot directly, and only this server-side route ever holds the real key.
//
// Required env vars (server-side only, never NEXT_PUBLIC_):
//   PILOT_INGEST_KEY  — from this workspace's Settings > Integrations in Pilot
//   PILOT_API_URL     — defaults to Pilot's hosted API if unset
const PILOT_API_URL = process.env.PILOT_API_URL ?? 'https://pilot-app.up.railway.app'

export async function POST(req: Request) {
  const ingestKey = process.env.PILOT_INGEST_KEY
  if (!ingestKey) {
    return NextResponse.json({ error: 'PILOT_INGEST_KEY is not configured' }, { status: 500 })
  }

  const body = await req.json()
  const { experimentKey, variant, userId, anonymousId, eventName, type, properties } = body

  const res = await fetch(`${PILOT_API_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-pilot-ingest-key': ingestKey },
    body: JSON.stringify({ flagKey: experimentKey, variant, userId, anonymousId, eventName, type, properties }),
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
