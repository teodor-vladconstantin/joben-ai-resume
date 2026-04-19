import { SignIn } from '@clerk/nextjs'
import { clerkAppearance } from '@/lib/clerk-appearance'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020202] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/50 text-sm">Sign in to continue building your resume</p>
        </div>
        <SignIn
          appearance={clerkAppearance}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}
