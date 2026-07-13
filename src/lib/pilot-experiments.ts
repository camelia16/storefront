// Pilot-managed variant assignment and event tracking.
// Generated once by Pilot (https://pilot-app.up.railway.app) — every experiment's
// call sites import from here. No third-party feature-flag or analytics
// platform required: assignment is computed locally and deterministically,
// and events are sent through this app's own /api/pilot-events proxy (see
// src/app/api/pilot-events/route.ts), which forwards them to Pilot.
//
// Do not hand-edit the assignment logic — every experiment depends on it
// producing the same bucket for the same user every time it's called.

function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export type Variant = 'control' | 'treatment'

// Deterministic: the same experimentKey + userId always returns the same
// variant, computed locally with no network call and no stored assignment
// record. Raising rolloutPercentage later only moves the boundary — it never
// reshuffles users already assigned to one side of it.
export function assignVariant(experimentKey: string, userId: string, rolloutPercentage: number): Variant {
  const bucket = fnv1aHash(`${experimentKey}:${userId}`) % 100
  return bucket < rolloutPercentage ? 'treatment' : 'control'
}

type EventPayload = {
  experimentKey?: string
  variant?: Variant
  userId?: string
  anonymousId?: string
  eventName: string
  type: 'exposure' | 'conversion' | 'track'
  properties?: Record<string, unknown>
}

async function sendEvent(payload: EventPayload): Promise<void> {
  try {
    await fetch('/api/pilot-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // Fire-and-forget — never block the UI on a tracking call failing.
  }
}

// Call once when the user is shown their assigned variant.
export function trackExposure(experimentKey: string, variant: Variant, userId: string): Promise<void> {
  return sendEvent({ experimentKey, variant, userId, eventName: 'exposure', type: 'exposure' })
}

// Call when the user completes the action this experiment measures.
export function trackConversion(
  experimentKey: string,
  variant: Variant,
  userId: string,
  eventName: string,
  properties?: Record<string, unknown>
): Promise<void> {
  return sendEvent({ experimentKey, variant, userId, eventName, type: 'conversion', properties })
}

// Call for any standalone product event, independent of any experiment —
// e.g. track('signup_completed', { userId }, { plan: 'pro' }). Requires at
// least one of userId / anonymousId. This is the general-purpose tracking
// call (like posthog.capture / amplitude.track) that feeds Pilot's product
// analysis — segment breakdown, signal detection — outside of any specific
// A/B test.
export function track(
  eventName: string,
  identifiers: { userId?: string; anonymousId?: string },
  properties?: Record<string, unknown>
): Promise<void> {
  return sendEvent({ ...identifiers, eventName, type: 'track', properties })
}
