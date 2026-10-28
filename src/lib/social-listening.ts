import { logger } from '@/lib/logger'

export interface SocialLead {
  id?: string
  source: 'reddit' | 'linkedin' | 'twitter' | 'facebook' | 'other'
  platformUrl: string
  author: string
  subredditOrGroup?: string
  title: string
  body: string
  matchedKeywords: string[]
  relevanceScore?: number
  suggestedResponse?: string
}

export function generateHelpfulResponseDraft(lead: SocialLead): string {
  const isRo = true // Targets Romanian communities predominantly

  return (
    `Salut, ${lead.author}! ` +
    `Legat de situația menționată, una dintre cele mai frecvente cauze pentru care CV-urile nu primesc răspuns este parsarea deficitară în softurile ATS (Applicant Tracking Systems) folosite de recrutorii din România.\n\n` +
    `Iată 2 sfaturi rapide care fac o diferență majoră:\n` +
    `1. Înlocuiește descrierile pasive ale sarcinilor cu realizări măsurabile (adaugă cifre, procente sau unelte exacte: ex. „Crescut vânzările cu 20%”, „Redus timpul de procesare”).\n` +
    `2. Folosește o structură standard pe o singură coloană fără grafice sau pictograme, care adesea corup ordinea textului la extragere.\n\n` +
    `Dacă vrei să vezi exact cum îți este citit CV-ul de un parser ATS real și să verifici ce erori critice ai, poți rula o scanare gratuită fără cont pe https://joben.eu/ro/verificare-cv-ats.\n\n` +
    `Mult succes la interviuri!`
  )
}

export async function sendTelegramNotification(
  lead: SocialLead,
  telegramBotToken?: string,
  telegramChatId?: string
): Promise<boolean> {
  const token = telegramBotToken || process.env.TELEGRAM_BOT_TOKEN
  const chatId = telegramChatId || process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    logger.info('Telegram notifications not configured, skipping send', {
      source: 'social_listening',
    })
    return false
  }

  const responseDraft = lead.suggestedResponse || generateHelpfulResponseDraft(lead)

  const text =
    `🎯 *Lead Nou Social Listening - Joben.eu*\n\n` +
    `📍 *Sursă:* ${lead.source.toUpperCase()} ${lead.subredditOrGroup ? `(${lead.subredditOrGroup})` : ''}\n` +
    `👤 *Autor:* ${lead.author}\n` +
    `🔗 *Link:* ${lead.platformUrl}\n` +
    `🔑 *Cuvinte cheie:* ${lead.matchedKeywords.join(', ')}\n\n` +
    `📝 *Titlu postare:*\n"${lead.title}"\n\n` +
    `💬 *Schiță de răspuns recomandată (Copy & Paste):*\n\`\`\`\n${responseDraft}\n\`\`\``

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    })

    return res.ok
  } catch (err) {
    logger.error('Failed to send Telegram social lead alert', {
      error: err instanceof Error ? err.message : 'Unknown error',
    })
    return false
  }
}

export async function sendDiscordNotification(
  lead: SocialLead,
  discordWebhookUrl?: string
): Promise<boolean> {
  const webhookUrl = discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    logger.info('Discord webhook not configured, skipping send', {
      source: 'social_listening',
    })
    return false
  }

  const responseDraft = lead.suggestedResponse || generateHelpfulResponseDraft(lead)

  const payload = {
    username: 'Joben Social Listening Bot',
    avatar_url: 'https://joben.eu/jobeneu_logo.jpg',
    embeds: [
      {
        title: `🎯 Lead Nou: ${lead.title.slice(0, 200)}`,
        url: lead.platformUrl,
        color: 0x10b981, // Emerald green
        fields: [
          { name: 'Sursă / Comunitate', value: `${lead.source.toUpperCase()} ${lead.subredditOrGroup ? `(${lead.subredditOrGroup})` : ''}`, inline: true },
          { name: 'Autor', value: lead.author, inline: true },
          { name: 'Cuvinte cheie', value: lead.matchedKeywords.join(', ') || 'General', inline: true },
          { name: 'Conținut Extras', value: lead.body ? lead.body.slice(0, 300) + '...' : 'Fără descriere' },
          { name: '💡 Schiță Răspuns (Copy & Paste)', value: `\`\`\`${responseDraft.slice(0, 1000)}\`\`\`` },
        ],
        footer: { text: 'Joben.eu Growth Engine' },
        timestamp: new Date().toISOString(),
      },
    ],
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    return res.ok
  } catch (err) {
    logger.error('Failed to send Discord social lead alert', {
      error: err instanceof Error ? err.message : 'Unknown error',
    })
    return false
  }
}
