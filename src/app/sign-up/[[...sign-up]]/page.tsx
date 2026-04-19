import { auth } from '@clerk/nextjs/server'

type PageProps = {
  searchParams?: {
    redirect_url?: string | string[]
  }
}

export default async function SignUpPage({ searchParams }: PageProps) {
  const redirectParam = searchParams?.redirect_url
  const returnBackUrl = Array.isArray(redirectParam) ? redirectParam[0] : redirectParam
  const { redirectToSignUp } = await auth()

  return redirectToSignUp({
    returnBackUrl: returnBackUrl || '/dashboard',
  })
}
