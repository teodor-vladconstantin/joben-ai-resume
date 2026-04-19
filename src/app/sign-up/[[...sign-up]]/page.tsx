import { SignUp } from '@clerk/nextjs'
import { clerkAppearance } from '@/lib/clerk-appearance'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020202] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-white/50 text-sm">Start building ATS-optimized resumes for free</p>
        </div>
        <SignUp appearance={clerkAppearance} />
      </div>
    </div>
  )
}
