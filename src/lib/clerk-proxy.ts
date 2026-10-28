// Opt-in Clerk Frontend API proxy: the browser talks to <host>/__clerk instead
// of clerk.joben.eu, so a CNAME/DNS outage there cannot take login down.
// Off by default; flip NEXT_PUBLIC_CLERK_PROXY=true in Vercel and redeploy.
export const CLERK_PROXY_ENABLED = process.env.NEXT_PUBLIC_CLERK_PROXY === 'true'
export const CLERK_PROXY_PATH = '/__clerk'
