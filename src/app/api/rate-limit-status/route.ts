import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getRateLimitStatus } from '@/lib/ratelimit'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = await getRateLimitStatus(userId)
  return NextResponse.json(status, { status: 200 })
}
