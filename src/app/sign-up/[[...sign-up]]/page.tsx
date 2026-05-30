import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { FileText } from 'lucide-react'

type SearchValue = string | string[] | undefined

type PageProps = {
  searchParams?: {
    redirect_url?: SearchValue
    legal_error?: SearchValue
  }
}

function firstSearchValue(value: SearchValue): string {
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

function sanitizeReturnBackUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '/dashboard'
  if (!trimmed.startsWith('/')) return '/dashboard'
  if (trimmed.startsWith('//')) return '/dashboard'
  return trimmed
}

export default async function SignUpPage({ searchParams }: PageProps) {
  const redirectParam = firstSearchValue(searchParams?.redirect_url)
  const returnBackUrl = sanitizeReturnBackUrl(redirectParam)
  const showLegalError = firstSearchValue(searchParams?.legal_error) === '1'
  const { userId } = await auth()

  if (userId) {
    redirect(returnBackUrl)
  }

  async function continueToSignUp(formData: FormData) {
    'use server'

    const accepted = formData.get('accept_legal') === 'on'
    const rawReturnBack = typeof formData.get('return_back_url') === 'string'
      ? (formData.get('return_back_url') as string)
      : ''
    const safeReturnBack = sanitizeReturnBackUrl(rawReturnBack)

    if (!accepted) {
      redirect(`/sign-up?legal_error=1&redirect_url=${encodeURIComponent(safeReturnBack)}`)
    }

    const { redirectToSignUp } = await auth()
    return redirectToSignUp({
      returnBackUrl: safeReturnBack,
    })
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-bg-surface border border-border-soft rounded-xl p-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-text-primary mb-6 justify-center">
          <FileText size={20} />
          <span className="font-semibold text-heading">Joben</span>
        </Link>

        <h1 className="text-title font-semibold text-text-primary text-center">
          Create your account
        </h1>
        <p className="mt-2 text-small text-text-secondary text-center">
          Before continuing, please review and accept our legal terms.
        </p>

        <form action={continueToSignUp} className="mt-6 space-y-4">
          <input type="hidden" name="return_back_url" value={returnBackUrl} />

          <label className="flex items-start gap-3 rounded-md border border-border-soft bg-bg-subtle p-3 text-small text-text-secondary">
            <input
              type="checkbox"
              name="accept_legal"
              required
              className="mt-0.5 h-4 w-4 rounded border-border-soft bg-bg-subtle text-accent focus:ring-accent"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {showLegalError ? (
            <p className="text-small text-error">You must accept the terms and privacy policy to continue.</p>
          ) : null}

          <button
            type="submit"
            className="w-full px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-body font-medium rounded-md border border-accent-border transition-colors"
          >
            Continue to Sign Up
          </button>
        </form>

        <p className="mt-4 text-center text-small text-text-muted">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
