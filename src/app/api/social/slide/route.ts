import { renderSlide, slideSchema } from '@/lib/social-slide'

export const runtime = 'edge'

const noStore = { 'Cache-Control': 'no-store' }

// Edge has no node:crypto; constant-time compare so the token can't be guessed byte by byte.
function sameToken(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function GET(req: Request) {
  const expected = process.env.SOCIAL_SLIDE_TOKEN
  // Fail closed: without a configured token the endpoint does not exist.
  if (!expected) return new Response('Not found', { status: 404, headers: noStore })

  const query = Object.fromEntries(new URL(req.url).searchParams)
  if (typeof query.token !== 'string' || !sameToken(query.token, expected)) {
    return new Response('Unauthorized', { status: 401, headers: noStore })
  }

  const parsed = slideSchema.safeParse(query)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues.map((i) => `${i.path.join('.') || 'query'}: ${i.message}`) },
      { status: 400, headers: noStore }
    )
  }

  try {
    return await renderSlide(parsed.data)
  } catch {
    return new Response('Failed to generate the image', { status: 500, headers: noStore })
  }
}
