"use client"

import dynamic from 'next/dynamic'

const ResumeBuilderNoSSR = dynamic(
  () => import('@/components/builder/ResumeBuilder').then((m) => m.ResumeBuilder),
  { ssr: false }
)

export function ResumeBuilderMount() {
  return <ResumeBuilderNoSSR />
}
