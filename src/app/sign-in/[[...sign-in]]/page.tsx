import { auth } from '@clerk/nextjs/server'

type PageProps = {
  searchParams?: {
    redirect_url?: string | string[]
  }
}

export default async function SignInPage({ searchParams }: PageProps) {
  const redirectParam = searchParams?.redirect_url
  const returnBackUrl = Array.isArray(redirectParam) ? redirectParam[0] : redirectParam
  const { redirectToSignIn } = await auth()

  return redirectToSignIn({
    returnBackUrl: returnBackUrl || '/dashboard',
  })
}
