"use client"

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export interface HeroWordRotateProps {
  words: string[]
  intervalMs?: number
}

export function HeroWordRotate({ words, intervalMs = 2400 }: HeroWordRotateProps) {
  const [index, setIndex] = useState(0)
  // Reserve width via the longest word's character count instead of rendering
  // every variant as hidden text: the server HTML then only ever contains the
  // one active word, so a non-JS crawler reads a coherent phrase, and there's
  // no post-hydration layout shift either.
  const maxChars = Math.max(...words.map((word) => word.length))

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % words.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [words.length, intervalMs])

  return (
    <span
      className="relative inline-grid align-baseline text-(--accent)"
      style={{ minWidth: `${maxChars}ch` }}
    >
      {/* initial={false}: skip the enter animation on first mount so the
          server-rendered word starts at opacity 1, not 0 — a non-JS crawler
          reading the raw HTML sees real text, not a faded-out placeholder. */}
      <AnimatePresence initial={false}>
        <motion.span
          key={words[index]}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="col-start-1 row-start-1 inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
