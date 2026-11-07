#!/usr/bin/env node

/**
 * Joben.eu - Autonomous Social Listening Monitor
 * Monitors public discussion boards (Reddit, etc.) for CV/ATS/Career discussions,
 * crafts value-first consultative response drafts, and posts them to Telegram/Discord via the Joben webhook.
 */

const KEYWORDS = [
  'cv',
  'ats',
  'curriculum vitae',
  'optimizare cv',
  'refuzat',
  'interviu',
  'recrutare',
  'parere cv',
  'review cv',
  'model cv',
  'caut job',
]

const TARGET_SUBREDDITS = ['programare', 'Romania', 'recrutare_ro']

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const WEBHOOK_SECRET = process.env.SOCIAL_LISTENING_WEBHOOK_SECRET
if (!WEBHOOK_SECRET) {
  console.error('SOCIAL_LISTENING_WEBHOOK_SECRET is required')
  process.exit(1)
}

async function fetchSubredditPosts(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=25`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobenSocialBot/1.0; +https://joben.eu)',
      },
    })
    if (!res.ok) {
      console.warn(`[WARN] Failed to fetch r/${subreddit}: HTTP ${res.status}`)
      return []
    }
    const data = await res.json()
    return data?.data?.children?.map((c) => c.data) || []
  } catch (err) {
    console.error(`[ERROR] Network error fetching r/${subreddit}:`, err.message)
    return []
  }
}

function findMatchedKeywords(title, body) {
  const text = `${title} ${body}`.toLowerCase()
  return KEYWORDS.filter((kw) => text.includes(kw))
}

function generateResponseDraft(author) {
  return (
    `Salut, ${author}! ` +
    `Legat de optimizarea CV-ului, una dintre cele mai mari probleme este că filtrele ATS resping automat formatele complexe (tabele, coloane multiple, iconițe) și descrierile fără cifre.\n\n` +
    `Câteva recomandări practice:\n` +
    `1. Înlocuiește formulările pasive cu verbe de acțiune și cifre concrete (ex. „Crescut vânzările cu 25%”, „Redus timpul de procesare”).\n` +
    `2. Folosește o structură curată pe o singură coloană.\n\n` +
    `Dacă vrei să vezi gratuit ce erori de compatibilitate ATS are CV-ul tău, poți face o verificare instantă pe https://joben.eu/ro/verificare-cv-ats.\n\n` +
    `Spor la interviuri!`
  )
}

async function forwardLeadToWebhook(lead) {
  const webhookUrl = `${APP_URL}/api/webhooks/social-listening`
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WEBHOOK_SECRET}`,
      },
      body: JSON.stringify(lead),
    })

    const data = await res.json()
    if (res.ok) {
      console.log(`[SUCCESS] Lead forwarded: "${lead.title.slice(0, 40)}..." (ID: ${data.leadId})`)
    } else {
      console.warn(`[WARN] Webhook rejected lead:`, data.error)
    }
  } catch (err) {
    console.error(`[ERROR] Failed to forward lead to webhook:`, err.message)
  }
}

export async function runSocialListeningScan() {
  console.log(`[START] Running Joben Social Listening Scan at ${new Date().toISOString()}...`)

  let matchedLeadsCount = 0

  for (const sub of TARGET_SUBREDDITS) {
    console.log(`[INFO] Scanning r/${sub}...`)
    const posts = await fetchSubredditPosts(sub)

    for (const post of posts) {
      if (!post.title) continue

      const matched = findMatchedKeywords(post.title, post.selftext || '')
      if (matched.length > 0) {
        matchedLeadsCount++
        const lead = {
          source: 'reddit',
          platformUrl: `https://reddit.com${post.permalink}`,
          author: post.author,
          subredditOrGroup: `r/${sub}`,
          title: post.title,
          body: post.selftext || '',
          matchedKeywords: matched,
          relevanceScore: Math.min(100, matched.length * 25),
          suggestedResponse: generateResponseDraft(post.author),
        }

        console.log(`[MATCH] Found relevant post in r/${sub} by ${post.author}: "${post.title.slice(0, 50)}..."`)
        await forwardLeadToWebhook(lead)
      }
    }
  }

  console.log(`[DONE] Scan finished. Total matched leads: ${matchedLeadsCount}`)
  return matchedLeadsCount
}

// If run directly from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  runSocialListeningScan()
}
