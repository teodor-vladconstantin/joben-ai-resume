"use client"

import dynamic from 'next/dynamic'
import { TourLauncher } from '@/components/onboarding/TourLauncher'

const ResumeBuilderNoSSR = dynamic(
  () => import('@/components/builder/ResumeBuilder').then((m) => m.ResumeBuilder),
  { ssr: false }
)

export function ResumeBuilderMount() {
  return (
    <>
      <ResumeBuilderNoSSR />
      <TourLauncher tourId="editor" />
    </>
  )
}
