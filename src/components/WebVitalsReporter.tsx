'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'

function reportWebVital(metric: Metric) {
  posthog.capture('web_vital', {
    metric_name: metric.name,
    metric_value: metric.value,
    metric_rating: metric.rating,
    metric_id: metric.id,
    metric_delta: metric.delta,
    navigation_type: metric.navigationType,
    path: window.location.pathname,
  })
}

export function WebVitalsReporter() {
  useEffect(() => {
    onCLS(reportWebVital)
    onFCP(reportWebVital)
    onINP(reportWebVital)
    onLCP(reportWebVital)
    onTTFB(reportWebVital)
  }, [])

  return null
}
