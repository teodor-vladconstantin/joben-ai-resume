import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { Navbar } from '@/components/ui/Navbar'

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
    <div className="min-h-screen flex flex-col pb-20">
      <Navbar />

      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className="rounded-3xl border border-white/10 bg-[#0A0F0D] p-8">
          <h1 className="text-3xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-sm text-[#FFFFFF]/72">
            Before continuing to sign up, please review and accept our legal terms.
          </p>

          <form action={continueToSignUp} className="mt-6 space-y-4">
            <input type="hidden" name="return_back_url" value={returnBackUrl} />

            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#020202] p-4 text-sm text-[#FFFFFF]/82">
              <input
                type="checkbox"
                name="accept_legal"
                required
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#0A0F0D] text-[#0A9548]"
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#16DB65] hover:text-[#0A9548]">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#16DB65] hover:text-[#0A9548]">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {showLegalError ? (
              <p className="text-sm text-[#16DB65]">You must accept the terms and privacy policy to continue.</p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-linear-to-r from-[#0A9548] to-[#04471C] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Continue to Sign Up
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
