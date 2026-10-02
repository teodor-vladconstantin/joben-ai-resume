import type { ErrorEvent, TransactionEvent } from '@sentry/core'

// sendDefaultPii + Sentry.captureRequestError (src/instrumentation.ts) can
// attach the raw request body to an event for an uncaught exception on any
// route — including the CV-processing routes (parse/analyze/tailor/etc.),
// whose body contains resume text. Strip it before the event leaves the
// process; IP/cookies are left intact since those are needed for abuse
// investigation and are covered as "legitimate interest" in the privacy policy.
// Errors thrown by scripts that the browser shell injects into our pages
// (in-app webviews, link scanners, extensions). None of them originate in our
// code, so they are dropped client-side. Keep every pattern specific to an
// injected bridge: generic network/chunk/hydration errors stay reported.
export const BROWSER_NOISE_ERRORS: RegExp[] = [
  // Outlook/Bing link scanners (CefSharp) crawling emailed links.
  /Object Not Found Matching Id:\d+, MethodName:\w+, ParamCount:\d+/,
  // Android WebView JS bridge torn down on unload (Instagram/Facebook/TikTok).
  /Java object is gone/,
  /Java bridge method invocation error/,
  /Java exception was raised during method invocation/,
  // iOS in-app browsers (Instagram/Facebook, Google app, Bing, Chrome iOS).
  /_AutofillCallbackHandler/,
  /window\.webkit\.messageHandlers/,
  /Can't find variable: gmo/,
  /instantSearchSDKJSBridgeClearHighlight/,
  /__gCrWeb/,
  // Other injected shells: Zalo, Edge Discover, Samsung Internet video helper.
  /zaloJSV2/,
  /msDiscoverChatAvailable/,
  /ceCurrentVideo\.currentTime/,
  // Browser extensions.
  /Extension context invalidated/,
  /runtime\.sendMessage/,
  // Benign layout notifications, never actionable.
  /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/,
]

// Matched against the top stack frame: anything thrown from an extension or an
// injected webview script, whatever its message.
export const BROWSER_NOISE_URLS: RegExp[] = [
  /^(chrome|moz|safari|safari-web|ms-browser)-extension:\/\//,
  /^webkit-masked-url:\/\//,
  /^app:\/\/navigation_performance_logger/,
  /^(user-script|gmonkey):/,
]

export function scrubSentryEvent<T extends ErrorEvent | TransactionEvent>(event: T): T {
  if (event.request?.data) {
    event.request.data = '[Stripped]'
  }
  return event
}
