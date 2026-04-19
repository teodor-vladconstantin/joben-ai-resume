export async function startProCheckout() {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const payload = (await response.json()) as { url?: string; error?: string }
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || 'Could not start checkout.')
  }

  if (typeof window !== 'undefined') {
    window.location.assign(payload.url)
  }
}
